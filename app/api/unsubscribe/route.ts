import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const email = searchParams.get('email');
  const resubscribe = searchParams.get('resubscribe') === 'true';

  if (!id && !email) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Descadastrar - Corrente do Bem</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
        <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div class="text-red-500 w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Identificação ausente</h2>
          <p class="text-gray-600 mb-6">Não conseguimos identificar sua inscrição para fazer a remoção automática.</p>
          <a href="https://correntedobembr.com.br" class="inline-block bg-[#00628c] hover:bg-[#004e70] text-white font-bold py-3 px-6 rounded-xl transition duration-200">
            Ir para o Portal
          </a>
        </div>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    let query = supabase.from('newsletter_subscribers');
    let updateQuery;
    
    if (id) {
      updateQuery = query.update({ ativo: !resubscribe }).eq('id', id);
    } else {
      updateQuery = query.update({ ativo: !resubscribe }).eq('email', email);
    }

    const { data, error } = await updateQuery.select();

    if (error) throw error;

    // Get subscriber details
    const subscriber = data && data[0];
    const targetEmail = subscriber ? subscriber.email : (email || '');

    if (resubscribe) {
      // Re-registered successfully page
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inscrição Reativada - Corrente do Bem</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
          <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div class="text-green-500 w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Inscrição reativada!</h2>
            <p class="text-gray-600 mb-1">Seu e-mail <strong>${targetEmail}</strong> foi reinserido com sucesso.</p>
            <p class="text-xs text-gray-400 mb-6">Você voltará a receber nossas oportunidades de impacto social.</p>
            <a href="https://correntedobembr.com.br" class="inline-block bg-[#00628c] hover:bg-[#004e70] text-white font-bold py-3 px-6 rounded-xl transition duration-200">
              Ir para o Portal
            </a>
          </div>
        </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    } else {
      // Unsubscribed successfully page
      const resubLink = `/api/unsubscribe?${id ? `id=${id}` : `email=${encodeURIComponent(targetEmail)}`}&resubscribe=true`;
      
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Descadastro Efetuado - Corrente do Bem</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
          <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div class="text-gray-500 w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Você foi descadastrado</h2>
            <p class="text-gray-600 mb-1">Seu e-mail <strong>${targetEmail}</strong> foi removido da nossa lista de envio.</p>
            <p class="text-xs text-gray-400 mb-6">Você não receberá mais os e-mails informativos ou campanhas de nossa rede.</p>
            
            <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-sm">
              <p class="text-gray-500">Foi um engano?</p>
              <a href="${resubLink}" class="text-[#00628c] hover:underline font-semibold mt-1 inline-block">
                Reativar minha inscrição imediatamente
              </a>
            </div>

            <a href="https://correntedobembr.com.br" class="inline-block bg-[#00628c] hover:bg-[#004e70] text-white font-bold py-3 px-6 rounded-xl transition duration-200 text-sm">
              Voltar ao Portal
            </a>
          </div>
        </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
  } catch (err: any) {
    console.error('Error in unsubscribe process:', err);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro no Descadastro - Corrente do Bem</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
        <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div class="text-red-500 w-16 h-16 mx-auto mb-4 bg-red-150 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Ops! Ocorreu um erro</h2>
          <p class="text-gray-600 mb-6">Não conseguimos atualizar sua inscrição devido a uma falha no servidor.</p>
          <p class="text-xs text-red-400 mb-6">${err.message || 'Código de erro desconhecido'}</p>
          <a href="https://correntedobembr.com.br" class="inline-block bg-[#00628c] hover:bg-[#004e70] text-white font-bold py-3 px-6 rounded-xl transition duration-200">
            Ir para o Portal
          </a>
        </div>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
