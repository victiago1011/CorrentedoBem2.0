import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, replyTo } = await req.json();

    if (!to) {
      return NextResponse.json(
        { error: 'O e-mail do destinatário (to) é obrigatório.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'A chave de API do Resend (RESEND_API_KEY) não está configurada no servidor. Por favor, adicione-a nas variáveis de ambiente.' 
        },
        { status: 500 }
      );
    }

    // Projeto não usa o SDK do Resend — chamada HTTP direta.
    // A API REST espera reply_to; nossa rota aceita replyTo (camelCase) no body.
    const payload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      reply_to?: string;
    } = {
      from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
      to: [to],
      subject: subject,
      html: html,
    };

    if (typeof replyTo === 'string' && replyTo.trim()) {
      payload.reply_to = replyTo.trim();
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
  } catch (error: any) {
    console.error('Error in send-email api:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao processar o envio de e-mail.' },
      { status: 500 }
    );
  }
}
