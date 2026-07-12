import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';
import {
  fetchAllNewsletterSubscribers,
  isValidEmail,
  normalizeEmail,
  type NewsletterSubscriberRow,
} from '@/lib/newsletter-utils';
import { ensureExternalLink } from '@/lib/utils';

const PUBLIC_SITE_URL = 'https://www.correntedobembr.com.br';
const FROM_EMAIL = 'Corrente do Bem <contato@send.correntedobembr.com.br>';
const MAX_SELECTED_IDS = 20;
const MAX_TEST_EMAILS = 10;

const CAMPAIGN_CATEGORIES = [
  'curriculos',
  'vagas',
  'noticias',
  'eventos',
  'institucional',
  'outros',
] as const;

type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];
type CampaignStatus = 'processing' | 'sent' | 'partial' | 'failed';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isCampaignCategory(value: unknown): value is CampaignCategory {
  return typeof value === 'string' && (CAMPAIGN_CATEGORIES as readonly string[]).includes(value);
}

function normalizeCampaignButtonLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  return ensureExternalLink(trimmed);
}

/** Both filled or both null — matches DB constraint. */
function normalizeButtonFields(
  text: unknown,
  link: unknown
): { primary_button_text: string | null; primary_button_link: string | null } {
  const t = typeof text === 'string' ? text.trim() : '';
  const l = typeof link === 'string' ? link.trim() : '';

  if (!t && !l) {
    return { primary_button_text: null, primary_button_link: null };
  }

  if (t && l) {
    return {
      primary_button_text: t,
      primary_button_link: normalizeCampaignButtonLink(l),
    };
  }

  throw new Error(
    'O texto e o link do botão devem ser preenchidos juntos, ou ambos deixados em branco.'
  );
}

function resolveFinalStatus(successCount: number, failureCount: number): CampaignStatus {
  if (successCount > 0 && failureCount === 0) return 'sent';
  if (successCount > 0 && failureCount > 0) return 'partial';
  return 'failed';
}

function summarizeResendError(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Resposta inválida do Resend.';
  }

  const err = data as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof err.message === 'string' && err.message.trim()) {
    parts.push(err.message.trim());
  }
  if (typeof err.name === 'string' && err.name.trim()) {
    parts.push(`(${err.name})`);
  }
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    const nested = err.errors
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'message' in item) {
          return String((item as { message?: unknown }).message ?? item);
        }
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .slice(0, 3)
      .join('; ');
    if (nested) parts.push(nested);
  }

  return parts.length > 0 ? parts.join(' ') : 'Erro desconhecido do Resend.';
}

function normalizeSubscriberIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (!UUID_RE.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

export async function POST(req: NextRequest) {
  let campaignId: string | null = null;

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return auth.response;
    }

    const {
      subject,
      content,
      category,
      primaryButtonText,
      primaryButtonLink,
      testEmail,
      testEmails,
      subscriberIds,
    } = await req.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Assunto (subject) e Conteúdo (content) são obrigatórios.' },
        { status: 400 }
      );
    }

    let buttonFields: {
      primary_button_text: string | null;
      primary_button_link: string | null;
    };
    try {
      buttonFields = normalizeButtonFields(primaryButtonText, primaryButtonLink);
    } catch (buttonErr) {
      const message =
        buttonErr instanceof Error ? buttonErr.message : 'Dados do botão inválidos.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A chave de API do Resend (RESEND_API_KEY) não está configurada no servidor.' },
        { status: 500 }
      );
    }

    const host = req.headers.get('host') || 'correntedobembr.com.br';
    const baseUrl = `https://${host}`;

    const renderTemplate = (subId: string, subNome: string, recipientEmail: string) => {
      let personalizedContent = content;
      const namePlaceholder = subNome || 'Amigo(a)';
      personalizedContent = personalizedContent.replace(/\{\{\s*nome\s*\}\}/gi, namePlaceholder);
      personalizedContent = personalizedContent.replace(/\{\{\s*email\s*\}\}/gi, recipientEmail);

      let actionButtonHtml = '';
      if (buttonFields.primary_button_text && buttonFields.primary_button_link) {
        const trackedLink = `${PUBLIC_SITE_URL}/api/track-click?id=${subId}&url=${encodeURIComponent(buttonFields.primary_button_link)}`;
        actionButtonHtml = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackedLink}" style="background-color: #00628c; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,98,140,0.2);">
              ${buttonFields.primary_button_text}
            </a>
          </div>
        `;
      }

      const unsubscribeLink = `${baseUrl}/api/unsubscribe?id=${subId}`;

      return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155; line-height: 1.6; margin: 0; padding: 0; }
            .content-area p { margin-bottom: 16px; }
            .content-area ul, .content-area ol { margin-bottom: 16px; padding-left: 20px; }
          </style>
        </head>
        <body style="background-color: #f8fafc; padding: 20px 10px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="background-color: #00628c; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.025em;">Corrente do Bem</h1>
              <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Conectando Talentos e Oportunidades</p>
            </div>
            
            <div style="padding: 30px 24px;" class="content-area">
              ${personalizedContent}
              
              ${actionButtonHtml}
            </div>

            <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 8px 0;">Você está recebendo este e-mail porque faz parte da rede da <strong>Corrente do Bem</strong>.</p>
              <p style="margin: 0 0 16px 0;">Corrente do Bem © ${new Date().getFullYear()} — Todos os direitos reservados.</p>
              <div style="margin-top: 12px;">
                <a href="${unsubscribeLink}" style="color: #64748b; text-decoration: underline; font-weight: 500;">
                  Não quero mais receber estes e-mails (Descadastrar)
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    const hasTestEmails = Array.isArray(testEmails) && testEmails.length > 0;
    const hasLegacyTestEmail = typeof testEmail === 'string' && testEmail.trim().length > 0;
    const isTestRequest = hasTestEmails || hasLegacyTestEmail;
    const selectedIds = normalizeSubscriberIdList(subscriberIds);
    const isSelectedRequest = selectedIds.length > 0;

    if (isTestRequest && isSelectedRequest) {
      return NextResponse.json(
        { error: 'Não é possível combinar envio de teste com envio para selecionados na mesma requisição.' },
        { status: 400 }
      );
    }

    // Case 1: Test — no email_campaigns
    if (isTestRequest) {
      const mockId = '00000000-0000-0000-0000-000000000000';
      let recipients: string[] = [];

      if (hasTestEmails) {
        if (testEmails.length > MAX_TEST_EMAILS) {
          return NextResponse.json(
            { error: `O teste aceita no máximo ${MAX_TEST_EMAILS} destinatários.` },
            { status: 400 }
          );
        }

        const invalidEmails: string[] = [];
        const seen = new Set<string>();

        for (const raw of testEmails) {
          if (typeof raw !== 'string') {
            invalidEmails.push(String(raw));
            continue;
          }
          const normalized = normalizeEmail(raw);
          if (!isValidEmail(normalized)) {
            invalidEmails.push(raw.trim());
            continue;
          }
          if (!seen.has(normalized)) {
            seen.add(normalized);
            recipients.push(normalized);
          }
        }

        if (invalidEmails.length > 0) {
          return NextResponse.json(
            {
              error: 'Um ou mais e-mails de teste são inválidos.',
              invalidEmails,
            },
            { status: 400 }
          );
        }

        if (recipients.length === 0) {
          return NextResponse.json(
            { error: 'Informe ao menos um e-mail válido para o teste.' },
            { status: 400 }
          );
        }
      } else {
        // Compatibilidade temporária com testEmail (legado)
        const normalized = normalizeEmail(String(testEmail));
        if (!isValidEmail(normalized)) {
          return NextResponse.json(
            { error: 'O e-mail de teste informado é inválido.' },
            { status: 400 }
          );
        }
        recipients = [normalized];
      }

      const sendTestEmail = async (recipientEmail: string) => {
        const testHtml = renderTemplate(mockId, 'Testador', recipientEmail);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [recipientEmail],
            subject: `[TEST CAMPAIGN] ${subject}`,
            html: testHtml,
          }),
        });

        const data = await res.json();
        return { res, data };
      };

      if (recipients.length === 1) {
        const { res, data } = await sendTestEmail(recipients[0]);
        if (!res.ok) {
          const errorDetails = summarizeResendError(data);
          console.error('[send-campaign] Resend test email error:', {
            status: res.status,
            statusText: res.statusText,
            response: data,
          });
          return NextResponse.json(
            {
              error: 'Erro do Resend ao enviar e-mail de teste',
              resendMessage: errorDetails,
              errorDetails,
            },
            { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
          );
        }

        return NextResponse.json({
          success: true,
          sentCount: 1,
          message: 'E-mail de teste enviado com sucesso!',
        });
      }

      const batchPayload = recipients.map((recipientEmail) => ({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject: `[TEST CAMPAIGN] ${subject}`,
        html: renderTemplate(mockId, 'Testador', recipientEmail),
      }));

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(batchPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorDetails = summarizeResendError(data);
        console.error('[send-campaign] Resend manual test batch error:', {
          status: res.status,
          statusText: res.statusText,
          recipientCount: recipients.length,
          response: data,
        });
        return NextResponse.json(
          {
            error: 'Erro do Resend ao enviar e-mails de teste',
            resendMessage: errorDetails,
            errorDetails,
          },
          { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
        );
      }

      return NextResponse.json({
        success: true,
        sentCount: recipients.length,
        message: `E-mails de teste enviados para ${recipients.length} destinatários.`,
      });
    }

    // Cases 2–3: real campaign (selected or all) — category required
    if (!isCampaignCategory(category)) {
      return NextResponse.json(
        {
          error:
            'Categoria obrigatória. Use: curriculos, vagas, noticias, eventos, institucional ou outros.',
        },
        { status: 400 }
      );
    }

    let subscribers: NewsletterSubscriberRow[] = [];
    let recipientsCount = 0;

    if (isSelectedRequest) {
      if (selectedIds.length > MAX_SELECTED_IDS) {
        return NextResponse.json(
          { error: `O envio para selecionados aceita no máximo ${MAX_SELECTED_IDS} destinatários.` },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, nome, email')
        .in('id', selectedIds)
        .eq('ativo', true);

      if (error) {
        console.error('[send-campaign] Failed to load selected subscribers:', error.message);
        return NextResponse.json(
          { error: 'Não foi possível carregar os inscritos selecionados.', errorDetails: error.message },
          { status: 500 }
        );
      }

      subscribers = (data ?? []) as NewsletterSubscriberRow[];
      recipientsCount = subscribers.length;

      if (recipientsCount === 0) {
        return NextResponse.json(
          { error: 'Nenhum inscrito ativo válido foi encontrado para os IDs informados.' },
          { status: 400 }
        );
      }
    } else {
      subscribers = await fetchAllNewsletterSubscribers(supabase, {
        activeOnly: true,
        columns: 'id, nome, email',
      });
      recipientsCount = subscribers.length;

      if (recipientsCount === 0) {
        return NextResponse.json(
          { error: 'Nenhum contato ativo encontrado na lista de inscritos.' },
          { status: 400 }
        );
      }
    }

    const invalidEmails: string[] = [];
    const validSubscribers = subscribers.filter((sub) => {
      const normalized = normalizeEmail(sub.email);
      if (!isValidEmail(normalized)) {
        invalidEmails.push(sub.email);
        return false;
      }
      return true;
    });

    const totalValidEmails = validSubscribers.length;

    if (totalValidEmails === 0) {
      return NextResponse.json({
        success: false,
        successCount: 0,
        failureCount: 0,
        invalidEmails,
        totalActiveSubscribers: recipientsCount,
        totalValidEmails: 0,
        message: `Nenhum e-mail válido encontrado entre os ${recipientsCount} contatos selecionados/ativos.`,
      });
    }

    const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
    const supabaseAdmin = getSupabaseAdmin();

    campaignId = randomUUID();

    const { error: insertError } = await supabaseAdmin.from('email_campaigns').insert({
      id: campaignId,
      subject,
      category,
      html_content: content,
      primary_button_text: buttonFields.primary_button_text,
      primary_button_link: buttonFields.primary_button_link,
      from_email: FROM_EMAIL,
      status: 'processing',
      recipients_count: recipientsCount,
      success_count: 0,
      failure_count: 0,
      invalid_count: invalidEmails.length,
      sent_at: null,
    });

    if (insertError) {
      console.error('[send-campaign] Failed to create email_campaigns row:', insertError.message);
      return NextResponse.json(
        {
          error: 'Não foi possível registrar a campanha no banco antes do envio.',
          errorDetails: insertError.message,
        },
        { status: 500 }
      );
    }

    const BATCH_SIZE = 100;
    let successCount = 0;
    let failureCount = 0;
    const batchErrors: string[] = [];

    for (let i = 0; i < totalValidEmails; i += BATCH_SIZE) {
      const slice = validSubscribers.slice(i, i + BATCH_SIZE);

      const batchPayload = slice.map((sub) => {
        const recipientEmail = normalizeEmail(sub.email);
        const personalizedHtml = renderTemplate(sub.id, sub.nome || '', recipientEmail);
        return {
          from: FROM_EMAIL,
          to: [recipientEmail],
          subject: subject,
          html: personalizedHtml,
        };
      });

      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(batchPayload),
        });

        const data = await res.json();

        if (res.ok) {
          successCount += slice.length;
        } else {
          const errorDetails = summarizeResendError(data);
          console.error('[send-campaign] Resend batch error:', {
            offset: i,
            batchSize: slice.length,
            status: res.status,
            statusText: res.statusText,
            response: data,
          });
          batchErrors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${errorDetails}`);
          failureCount += slice.length;
        }
      } catch (batchErr) {
        console.error('[send-campaign] Batch send network/server error:', {
          offset: i,
          batchSize: slice.length,
          error: batchErr,
        });
        batchErrors.push(
          `Lote ${Math.floor(i / BATCH_SIZE) + 1}: falha de rede ou servidor ao contatar o Resend.`
        );
        failureCount += slice.length;
      }
    }

    const finalStatus = resolveFinalStatus(successCount, failureCount);
    const sentAt = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: finalStatus,
        success_count: successCount,
        failure_count: failureCount,
        invalid_count: invalidEmails.length,
        recipients_count: recipientsCount,
        sent_at: sentAt,
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('[send-campaign] Failed to update email_campaigns row:', updateError.message);
    }

    const fullySuccessful = failureCount === 0 && invalidEmails.length === 0;
    const errorDetails = batchErrors.length > 0 ? batchErrors.slice(0, 3).join(' | ') : undefined;
    const modeLabel = isSelectedRequest ? 'selecionados' : 'todos os ativos';

    await supabase.from('history').insert({
      action: 'Campanha de E-mail Enviada',
      details: `Campanha "${subject}" (${modeLabel}) enviada para ${successCount} destinatários válidos. Falhas no envio: ${failureCount}. Inválidos ignorados: ${invalidEmails.length}.${errorDetails ? ` Erros: ${errorDetails}` : ''}`,
    });

    return NextResponse.json({
      success: fullySuccessful,
      successCount,
      failureCount,
      invalidEmails,
      totalActiveSubscribers: recipientsCount,
      totalValidEmails,
      errorDetails,
      campaignId,
      status: finalStatus,
      mode: isSelectedRequest ? 'selected' : 'all',
      message: fullySuccessful
        ? `Campanha processada: ${successCount} enviados com sucesso.`
        : `Campanha processada: ${successCount} enviados, ${failureCount} falhas no envio, ${invalidEmails.length} e-mails inválidos ignorados.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro interno.';
    console.error('[send-campaign] Unexpected error:', message);

    if (campaignId) {
      try {
        const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin
          .from('email_campaigns')
          .update({
            status: 'failed',
            sent_at: new Date().toISOString(),
          })
          .eq('id', campaignId);
      } catch (updateErr) {
        const updateMessage =
          updateErr instanceof Error ? updateErr.message : 'Falha ao marcar campanha como failed.';
        console.error('[send-campaign] Failed to mark campaign as failed:', updateMessage);
      }
    }

    return NextResponse.json(
      {
        error: message,
        errorDetails: message,
      },
      { status: 500 }
    );
  }
}
