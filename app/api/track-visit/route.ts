import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Buscamos se já existe um registro para o dia de hoje
    const { data: todayRow, error: findError } = await supabase
      .from('site_analytics')
      .select('*')
      .eq('visit_date', today)
      .maybeSingle();

    if (findError) {
      // Se der erro porque a tabela ainda não foi criada no banco
      return NextResponse.json({ error: 'Tabela site_analytics inexistente. Execute o script SQL no painel.' }, { status: 400 });
    }

    if (todayRow) {
      // Incrementa as visualizações de hoje
      const { error: updateError } = await supabase
        .from('site_analytics')
        .update({
          pageviews_count: (todayRow.pageviews_count || 0) + 1
        })
        .eq('id', todayRow.id);

      if (updateError) throw updateError;
    } else {
      // Cria a linha para o novo dia comercial
      const { error: insertError } = await supabase
        .from('site_analytics')
        .insert({
          visit_date: today,
          pageviews_count: 1,
          unique_visitors_count: 1
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error tracking visit:', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
