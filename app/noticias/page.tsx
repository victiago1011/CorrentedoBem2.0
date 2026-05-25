'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Calendar, 
  User, 
  ChevronRight, 
  Search,
  ArrowRight,
  Clock,
  Handshake,
  Instagram,
  Linkedin,
  Twitter,
  Newspaper
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { cn } from '@/lib/utils';

interface Noticia {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  author?: string;
  category?: string;
  status: string;
  published_at: string;
}

const SafeImage = ({ src, alt, className, fill, unoptimized, ...props }: any) => {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={cn(
        "bg-[#f0f2f5] flex items-center justify-center overflow-hidden",
        className,
        fill ? "absolute inset-0" : ""
      )}>
        <div className="w-12 h-12 text-[#bec8d1]">
          <Handshake className="w-full h-full opacity-20" />
        </div>
      </div>
    );
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      unoptimized={unoptimized}
      className={cn(className, "object-cover")}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchNoticias() {
      // Use cached data if possible or just fetch once
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('status', 'active')
        .order('published_at', { ascending: false });

      if (data) setNoticias(data);
      setIsLoading(false);
    }
    fetchNoticias();
  }, []);

  const filteredNoticias = noticias.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.category && n.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const highlights = filteredNoticias.slice(0, 3);
  const restOfNews = filteredNoticias.slice(3);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 bg-[#fafafa] border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8"
          >
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-5xl font-black text-[#1a2b3b] mb-3 leading-tight tracking-tight">
                Notícias
              </h1>
              <p className="text-base lg:text-lg text-[#3e4850] opacity-70">
                Últimas atualizações, eventos e histórias de impacto na Corrente do Bem.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3e4850]/40 w-4 h-4" />
              <input 
                type="text"
                placeholder="Buscar notícias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl focus:border-[#00628c]/20 focus:ring-4 focus:ring-[#00628c]/5 focus:outline-none transition-all text-sm font-bold shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 container mx-auto px-4 md:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-[#00628c]/10 border-t-[#00628c] rounded-full animate-spin mb-6"></div>
            <p className="text-[#00628c] font-black uppercase tracking-widest text-xs animate-pulse">Carregando conteúdo...</p>
          </div>
        ) : filteredNoticias.length > 0 ? (
          <div className="space-y-12">
            
            {/* G1 Style Highlights */}
            {!searchTerm && highlights.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Highlight */}
                {highlights[0] && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 group relative flex flex-col"
                  >
                    <Link href={`/noticias/${highlights[0].slug}`} className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500">
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <SafeImage 
                          src={highlights[0].image_url}
                          alt={highlights[0].title}
                          fill
                          unoptimized
                          className="transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-6 left-6">
                          <span className="px-4 py-1.5 bg-[#bff444] text-[#141f00] font-black text-[10px] uppercase tracking-wider rounded-full shadow-lg">
                            {highlights[0].category || 'DESTAQUE'}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 lg:p-10">
                        <h2 className="text-2xl lg:text-4xl font-black text-[#1a2b3b] leading-tight mb-4 group-hover:text-[#00628c] transition-colors">
                          {highlights[0].title}
                        </h2>
                        <p className="text-[#3e4850] text-base lg:text-lg opacity-70 line-clamp-2 leading-relaxed">
                          {highlights[0].excerpt || highlights[0].content.substring(0, 180).trim() + '...'}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* Side Highlights */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {highlights.slice(1, 3).map((news, idx) => (
                    <motion.div 
                      key={news.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * (idx + 1) }}
                      className="group flex-1"
                    >
                      <Link href={`/noticias/${news.slug}`} className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500">
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                          <SafeImage 
                            src={news.image_url} 
                            alt={news.title} 
                            fill 
                            unoptimized
                            className="transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[#00628c] font-black text-[9px] uppercase tracking-wider rounded-full shadow-md">
                              {news.category || 'NOVIDADE'}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-black text-[#1a2b3b] leading-tight group-hover:text-[#00628c] transition-colors line-clamp-2">
                            {news.title}
                          </h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* List Header */}
            {(searchTerm || restOfNews.length > 0) && (
              <div className="flex items-center gap-6 pt-12">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00628c]">
                  {searchTerm ? `Resultados da busca: ${searchTerm}` : 'Mais Notícias'}
                </span>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
            )}

            {/* Rest of News - G1 Style List */}
            <div className="space-y-8">
              {(searchTerm ? filteredNoticias : restOfNews).map((news, index) => (
                <motion.article 
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link href={`/noticias/${news.slug}`} className="grid md:grid-cols-12 gap-8 pb-8 border-b border-gray-50 hover:bg-gray-50/50 rounded-3xl transition-colors p-4 -mx-4 group">
                    <div className="md:col-span-4 lg:col-span-3">
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-500 bg-white">
                        <SafeImage 
                          src={news.image_url} 
                          alt={news.title} 
                          fill 
                          unoptimized
                          className="transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-[#3e4850]/40 text-[10px] font-black uppercase tracking-widest mb-3">
                        <span className="text-[#fc820c] font-black">
                          {news.category || 'GERAL'}
                        </span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{new Date(news.published_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-[#1a2b3b] leading-tight mb-2 group-hover:text-[#00628c] transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-[#3e4850] opacity-50 text-base line-clamp-2 md:line-clamp-1 leading-relaxed mb-4">
                        {news.excerpt || news.content.substring(0, 150).trim() + '...'}
                      </p>
                      <div className="flex items-center gap-2 text-[#00628c] font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-4 transition-all opacity-0 group-hover:opacity-100">
                        Ler notícia completa <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            {filteredNoticias.length === 0 && !isLoading && (
              <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#1a2b3b] mb-2">Ops! Nada encontrado</h3>
                <p className="text-[#3e4850]/60 max-w-md mx-auto mb-10">Tente buscar por termos diferentes ou navegue por nossas categorias.</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="px-10 py-4 bg-[#00628c] text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#00628c]/20"
                >
                  Ver todas as notícias
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-40">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Newspaper className="w-12 h-12 text-gray-200" />
             </div>
             <h3 className="text-2xl font-black text-[#1a2b3b] mb-2">Ainda não há notícias disponíveis</h3>
             <p className="text-lg text-[#3e4850]/40">Estamos selecionando as melhores histórias para você. Volte em breve!</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#1a2b3b] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#00628c]/5 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-left"
            >
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 leading-tight">
                Sugira uma <span className="text-[#bff444]">pauta</span> para nós.
              </h2>
              <p className="text-xl text-white/60 mb-12 leading-relaxed">
                Tem uma história inspiradora, uma novidade ou um evento que a nossa comunidade precisa saber? Nossa redação quer te ouvir.
              </p>
              <Link 
                href="/contato"
                className="inline-flex items-center gap-4 px-10 py-5 bg-[#fc820c] text-white font-black rounded-2xl shadow-2xl shadow-[#fc820c]/30 hover:scale-105 active:scale-95 transition-all"
              >
                Enviar Sugestão <Megaphone className="w-5 h-5" />
              </Link>
            </motion.div>
            <div className="hidden lg:flex justify-end">
              <div className="w-80 h-80 bg-[#bff444] rounded-[4rem] rotate-12 flex items-center justify-center shadow-3xl shadow-[#bff444]/20 animate-pulse-slow">
                 <Handshake className="w-40 h-40 text-[#141f00]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
