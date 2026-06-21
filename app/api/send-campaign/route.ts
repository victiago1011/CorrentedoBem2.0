import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { subject, content, primaryButtonText, primaryButtonLink, testEmail } = await req.json();

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
        // Wrap the link with our track-click endpoint
        const trackedLink = `${baseUrl}/api/track-click?id=${subId}&url=${encodeURIComponent(primaryButtonLink)}`;
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

    // Case 1: Send a single Test Email
    if (testEmail) {
      const mockId = '00000000-0000-0000-0000-000000000000';
      const testHtml = renderTemplate(mockId, 'Testador', testEmail);
      
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
          to: [testEmail],
          subject: `[TEST CAMPAIGN] ${subject}`,
          html: testHtml,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro do Resend ao enviar e-mail de teste');
      }

      return NextResponse.json({ success: true, message: 'E-mail de teste enviado com sucesso!' });
    }

    // Case 2: Send Campaign to all Active subscribers
    const { data: subscribers, error: dbError } = await supabase
      .from('newsletter_subscribers')
      .select('id, nome, email')
      .eq('ativo', true);

    if (dbError) throw dbError;

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contato ativo encontrado na lista de inscritos.' },
        { status: 400 }
      );
    }

    // Process in batches of 100 (Resend limit per batch request)
    const BATCH_SIZE = 100;
    const totalSubscribers = subscribers.length;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < totalSubscribers; i += BATCH_SIZE) {
      const slice = subscribers.slice(i, i + BATCH_SIZE);
      
      // Build batch payloads
      const batchPayload = slice.map(sub => {
        const personalizedHtml = renderTemplate(sub.id, sub.nome || '', sub.email);
        return {
          from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
          to: sub.email,
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
          console.error(`Batch send error at offset ${i}:`, data);
          failureCount += slice.length;
        }
      } catch (batchErr) {
        console.error(`Batch send network/server error at offset ${i}:`, batchErr);
        failureCount += slice.length;
      }
    }

    // Log the campaign action in database history
    await supabase.from('history').insert({
      action: 'Campanha de E-mail Enviada',
      details: `Campanha "${subject}" enviada para ${successCount} destinatários ativos. Falhas: ${failureCount}.`
    });

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      total: totalSubscribers,
      message: `Campanha processada: ${successCount} enviados com sucesso, ${failureCount} falhas.`
    });

  } catch (err: any) {
    console.error('Error sending campaign:', err);
    return NextResponse.json({ error: err.message || 'Ocorreu um erro interno.' }, { status: 500 });
  }
}
