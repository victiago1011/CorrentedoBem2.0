import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  fetchAllNewsletterSubscribers,
  isValidEmail,
  normalizeEmail,
} from '@/lib/newsletter-utils';
import { ensureExternalLink } from '@/lib/utils';

const PUBLIC_SITE_URL = 'https://www.correntedobembr.com.br';

function normalizeCampaignButtonLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;

  return ensureExternalLink(trimmed);
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

export async function POST(req: NextRequest) {
  try {
    const { subject, content, primaryButtonText, primaryButtonLink, testEmail, testEmails } = await req.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Assunto (subject) e Conteúdo (content) são obrigatórios.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A chave de API do Resend (RESEND_API_KEY) não está configurada no servidor.' },
        { status: 500 }
      );
    }

    // Determine base URL dynamically or fallback to production
    const host = req.headers.get('host') || 'correntedobembr.com.br';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('ais-dev');
    const protocol = isLocal ? 'https://' : 'https://';
    const baseUrl = `${protocol}${host}`;

    // Helper to generate personalized template for a subscriber
    const renderTemplate = (subId: string, subNome: string, recipientEmail: string) => {
      let personalizedContent = content;
      // Replace name tag if present
      const namePlaceholder = subNome || 'Amigo(a)';
      personalizedContent = personalizedContent.replace(/\{\{\s*nome\s*\}\}/gi, namePlaceholder);
      personalizedContent = personalizedContent.replace(/\{\{\s*email\s*\}\}/gi, recipientEmail);

      let actionButtonHtml = '';
      if (primaryButtonText && primaryButtonLink) {
        const destinationLink = normalizeCampaignButtonLink(primaryButtonLink);
        const trackedLink = `${PUBLIC_SITE_URL}/api/track-click?id=${subId}&url=${encodeURIComponent(destinationLink)}`;
        actionButtonHtml = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackedLink}" style="background-color: #00628c; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,98,140,0.2);">
              ${primaryButtonText}
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
            <!-- Custom Header -->
            <div style="background-color: #00628c; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.025em;">Corrente do Bem</h1>
              <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Conectando Talentos e Oportunidades</p>
            </div>
            
            <!-- Email Body Content -->
            <div style="padding: 30px 24px;" class="content-area">
              ${personalizedContent}
              
              ${actionButtonHtml}
            </div>

            <!-- Email Footer -->
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

    const isTestRequest =
      (typeof testEmail === 'string' && testEmail.trim()) ||
      (Array.isArray(testEmails) && testEmails.length > 0);

    // Case 1: Send Test Email(s)
    if (isTestRequest) {
      const mockId = '00000000-0000-0000-0000-000000000000';
      let recipients: string[] = [];

      if (Array.isArray(testEmails) && testEmails.length > 0) {
        if (testEmails.length > 10) {
          return NextResponse.json(
            { error: 'O teste manual aceita no máximo 10 destinatários.' },
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
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
            to: [recipientEmail],
            subject: `[TEST CAMPAIGN] ${subject}`,
            html: testHtml,
          }),
        });

        const data = await res.json();
        return { res, data, recipientEmail };
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
        from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
        to: [recipientEmail],
        subject: `[TEST CAMPAIGN] ${subject}`,
        html: renderTemplate(mockId, 'Testador', recipientEmail),
      }));

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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

    // Case 2: Send Campaign to all Active subscribers (paginated fetch)
    const subscribers = await fetchAllNewsletterSubscribers(supabase, {
      activeOnly: true,
      columns: 'id, nome, email',
    });

    const totalActiveSubscribers = subscribers.length;

    if (totalActiveSubscribers === 0) {
      return NextResponse.json(
        { error: 'Nenhum contato ativo encontrado na lista de inscritos.' },
        { status: 400 }
      );
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
        totalActiveSubscribers,
        totalValidEmails: 0,
        message: `Nenhum e-mail válido encontrado entre os ${totalActiveSubscribers} contatos ativos.`,
      });
    }

    // Process in batches of 100 (Resend limit per batch request)
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
          from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
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
            'Authorization': `Bearer ${apiKey}`,
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

    const fullySuccessful = failureCount === 0 && invalidEmails.length === 0;
    const errorDetails = batchErrors.length > 0 ? batchErrors.slice(0, 3).join(' | ') : undefined;

    // Log the campaign action in database history
    await supabase.from('history').insert({
      action: 'Campanha de E-mail Enviada',
      details: `Campanha "${subject}" enviada para ${successCount} destinatários válidos. Falhas no envio: ${failureCount}. Inválidos ignorados: ${invalidEmails.length}.${errorDetails ? ` Erros: ${errorDetails}` : ''}`,
    });

    return NextResponse.json({
      success: fullySuccessful,
      successCount,
      failureCount,
      invalidEmails,
      totalActiveSubscribers,
      totalValidEmails,
      errorDetails,
      message: fullySuccessful
        ? `Campanha processada: ${successCount} enviados com sucesso.`
        : `Campanha processada: ${successCount} enviados, ${failureCount} falhas no envio, ${invalidEmails.length} e-mails inválidos ignorados.`,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro interno.';
    console.error('[send-campaign] Unexpected error:', err);
    return NextResponse.json(
      {
        error: message,
        errorDetails: message,
      },
      { status: 500 }
    );
  }
}
