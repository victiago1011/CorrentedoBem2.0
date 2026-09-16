import { NextRequest, NextResponse } from 'next/server';

const ADMIN_NOTIFY_EMAIL = 'robinho@correntedobembr.com.br';
const FROM_EMAIL = 'Corrente do Bem <contato@send.correntedobembr.com.br>';
const ADMIN_PANEL_URL = 'https://correntedobembr.com.br/admin';

const NOTIFY_TYPES = [
  'contact',
  'new_job',
  'new_talent',
  'new_business',
  'new_testimonial',
] as const;

type NotifyType = (typeof NOTIFY_TYPES)[number];

function isNotifyType(value: unknown): value is NotifyType {
  return typeof value === 'string' && (NOTIFY_TYPES as readonly string[]).includes(value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asTrimmedString(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function displayValue(value: unknown, maxLength = 500): string {
  const text = asTrimmedString(value, maxLength);
  return text ? escapeHtml(text) : 'Não informado';
}

function wrapEmail(title: string, intro: string, rows: Array<[string, string]>, extraFooter?: string): string {
  const tableRows = rows
    .map(
      ([label, value]) => `
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; width: 150px; vertical-align: top;">${escapeHtml(label)}:</td>
                      <td style="padding: 6px 0; color: #010101; white-space: pre-wrap;">${value}</td>
                    </tr>`
    )
    .join('');

  return `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #00628c; margin-top: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">${escapeHtml(title)}</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">${escapeHtml(intro)}</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 12px;">
                  <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
                    ${tableRows}
                  </table>
                </div>
                ${extraFooter || ''}
                <div style="text-align: center; margin-top: 25px;">
                  <a href="${ADMIN_PANEL_URL}" style="background-color: #00628c; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Acessar Painel de Moderação</a>
                </div>
              </div>
            `;
}

function buildNotification(type: NotifyType, fields: Record<string, unknown>): {
  subject: string;
  html: string;
  replyTo?: string;
} {
  switch (type) {
    case 'contact': {
      const replyTo = asTrimmedString(fields.email, 254);
      const enviadoEm = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        subject: `Novo contato pelo site — ${asTrimmedString(fields.assunto, 120) || 'Dúvida Geral'}`,
        replyTo: replyTo || undefined,
        html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #00628c; margin-top: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Novo contato pelo site</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">Uma nova mensagem foi enviada pelo formulário de contato.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 12px;">
                  <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; width: 120px;">Nome:</td>
                      <td style="padding: 6px 0; color: #010101;">${displayValue(fields.nome)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">E-mail:</td>
                      <td style="padding: 6px 0; color: #010101;">${displayValue(fields.email)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Assunto:</td>
                      <td style="padding: 6px 0; color: #010101;">${displayValue(fields.assunto)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Mensagem:</td>
                      <td style="padding: 6px 0; color: #010101; white-space: pre-wrap;">${displayValue(fields.mensagem, 4000)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Data e hora:</td>
                      <td style="padding: 6px 0; color: #010101;">${escapeHtml(enviadoEm)}</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                  Para responder ao visitante, basta clicar em &ldquo;Responder&rdquo;. A resposta será enviada diretamente para o e-mail informado no formulário.
                </p>

                <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                  Esta mensagem foi enviada através do formulário de contato do site Corrente do Bem.
                </p>
              </div>
            `,
      };
    }
    case 'new_job':
      return {
        subject: '🔔 Nova Vaga Cadastrada na Corrente do Bem',
        html: wrapEmail(
          '🔔 Nova Vaga Recebida!',
          'Uma nova vaga de emprego foi submetida no site e está aguardando revisão no Painel Admin.',
          [
            ['Título', displayValue(fields.title)],
            ['Empresa', displayValue(fields.company)],
            ['E-mail', displayValue(fields.email)],
            ['Telefone', displayValue(fields.phone)],
            ['Local', displayValue(fields.location)],
            ['Tipo/Área', `${displayValue(fields.type)} / ${displayValue(fields.area)}`],
          ]
        ),
      };
    case 'new_talent':
      return {
        subject: '🔔 Novo Currículo Cadastrado na Corrente do Bem',
        html: wrapEmail(
          '🔔 Novo Candidato/Talento Recebido!',
          'Um novo currículo/perfil de candidato foi cadastrado no site e está aguardando revisão no Painel Admin.',
          [
            ['Nome', displayValue(fields.name)],
            ['Função/Cargo', displayValue(fields.role)],
            ['E-mail', displayValue(fields.email)],
            ['Telefone', displayValue(fields.phone)],
            ['Localidade', displayValue(fields.location)],
          ]
        ),
      };
    case 'new_business':
      return {
        subject: '🔔 Novo Negócio Cadastrado na Corrente do Bem',
        html: wrapEmail(
          '🔔 Nova Proposta de Negócio Recebida!',
          'Uma nova oportunidade ou proposta de negócio foi cadastrada no site e está aguardando revisão no Painel Admin.',
          [
            ['Título do Negócio', displayValue(fields.title)],
            ['Nome do Dono', displayValue(fields.owner_name)],
            ['E-mail do Proprietário', displayValue(fields.contact_email)],
            ['Telefone', displayValue(fields.contact_phone)],
            ['Tipo/Área', `${displayValue(fields.type)} / ${displayValue(fields.area)}`],
          ]
        ),
      };
    case 'new_testimonial': {
      const role = asTrimmedString(fields.role);
      const company = asTrimmedString(fields.company);
      const vinculo = `${role || 'Não informado'}${company ? ` na ${company}` : ''}`;
      return {
        subject: '🔔 Novo Depoimento Cadastrado na Corrente do Bem',
        html: wrapEmail(
          '🔔 Novo Depoimento Recebido!',
          'Um novo depoimento foi enviado no site e está aguardando revisão no Painel Admin.',
          [
            ['Autor', displayValue(fields.name)],
            ['Cargo / Vínculo', escapeHtml(vinculo)],
            ['E-mail', displayValue(fields.email)],
            ['Depoimento', `"${displayValue(fields.content, 4000)}"`],
          ]
        ),
      };
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type;
    const fields = body?.fields;

    if (!isNotifyType(type)) {
      return NextResponse.json({ error: 'Tipo de notificação inválido.' }, { status: 400 });
    }

    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
      return NextResponse.json({ error: 'Campos da notificação são obrigatórios.' }, { status: 400 });
    }

    if (type === 'contact') {
      const nome = asTrimmedString(fields.nome, 200);
      const email = asTrimmedString(fields.email, 254);
      const mensagem = asTrimmedString(fields.mensagem, 4000);
      if (!nome || !email || !mensagem) {
        return NextResponse.json(
          { error: 'Nome, e-mail e mensagem são obrigatórios.' },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'A chave de API do Resend (RESEND_API_KEY) não está configurada no servidor. Por favor, adicione-a nas variáveis de ambiente.',
        },
        { status: 500 }
      );
    }

    const notification = buildNotification(type, fields as Record<string, unknown>);

    const payload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      reply_to?: string;
    } = {
      from: FROM_EMAIL,
      to: [ADMIN_NOTIFY_EMAIL],
      subject: notification.subject,
      html: notification.html,
    };

    if (notification.replyTo) {
      payload.reply_to = notification.replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Erro ao enviar e-mail através da API do Resend.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor ao processar o envio de e-mail.';
    console.error('Error in notify-admin api:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
