import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const url = searchParams.get('url') || 'https://correntedobembr.com.br';

  if (id) {
    try {
      // First, get current click count to increment safely
      const { data: current, error: getError } = await supabase
        .from('newsletter_subscribers')
        .select('cliques_count')
        .eq('id', id)
        .maybeSingle();

      if (!getError && current) {
        const nextClicks = (current.cliques_count || 0) + 1;
        
        await supabase
          .from('newsletter_subscribers')
          .update({
            cliques_count: nextClicks,
            ultimo_clique: new Date().toISOString(),
            clicou_no_mes: true,
            ativo: true // If they clicked a link, they are definitely active/interacting!
          })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  }

  // Always redirect the user to their target destination
  return NextResponse.redirect(url);
}
