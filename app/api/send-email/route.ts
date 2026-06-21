import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();

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

    // Chamada nativa para a API do Resend usando fetch
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Corrente do Bem <contato@send.correntedobembr.com.br>',
        to: [to],
        subject: subject,
        html: html,
      }),
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
