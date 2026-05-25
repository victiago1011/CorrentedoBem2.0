'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Quote, 
  Plus, 
  User, 
  Loader2,
  Handshake,
  MessageSquare,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/app/components/Navbar';

interface Testimonial {
  id: string | number;
  name: string;
  role?: string;
  company?: string;
  content: string;
  photo_url?: string;
  created_at: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (data) setTestimonials(data);
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] font-body selection:bg-[#00628c]/20 selection:text-[#00628c]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="text-center mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 bg-[#bff444] text-[#141f00] font-bold text-[10px] md:text-xs rounded-full tracking-wider uppercase mb-6"
          >
            Vozes da nossa comunidade
          </motion.div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-[#1b1c1c] mb-6 font-headline tracking-tight">Histórias que transformam</h1>
          <p className="text-[#3e4850] text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Veja como a Corrente do Bem está criando conexões reais e dignidade para profissionais e empresas em todo o país.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link 
              href="/depoimentos/novo" 
              className="inline-flex items-center gap-3 bg-[#fc820c] text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#fc820c]/20 hover:scale-105 transition-all group active:scale-95"
            >
              <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Escrever meu Depoimento
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="w-12 h-12 text-[#00628c] animate-spin" />
             <p className="font-bold text-[#00628c] animate-pulse">Carregando histórias...</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {testimonials.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="break-inside-avoid bg-white p-10 rounded-[2.5rem] shadow-xl border border-[#bec8d1]/10 flex flex-col group hover:shadow-2xl hover:shadow-[#00628c]/5 transition-all"
              >
                <Quote className="w-12 h-12 text-[#fc820c] opacity-20 mb-6 group-hover:scale-110 transition-transform" />
                <p className="text-[#1b1c1c] text-lg leading-relaxed mb-8 italic font-medium">
                  &quot;{t.content}&quot;
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-[#bec8d1]/10 mt-auto">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f6f3f2] border-2 border-[#00628c]/10 shrink-0">
                    {t.photo_url ? (
                      <Image src={t.photo_url} alt={t.name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#bec8d1]">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1b1c1c] truncate">{t.name}</p>
                    <p className="text-sm text-[#00628c] font-semibold truncate leading-tight">
                       {t.role} {t.company && (
                         <span className="text-[#3e4850] font-normal block md:inline md:ml-1 mt-0.5 md:mt-0 opacity-80">em {t.company}</span>
                       )}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && testimonials.length === 0 && (
          <div className="text-center py-20">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#bec8d1]/10">
                <Quote className="w-12 h-12 text-[#bec8d1]" />
             </div>
             <p className="text-xl font-bold text-[#3e4850]">Ainda não temos depoimentos para exibir.</p>
             <Link href="/depoimentos/novo" className="text-[#00628c] font-bold mt-4 inline-block hover:underline">
                Seja o primeiro a contar sua história clicando aqui!
             </Link>
          </div>
        )}

        <div className="mt-20 lg:mt-32 text-center">
           <div className="bg-white p-10 lg:p-16 rounded-[3rem] shadow-2xl border border-[#bec8d1]/10 max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1b1c1c] mb-6 font-headline">Sua história pode mudar vidas</h2>
              <p className="text-[#3e4850] text-lg mb-10 leading-relaxed">
                Cada depoimento é uma prova de que a empatia e a oportunidade andam juntas. Ajude-nos a mostrar que a Corrente do Bem realmente funciona.
              </p>
              <Link 
                href="/depoimentos/novo" 
                className="inline-flex items-center gap-3 bg-[#00628c] text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#00628c]/20 hover:scale-105 transition-all"
              >
                Escrever meu Depoimento
                <Plus className="w-6 h-6" />
              </Link>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f0eded] py-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#00628c] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#00628c]/20">
                  <Handshake className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-[#1a2b3b] tracking-tighter">Corrente do Bem</span>
              </Link>
              <p className="text-[#3e4850] text-lg lg:text-xl opacity-60 leading-relaxed max-w-md">
                Unindo talentos e empresas através de conexões genuínas e respeito mútuo.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-[#00628c] mb-8">Navegação</h4>
              <ul className="space-y-4">
                <li><Link href="/vagas" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Vagas</Link></li>
                <li><Link href="/talentos" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Currículos</Link></li>
                <li><Link href="/negocios" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Negócios</Link></li>
                <li><Link href="/noticias" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Notícias</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-[#00628c] mb-8">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Privacidade</Link></li>
                <li><Link href="#" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Termos de Uso</Link></li>
                <li><Link href="#" className="text-lg text-[#3e4850]/60 hover:text-[#00628c] transition-colors font-bold">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-[#00628c]/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-[#3e4850]/40 uppercase tracking-widest">
              © 2024 Corrente do Bem. Todos os direitos reservados.
            </p>
            <div className="flex gap-8">
              <Link href="#" className="text-[#3e4850]/40 hover:text-[#00628c] transition-all"><span className="sr-only">Instagram</span><Instagram className="w-6 h-6" /></Link>
              <Link href="#" className="text-[#3e4850]/40 hover:text-[#00628c] transition-all"><span className="sr-only">LinkedIn</span><Linkedin className="w-6 h-6" /></Link>
              <Link href="#" className="text-[#3e4850]/40 hover:text-[#00628c] transition-all"><span className="sr-only">Twitter</span><Twitter className="w-6 h-6" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
