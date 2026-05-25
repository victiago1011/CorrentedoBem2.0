'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Clock, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  DollarSign,
  Building2,
  Menu,
  Handshake,
  TrendingUp,
  Globe,
  Users,
  Trophy,
  Award,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { cn, ensureExternalLink, stripHtml } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';

interface Negocio {
  id: string;
  title: string;
  owner_name: string;
  location: string;
  area: string;
  description: string;
  link?: string;
  contact_email: string;
  contact_phone: string;
  type: string;
  logo_url?: string;
  attachment_url?: string;
  status: 'pending' | 'active' | 'rejected' | 'closed';
  created_at?: string;
}

function NegociosContent() {
  const searchParams = useSearchParams();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);
  const itemsPerPage = 6;

  const categories = [
    { name: 'Todas', icon: <Globe className="w-5 h-5" /> },
    { name: 'Comércio', icon: <Building2 className="w-5 h-5" /> },
    { name: 'Tecnologia', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Serviços', icon: <Briefcase className="w-5 h-5" /> },
    { name: 'Franquias', icon: <Building2 className="w-5 h-5" /> },
    { name: 'Esportes', icon: <Trophy className="w-5 h-5" /> },
    { name: 'Outros', icon: <Filter className="w-5 h-5" /> },
  ];

  const types = [
    { name: 'Sócio', icon: <Users className="w-4 h-4" /> },
    { name: 'Investimento', icon: <TrendingUp className="w-4 h-4" /> },
    { name: 'Parceria', icon: <Handshake className="w-4 h-4" /> },
    { name: 'Patrocínio', icon: <Award className="w-4 h-4" /> },
    { name: 'Venda', icon: <DollarSign className="w-4 h-4" /> },
  ];

  useEffect(() => {
    async function fetchNegocios() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar negócios:', error);
      }
      if (data) setNegocios(data);
      setIsLoading(false);
    }
    fetchNegocios();
  }, []);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredNegocios = negocios.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const itemArea = item.area?.trim().toLowerCase() || '';
    const selectedCat = selectedCategory.trim().toLowerCase();
    const matchesCategory = selectedCategory === 'Todas' || itemArea === selectedCat;

    const matchesType = selectedTypes.length === 0 || selectedTypes.some(t => item.type && item.type.includes(t));

    return matchesSearch && matchesCategory && matchesType;
  });

  const totalPages = Math.ceil(filteredNegocios.length / itemsPerPage);
  const paginatedNegocios = filteredNegocios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedTypes]);

  return (
    <div className="min-h-screen bg-[#fcf9f8] font-body">
      <Navbar />

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 md:px-8">
        {/* Hero & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#00628c] font-headline leading-tight mb-6">
              Oportunidades de <span className="text-[#964900]">Negócios</span>
            </h1>
            <p className="text-[#3e4850] text-lg mb-8 max-w-xl">
              Encontre o parceiro ideal, invista em novas ideias ou venda seu negócio para alguém que compartilha seus valores.
            </p>
            <div className="relative max-w-2xl bg-white p-2 rounded-2xl shadow-xl border border-[#bec8d1]/10 flex items-center gap-2">
              <Search className="ml-4 text-[#6f7881] w-5 h-5" />
              <input 
                type="text" 
                placeholder="Negócio, área ou palavra-chave..." 
                className="w-full border-none focus:ring-0 bg-transparent text-[#1b1c1c] py-3 placeholder:text-[#6f7881]/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-[#00628c] hover:bg-[#004c6d] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#00628c]/20">
                Buscar
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <p className="text-sm font-bold text-[#6f7881]">Tem uma oportunidade?</p>
              <Link 
                href="/negocios/cadastrar" 
                className="inline-flex items-center gap-2 bg-[#fc820c] text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#fc820c]/20"
              >
                Publicar seu Negócio
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative h-[450px]">
            <div className="absolute inset-0 bg-[#00628c]/10 rounded-[3rem] transform -rotate-3"></div>
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl rotate-2 border-8 border-white">
              <Image 
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000" 
                alt="Negócios e conexões" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72">
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#bec8d1]/20 mb-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[#00628c] font-black uppercase text-xs tracking-widest">
                <Filter className="w-4 h-4" />
                <span>Filtrar Negócios</span>
              </div>
              <motion.div
                animate={{ rotate: isFiltersVisible ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-[#6f7881]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {(isFiltersVisible || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                <motion.div
                  initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transition: { duration: 0.3 }
                  }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-10 overflow-hidden lg:block pb-10 lg:pb-0"
                >
                  <div className="pt-2 lg:pt-0">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3e4850] mb-6">Categorias</h3>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            if (window.innerWidth < 1024) setIsFiltersVisible(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            selectedCategory === cat.name 
                              ? 'bg-[#00628c] text-white shadow-lg shadow-[#00628c]/20' 
                              : 'bg-[#f6f3f2] text-[#3e4850] hover:bg-[#f0eded]'
                          }`}
                        >
                          <span className={selectedCategory === cat.name ? 'text-white' : 'text-[#00628c]'}>{cat.icon}</span>
                          <span className="text-sm font-bold">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3e4850] mb-6">Tipo de Oportunidade</h3>
                    <div className="space-y-4">
                      {types.map((type) => (
                        <label key={type.name} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-[#bec8d1] text-[#00628c] focus:ring-[#00628c]/20" 
                            checked={selectedTypes.includes(type.name)}
                            onChange={() => toggleType(type.name)}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-[#00628c]">{type.icon}</span>
                            <span className="text-sm font-medium text-[#3e4850] group-hover:text-[#00628c] transition-colors">{type.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* Business Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-bold text-[#3e4850]">{filteredNegocios.length} Oportunidades encontradas</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-[#00628c]/20 border-t-[#00628c] rounded-full animate-spin"></div>
                <p className="text-[#3e4850] font-medium">Buscando oportunidades...</p>
              </div>
            ) : paginatedNegocios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedNegocios.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-[#bec8d1]/10 hover:border-[#00628c]/20 transition-all shadow-sm hover:shadow-xl group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-[#f6f3f2] rounded-2xl flex items-center justify-center text-[#00628c] group-hover:bg-[#00628c] group-hover:text-white transition-colors relative overflow-hidden">
                        {item.logo_url ? (
                          <Image src={item.logo_url} alt={item.owner_name} fill className="object-contain p-2" referrerPolicy="no-referrer" />
                        ) : (
                          <TrendingUp className="w-7 h-7" />
                        )}
                      </div>
                      <span className="px-3 py-1 bg-[#bff444] text-[#141f00] text-[10px] font-black uppercase tracking-wider rounded-full">
                        {item.type || 'Oportunidade'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1b1c1c] group-hover:text-[#00628c] transition-colors mb-1 font-headline line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[#964900] font-bold text-sm mb-4">{item.owner_name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[#3e4850] text-xs mb-6">
                      <span className="flex items-center gap-1.5 bg-[#f6f3f2] px-3 py-1.5 rounded-full">
                        <MapPin className="w-3.5 h-3.5" /> {item.location}
                      </span>
                    </div>
                    <p className="text-[#3e4850] text-sm line-clamp-3 mb-6 leading-relaxed">
                      {stripHtml(item.description)}
                    </p>
                    <button 
                      onClick={() => setSelectedNegocio(item)}
                      className="w-full py-3.5 bg-[#f6f3f2] hover:bg-[#00628c] hover:text-white text-[#00628c] font-bold rounded-2xl transition-all active:scale-95 text-center"
                    >
                      Ver Detalhes
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-[#bec8d1]">
                <TrendingUp className="w-16 h-16 text-[#bec8d1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1b1c1c] mb-2">
                  {searchTerm ? 'Negócio não encontrado' : 'Nenhuma oportunidade ativa'}
                </h3>
                <p className="text-[#3e4850]">
                  {searchTerm 
                    ? `Não encontramos nenhuma oportunidade que corresponda ao termo "${searchTerm}".` 
                    : 'Ainda não há oportunidades de negócios publicadas.'}
                </p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-6 px-8 py-3 bg-[#00628c] text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-[#00628c]/20"
                >
                  Ver todos os negócios
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#bec8d1]/30 text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
                >
                  <ChevronsLeft className="w-5 h-5 group-active:scale-90 transition-transform" />
                </button>
                <div className="flex items-center gap-2 px-2">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#00628c] text-white font-bold shadow-lg shadow-[#00628c]/20">
                    {currentPage}
                  </span>
                  <span className="text-[#3e4850] font-medium text-sm">de {totalPages}</span>
                </div>
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#bec8d1]/30 text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
                >
                  <ChevronsRight className="w-5 h-5 group-active:scale-90 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes do Negócio */}
      <AnimatePresence>
        {selectedNegocio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNegocio(null)}
              className="absolute inset-0 bg-[#3e4850]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setSelectedNegocio(null)}
                  className="absolute top-6 right-6 p-2 bg-[#f6f3f2] rounded-full text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-[#c8e6ff] rounded-2xl flex items-center justify-center text-[#00628c] relative overflow-hidden">
                    {selectedNegocio.logo_url ? (
                      <Image src={selectedNegocio.logo_url} alt={selectedNegocio.owner_name} fill className="object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <TrendingUp className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#00628c] font-headline tracking-tight">{selectedNegocio.title}</h2>
                    <p className="text-[#964900] font-bold">{selectedNegocio.owner_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                  <div className="p-4 bg-[#f6f3f2] rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6f7881] mb-1">Localização</p>
                    <p className="text-sm font-bold text-[#3e4850] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00628c]" /> {selectedNegocio.location}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f6f3f2] rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6f7881] mb-1">Área</p>
                    <p className="text-sm font-bold text-[#3e4850] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#00628c]" /> {selectedNegocio.area}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f6f3f2] rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6f7881] mb-1">Tipo</p>
                    <p className="text-sm font-bold text-[#3e4850]">
                      {selectedNegocio.type || 'Não especificado'}
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Descrição da Oportunidade</h3>
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedNegocio.description }} 
                      className="text-[#3e4850] leading-relaxed text-sm md:text-base mb-6 rich-text-content prose prose-sm max-w-none"
                    />
                    
                    {selectedNegocio.link && (
                      <div className="pt-4 border-t border-[#bec8d1]/20">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#6f7881] mb-2">Link Externo</h4>
                        <a 
                          href={ensureExternalLink(selectedNegocio.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#00628c] hover:underline font-bold"
                        >
                          <Globe className="w-4 h-4" />
                          Visitar Site / Perfil
                        </a>
                      </div>
                    )}

                    {selectedNegocio.attachment_url && (
                      <div className="pt-4 border-t border-[#bec8d1]/20">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#6f7881] mb-2">Anexo / Arquivo</h4>
                        <a 
                          href={selectedNegocio.attachment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-3 p-4 bg-[#f6f3f2] rounded-2xl hover:bg-[#c8e6ff]/20 transition-all border border-transparent hover:border-[#00628c]/10"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#c8e6ff] flex items-center justify-center text-[#00628c]">
                            <Paperclip className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#00628c] uppercase tracking-wider">Clique para saber mais</p>
                            <p className="text-[10px] text-[#6f7881]">Clique para baixar o anexo</p>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-[#f6f3f2] border-t border-[#bec8d1]/10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-xs text-[#6f7881] font-medium italic">Oportunidade anunciada através do Corrente do Bem</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {selectedNegocio.contact_email && (
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#6f7881]">E-mail</span>
                        <a href={`mailto:${selectedNegocio.contact_email}`} className="text-sm font-bold text-[#00628c] hover:underline">
                          {selectedNegocio.contact_email}
                        </a>
                      </div>
                    )}
                    {selectedNegocio.contact_phone && (
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#6f7881]">Telefone / WhatsApp</span>
                        <a href={`https://wa.me/${selectedNegocio.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#00628c] hover:underline">
                          {selectedNegocio.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function NegociosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00628c]/20 border-t-[#00628c] rounded-full animate-spin"></div>
      </div>
    }>
      <NegociosContent />
    </Suspense>
  );
}
