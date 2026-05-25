'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  CreditCard,
  Monitor,
  HeartPulse,
  GraduationCap,
  Hammer,
  Building2,
  Menu,
  Handshake,
  Bookmark,
  ExternalLink,
  Share2,
  Verified,
  FileText,
  User,
  Mail,
  Phone,
  Paperclip,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, ensureExternalLink, stripHtml } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';

// Helper component for candidate images with error fallback
const CandidateAvatar = ({ src, name, className = "object-cover" }: { src?: string; name: string; className?: string }) => {
  const [error, setError] = React.useState(false);
  const isFallback = !src || src.includes('gravatar') || src.includes('dicebear');
  
  if (error || !src) {
    return (
      <div className="w-full h-full bg-[#f6f3f2] flex items-center justify-center text-[#bec8d1] border border-[#bec8d1]/20">
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <Image 
      src={src} 
      alt={name} 
      fill 
      className={className} 
      referrerPolicy="no-referrer"
      unoptimized={src.includes('dicebear')}
      onError={() => setError(true)}
    />
  );
};

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  area: string;
  status: 'pending' | 'active' | 'rejected';
  role: string;
  summary: string;
  skills: string[];
  image: string;
  cv_url?: string;
  verified?: boolean;
  created_at?: string;
}

export default function TalentosPage() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || 'Todos os Talentos');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const itemsPerPage = 6;

  const categories = [
    { name: 'Todos os Talentos', icon: <User className="w-5 h-5" /> },
    { name: 'Tecnologia', icon: <Monitor className="w-5 h-5" /> },
    { name: 'Saúde', icon: <HeartPulse className="w-5 h-5" /> },
    { name: 'Finanças', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'Engenharia & Arquitetura', icon: <Building2 className="w-5 h-5" /> },
    { name: 'Autônomos', icon: <Hammer className="w-5 h-5" /> },
  ];

  useEffect(() => {
    async function fetchCandidates() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('talentos')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar candidatos:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
      }
      if (data) setCandidates(data);
      setIsLoading(false);
    }
    fetchCandidates();
  }, []);

  const filteredCandidates = React.useMemo(() => {
    return candidates.filter(cand => {
      const matchesSearch = cand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            cand.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cand.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'Todos os Talentos' || cand.area === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [candidates, searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#fcf9f8] font-body">
      <Navbar />

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header & Search */}
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#00628c] mb-4 font-headline leading-tight">Galeria de Talentos</h1>
            <p className="text-[#3e4850] text-lg leading-relaxed mb-6">Conecte-se com profissionais excepcionais prontos para transformar sua empresa com dignidade e competência.</p>
            <Link 
              href="/talentos/cadastrar" 
              className="inline-flex items-center gap-2 bg-[#964900] text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#964900]/20"
            >
              <FileText className="w-5 h-5" />
              Cadastrar Meu Currículo
            </Link>
          </div>
          <div className="w-full md:w-96">
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f7881] w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou competência..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-[#f0eded] focus:bg-white focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c] shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
        </section>


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
                <span>Filtrar Talentos</span>
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
                    <div className="space-y-2 mb-10">
                      {categories.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsFiltersVisible(false);
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

                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3e4850] mb-6">Disponibilidade</h3>
                    <div className="space-y-4">
                      {['Imediata', 'Em 15 dias', 'Em 30 dias'].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-5 h-5 rounded border-[#bec8d1] text-[#00628c] focus:ring-[#00628c]/20" />
                          <span className="text-sm font-medium text-[#3e4850] group-hover:text-[#00628c] transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3e4850] mb-6">Localização</h3>
                    <div className="space-y-4">
                      {['Remoto', 'Híbrido', 'Presencial'].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-5 h-5 rounded border-[#bec8d1] text-[#00628c] focus:ring-[#00628c]/20" />
                          <span className="text-sm font-medium text-[#3e4850] group-hover:text-[#00628c] transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3e4850] mb-6">Experiência</h3>
                    <select className="w-full p-4 rounded-2xl border-none bg-[#f0eded] text-[#1b1c1c] font-bold focus:ring-2 focus:ring-[#00628c]/40 cursor-pointer">
                      <option>Qualquer nível</option>
                      <option>Júnior (0-2 anos)</option>
                      <option>Pleno (3-5 anos)</option>
                      <option>Sênior (6+ anos)</option>
                      <option>Especialista / Gestor</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* Talent Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-[#00628c]/20 border-t-[#00628c] rounded-full animate-spin"></div>
                <p className="text-[#3e4850] font-medium">Carregando talentos...</p>
              </div>
            ) : paginatedCandidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedCandidates.map((cand, idx) => (
                  <motion.div 
                    key={cand.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "group bg-[#f6f3f2] rounded-[2.5rem] p-8 hover:bg-white transition-all duration-300 relative overflow-hidden flex flex-col gap-8 shadow-sm hover:shadow-2xl border border-[#bec8d1]/10",
                      idx === 0 && "md:col-span-2 md:flex-row"
                    )}
                  >
                    <div className={cn(
                      "relative rounded-3xl overflow-hidden shrink-0 shadow-xl",
                      idx === 0 ? "w-32 h-32 md:w-48 md:h-48" : "w-24 h-24"
                    )}>
                      <CandidateAvatar 
                        src={cand.image} 
                        name={cand.name} 
                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      {cand.verified && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#bff444] flex items-center justify-center border-4 border-white">
                          <Verified className="w-4 h-4 text-[#141f00] fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 rounded-full bg-[#bff444] text-[#141f00] text-[10px] font-black uppercase tracking-widest">{cand.area}</span>
                        <Bookmark className="w-5 h-5 text-[#bec8d1] hover:text-[#964900] cursor-pointer transition-colors" />
                      </div>
                      <h3 className={cn("font-extrabold text-[#1b1c1c] mb-1 font-headline", idx === 0 ? "text-3xl" : "text-xl")}>{cand.name}</h3>
                      <p className="text-[#00628c] font-bold mb-4">{cand.role}</p>
                      <p className="text-[#3e4850] leading-relaxed mb-6 text-sm line-clamp-3">{stripHtml(cand.summary)}</p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {cand.skills.slice(0, idx === 0 ? 6 : 3).map(skill => (
                          <span key={skill} className="px-3 py-1 bg-[#f0eded] rounded-lg text-[10px] font-bold text-[#3e4850] uppercase tracking-wider">{skill}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center text-[#3e4850] text-xs font-bold gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00628c]" />
                          {cand.location}
                        </div>
                        <button 
                          onClick={() => setSelectedCandidate(cand)}
                          className="text-[#00628c] font-black text-sm hover:underline flex items-center gap-2"
                        >
                          Ver Perfil Completo <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-[#bec8d1]">
                <LayoutGrid className="w-16 h-16 text-[#bec8d1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1b1c1c] mb-2">
                  {searchTerm ? 'Talento não encontrado' : 'Nenhum talento aprovado'}
                </h3>
                <p className="text-[#3e4850]">
                  {searchTerm 
                    ? `Não encontramos talentos com o termo "${searchTerm}".` 
                    : 'Ainda não há talentos aprovados disponíveis. Use o Painel Adm para aprovar perfis pendentes.'}
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('Todos os Talentos');
                    }}
                    className="mt-6 px-8 py-3 bg-[#00628c] text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-[#00628c]/20"
                  >
                    Ver todos os talentos
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#bec8d1]/30 text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
                >
                  <ChevronsLeft className="w-5 h-5 group-active:scale-90 transition-transform" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#bec8d1]/30 text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5 group-active:scale-90 transition-transform" />
                </button>
                
                <div className="flex items-center gap-2 px-2">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#00628c] text-white font-bold shadow-lg shadow-[#00628c]/20">
                    {currentPage}
                  </span>
                  <span className="text-[#3e4850] font-medium text-sm">de {totalPages}</span>
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#bec8d1]/30 text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
                >
                  <ChevronRight className="w-5 h-5 group-active:scale-90 transition-transform" />
                </button>
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

      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
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
                  onClick={() => setSelectedCandidate(null)}
                  className="absolute top-6 right-6 p-2 bg-[#f6f3f2] rounded-full text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden shadow-xl shrink-0">
                    <CandidateAvatar src={selectedCandidate.image} name={selectedCandidate.name} />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-[#bff444] text-[#141f00] text-[10px] font-black uppercase tracking-widest">
                        {selectedCandidate.area}
                      </span>
                      {selectedCandidate.verified && (
                        <span className="flex items-center gap-1 text-[#00628c] text-[10px] font-black uppercase tracking-widest bg-[#c8e6ff] px-3 py-1 rounded-full">
                          <Verified className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-[#00628c] font-headline mb-1 tracking-tight">{selectedCandidate.name}</h2>
                    <p className="text-[#964900] font-bold text-lg mb-4">{selectedCandidate.role}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-1.5 text-[#3e4850] text-sm font-bold bg-[#f6f3f2] px-4 py-2 rounded-xl">
                        <MapPin className="w-4 h-4 text-[#00628c]" /> {selectedCandidate.location}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Resumo Profissional</h3>
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedCandidate.summary }} 
                      className="text-[#3e4850] leading-relaxed text-sm md:text-base rich-text-content"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Habilidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill) => (
                        <span key={skill} className="px-4 py-2 bg-[#f6f3f2] rounded-xl text-xs font-bold text-[#3e4850] uppercase tracking-wider border border-[#bec8d1]/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedCandidate.cv_url && (
                    <div className="pt-6 border-t border-[#f6f3f2]">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Currículo Anexo</h3>
                      <a 
                        href={selectedCandidate.cv_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-4 p-4 bg-[#f6f3f2] rounded-2xl hover:bg-[#c8e6ff]/20 transition-all border border-transparent hover:border-[#00628c]/10"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#c8e6ff] flex items-center justify-center text-[#00628c]">
                          <Paperclip className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#00628c] uppercase tracking-wider">Clique para saber mais</p>
                          <p className="text-[10px] text-[#6f7881]">Clique para baixar o arquivo anexado</p>
                        </div>
                      </a>
                    </div>
                  )}

                  <div className="p-8 bg-[#00628c] rounded-3xl text-white shadow-xl shadow-[#00628c]/20">
                    <h4 className="text-xs font-black uppercase tracking-widest mb-6 opacity-70">Entrar em Contato</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black opacity-50 tracking-widest">E-mail</p>
                        <a href={`mailto:${selectedCandidate.email}`} className="text-lg font-bold hover:underline flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          {selectedCandidate.email}
                        </a>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black opacity-50 tracking-widest">Telefone / WhatsApp</p>
                        <a href={`https://wa.me/${selectedCandidate.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-lg font-bold hover:underline flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          {selectedCandidate.phone}
                        </a>
                      </div>
                    </div>
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
