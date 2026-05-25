'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Heart, 
  Utensils, 
  Brush, 
  Truck, 
  ArrowRight, 
  MapPin, 
  DollarSign, 
  Quote, 
  Share2, 
  Globe, 
  Handshake,
  ChevronRight,
  Menu,
  X,
  Briefcase,
  Clock,
  Check,
  User,
  Mail,
  Phone,
  Paperclip,
  Verified,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn, ensureExternalLink, stripHtml } from '@/lib/utils';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';

// Helper component for candidate images with error fallback
const CandidateAvatar = ({ src, name, className = "object-cover" }: { src?: string; name: string; className?: string }) => {
  const [error, setError] = React.useState(false);
  const isFallback = !src || src.includes('gravatar') || src.includes('dicebear');
  
  // If it's a known problematic source or has error, handle according
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
      unoptimized={src.includes('dicebear')} // Dicebear SVGs don't need optimization and often fail in Next.js proxy
      onError={() => setError(true)}
    />
  );
};

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  area: string;
  status: 'pending' | 'active' | 'rejected' | 'closed';
  salary: string;
  description: string;
  requirements: string[];
  logo_url?: string;
  site_url?: string;
  contact_email?: string;
  contact_phone?: string;
  attachment_url?: string;
  created_at?: string;
}

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

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'candidatos' | 'empresas' | 'negocios'>('candidatos');
  const [searchValue, setSearchValue] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [featuredCandidates, setFeaturedCandidates] = useState<Candidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    async function fetchFeaturedData() {
      setIsLoadingJobs(true);
      setIsLoadingCandidates(true);
      setIsLoadingTestimonials(true);
      
      const [jobsRes, candidatesRes, testimonialsRes] = await Promise.all([
        supabase
          .from('vagas')
          .select('*')
          .in('status', ['active', 'approved'])
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('talentos')
          .select('*')
          .in('status', ['active', 'approved'])
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('testimonials')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(2)
      ]);

      if (jobsRes.error) {
        console.error('Erro ao buscar destaques de vagas:', jobsRes.error);
      } else if (jobsRes.data) {
        setFeaturedJobs(jobsRes.data);
      }

      if (candidatesRes.error) {
        console.error('Erro ao buscar destaques de talentos:', candidatesRes.error);
      } else if (candidatesRes.data) {
        setFeaturedCandidates(candidatesRes.data);
      }

      if (testimonialsRes.error) {
        console.error('Erro ao buscar depoimentos:', testimonialsRes.error);
      } else if (testimonialsRes.data) {
        setTestimonials(testimonialsRes.data);
      }
      
      setIsLoadingJobs(false);
      setIsLoadingCandidates(false);
      setIsLoadingTestimonials(false);
    }
    fetchFeaturedData();
  }, []);

  const handleSearch = () => {
    if (searchValue.trim()) {
      router.push(`/vagas?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      router.push('/vagas');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] font-body selection:bg-[#00628c]/20 selection:text-[#00628c]">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[600px] lg:min-h-[800px] flex items-center overflow-hidden bg-[#fcf9f8] pt-10 lg:pt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 lg:space-y-8 text-center lg:text-left"
            >
              <span className="inline-block px-4 py-1.5 bg-[#bff444] text-[#141f00] font-bold text-[10px] md:text-xs rounded-full tracking-wider uppercase">
                Dignidade e Conexão
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-[#1b1c1c] leading-[1.1] tracking-tight font-headline">
                Encontre sua próxima <span className="text-[#bff444]">vaga</span> ou ofereça ajuda
              </h1>
              <p className="text-lg md:text-xl text-[#3e4850] max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Unindo talentos invisíveis a empresas que valorizam o impacto social. Construa carreiras, transforme realidades.
              </p>
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-[#00628c]/5 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto lg:mx-0 border border-[#bec8d1]/20">
                <div className="flex-1 flex items-center px-4 gap-3 bg-[#f6f3f2] rounded-xl">
                  <Search className="w-5 h-5 text-[#6f7881]" />
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 outline-none py-4 text-[#1b1c1c] placeholder-[#6f7881] text-sm md:text-base" 
                    placeholder="Procure por 'vagas' ou 'talentos'..." 
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  className="bg-[#00628c] hover:bg-[#004c6d] text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Pesquisar</span>
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl rotate-3 border-8 border-white">
                <Image 
                  alt="Equipe Profissional" 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000" 
                  fill
                  referrerPolicy="no-referrer"
                />
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-12 bg-white p-6 rounded-2xl shadow-xl border border-[#bec8d1]/10 max-w-xs -rotate-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ffdcc6] flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#964900] fill-current" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1b1c1c]">Impacto Real</div>
                    <div className="text-sm text-[#3e4850]">+500 contratações</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#c8e6ff]/20 -skew-x-12 translate-x-1/4 pointer-events-none"></div>
        </section>

        {/* Destaques do Dia */}
        <section className="py-16 lg:py-24 bg-[#f6f3f2]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-[#1b1c1c] tracking-tight mb-4 font-headline">Destaques do Dia</h2>
                <p className="text-[#3e4850] text-base lg:text-lg max-w-2xl">Vagas que precisam do seu talento hoje. Aplique agora e mude sua trajetória.</p>
              </div>
              <Link className="group flex items-center gap-2 text-[#00628c] font-bold hover:gap-4 transition-all" href="/vagas">
                Ver todas as vagas <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingJobs ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl animate-pulse border border-[#bec8d1]/10 h-64"></div>
                ))
              ) : featuredJobs.length > 0 ? (
                featuredJobs.map((job, idx) => (
                  <motion.div 
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "bg-white p-8 rounded-3xl transition-all hover:shadow-xl hover:-translate-y-1 border border-[#bec8d1]/10 flex flex-col h-full",
                      idx === 0 && featuredJobs.length === 3 ? "lg:col-span-1" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-[#c8e6ff] flex items-center justify-center relative overflow-hidden">
                        {job.logo_url ? (
                          <Image src={job.logo_url} alt={job.company} fill className="object-contain p-2" referrerPolicy="no-referrer" />
                        ) : (
                          <Briefcase className="w-8 h-8 text-[#00628c]" />
                        )}
                      </div>
                      {idx === 0 && <span className="px-3 py-1 bg-[#bff444] text-[#141f00] text-xs font-bold rounded-full uppercase tracking-wider">Novo</span>}
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-[#1b1c1c] mb-2 font-headline line-clamp-1">{job.title}</h3>
                    <p className="text-[#964900] font-bold text-sm mb-4">{job.company}</p>
                    <p className="text-[#3e4850] mb-6 leading-relaxed line-clamp-3 text-sm flex-grow">{stripHtml(job.description)}</p>
                    <div className="flex items-center gap-4 text-xs text-[#3e4850] font-medium mb-8">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#00628c]" /> {job.location}</span>
                      {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-[#00628c]" /> {job.salary}</span>}
                    </div>
                    <button 
                      onClick={() => setSelectedJob(job)}
                      className="block w-full py-4 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-xl hover:bg-[#00628c] hover:text-white transition-colors text-center"
                    >
                      Detalhes
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-[#bec8d1]/30">
                  <p className="text-[#3e4850]">Nenhuma vaga disponível no momento.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Modal de Detalhes da Vaga */}
        <AnimatePresence>
          {selectedJob && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedJob(null)}
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
                    onClick={() => setSelectedJob(null)}
                    className="absolute top-6 right-6 p-2 bg-[#f6f3f2] rounded-full text-[#3e4850] hover:bg-[#00628c] hover:text-white transition-all z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#c8e6ff] rounded-2xl flex items-center justify-center text-[#00628c] relative overflow-hidden">
                      {selectedJob.logo_url ? (
                        <Image src={selectedJob.logo_url} alt={selectedJob.company} fill className="object-contain p-2" referrerPolicy="no-referrer" />
                      ) : (
                        <Briefcase className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[#00628c] font-headline tracking-tight">{selectedJob.title}</h2>
                      <p className="text-[#964900] font-bold">{selectedJob.company}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                    <div className="p-4 bg-[#f6f3f2] rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#6f7881] mb-1">Localização</p>
                      <p className="text-sm font-bold text-[#3e4850] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00628c]" /> {selectedJob.location}
                      </p>
                    </div>
                    <div className="p-4 bg-[#f6f3f2] rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#6f7881] mb-1">Tipo</p>
                      <p className="text-sm font-bold text-[#3e4850] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#00628c]" /> {selectedJob.type}
                      </p>
                    </div>
                    <div className="p-4 bg-[#f6f3f2] rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#6f7881] mb-1">Salário</p>
                      <p className="text-sm font-bold text-[#3e4850] flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#00628c]" /> {selectedJob.salary || 'A combinar'}
                      </p>
                    </div>
                    {selectedJob.site_url && (
                      <div className="p-4 bg-[#c8e6ff]/30 rounded-2xl border border-[#00628c]/10 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00628c] mb-1">Link da Vaga / Empresa</p>
                        <a 
                          href={ensureExternalLink(selectedJob.site_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-[#00628c] hover:underline flex items-center gap-2 truncate"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {selectedJob.site_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Descrição da Vaga</h3>
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedJob.description }} 
                        className="text-[#3e4850] leading-relaxed text-sm md:text-base rich-text-content prose prose-sm max-w-none"
                      />
                    </div>

                    {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Requisitos</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedJob.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[#3e4850] text-sm group">
                              <div className="mt-1.5 w-1.5 h-1.5 bg-[#bff444] rounded-full group-hover:scale-125 transition-transform shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedJob.attachment_url && (
                      <div className="pt-6 border-t border-[#f6f3f2]">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Anexo / Arquivo</h3>
                        <a 
                          href={selectedJob.attachment_url} 
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
                            <p className="text-[10px] text-[#6f7881]">Clique para baixar o link do anexo</p>
                          </div>
                        </a>
                      </div>
                    )}

                    {(selectedJob.contact_email || selectedJob.contact_phone || (selectedJob as any).email || (selectedJob as any).phone) && (
                      <div className="p-6 bg-[#00628c] rounded-3xl text-white">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Contato</h4>
                        <div className="flex flex-col sm:flex-row gap-6">
                          {(selectedJob.contact_email || (selectedJob as any).email) && (
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold opacity-50">E-mail</p>
                              <a href={`mailto:${selectedJob.contact_email || (selectedJob as any).email}`} className="font-bold hover:underline flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {selectedJob.contact_email || (selectedJob as any).email}
                              </a>
                            </div>
                          )}
                          {(selectedJob.contact_phone || (selectedJob as any).phone) && (
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold opacity-50">Telefone</p>
                              <a href={`tel:${selectedJob.contact_phone || (selectedJob as any).phone}`} className="font-bold hover:underline flex items-center gap-2">
                                <Phone className="w-4 h-4" /> {selectedJob.contact_phone || (selectedJob as any).phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-[#f6f3f2] border-t border-[#bec8d1]/10 text-center">
                  <p className="text-sm text-[#6f7881] font-medium italic">
                    Siga as instruções de candidatura apresentadas na descrição acima.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedCandidate && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                        className="text-[#3e4850] leading-relaxed text-sm md:text-base rich-text-content prose prose-sm max-w-none"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00628c] mb-4">Habilidades</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills?.map((skill: string) => (
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
                          <a href={`https://wa.me/${selectedCandidate.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-lg font-bold hover:underline flex items-center gap-3">
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

        {/* Talentos que Inspiram */}
        <section id="comunidade" className="py-16 lg:py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-[#bec8d1]/30"></div>
              <span className="text-[#964900] font-bold tracking-widest uppercase text-[10px] md:text-xs">Comunidade</span>
              <div className="h-px flex-1 bg-[#bec8d1]/30"></div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1b1c1c] text-center mb-12 lg:mb-16 tracking-tight font-headline">Talentos que Inspiram</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoadingCandidates ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-[320px] rounded-[2.5rem] bg-[#f6f3f2] animate-pulse border border-[#bec8d1]/10"></div>
                ))
              ) : featuredCandidates.length > 0 ? (
                featuredCandidates.map((cand, idx) => (
                  <motion.div 
                    key={cand.id}
                    whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-xl shadow-[#00628c]/5 border border-[#bec8d1]/10 flex flex-col h-full relative group cursor-pointer active:scale-95 transition-all"
                    onClick={() => setSelectedCandidate(cand)}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden shadow-inner shrink-0 border-2 border-[#bff444] bg-[#f6f3f2]">
                        <CandidateAvatar 
                          src={cand.image} 
                          name={cand.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-xl font-bold text-[#1b1c1c] font-headline line-clamp-1">{cand.name}</h3>
                          {cand.verified && <div className="w-4 h-4 bg-[#bff444] rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-[#141f00]" /></div>}
                        </div>
                        <p className="text-[#00628c] font-bold text-sm lg:text-base line-clamp-1">{cand.role}</p>
                        <p className="text-[#6f7881] text-xs flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-[#00628c]" /> {cand.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex-grow mb-6">
                      <p className="text-[#3e4850] text-sm leading-relaxed line-clamp-5 italic">
                        &quot;{cand.summary || "Profissional dedicado em busca de novas oportunidades para crescer e contribuir com o mercado de trabalho através de suas competências."}&quot;
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-6 border-t border-[#f6f3f2]">
                      {cand.skills?.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-[#f0eded] text-[#3e4850] text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                      {cand.skills?.length > 3 && (
                        <span className="px-2 py-1 text-[#6f7881] text-[10px] font-bold">
                          +{cand.skills.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#00628c]">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-[#f6f3f2] rounded-3xl border border-dashed border-[#bec8d1]/30">
                  <p className="text-[#3e4850]">Nenhum talento em destaque no momento.</p>
                </div>
              )}
            </div>
            <div className="mt-16 flex justify-center">
              <Link className="inline-flex items-center gap-2 px-8 py-4 bg-[#00628c] hover:bg-[#004c6d] text-white font-bold rounded-lg transition-all hover:scale-105 shadow-sm group" href="/talentos">
                Ver todos os currículos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Sobre Nós */}
        <section id="sobre-nos" className="py-16 lg:py-24 bg-[#fcf9f8]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="relative aspect-video lg:aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                  <Image 
                    alt="Corrente do Bem - Nossa Missão" 
                    className="w-full h-full object-cover" 
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1000" 
                    fill
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#bff444] rounded-full flex items-center justify-center shadow-xl rotate-12">
                  <Handshake className="w-12 h-12 text-[#141f00]" />
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-px bg-[#00628c]"></div>
                  <span className="text-[#00628c] font-black uppercase tracking-widest text-xs">Institucional</span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-black text-[#00628c] font-headline leading-tight">
                  NÓS SOMOS A <br />
                  <span className="text-[#1b1c1c]">CORRENTE DO BEM!</span>
                </h2>
                <div className="space-y-4 text-[#3e4850] text-sm lg:text-base leading-relaxed">
                  <p>
                    Projeto iniciado por volta de 2005 com o objetivo de ajudar cada amigo na recolocação, utilizando uma rede de pessoas do bem, de forma simples, humilde e desinteressada para ajudar ao próximo.
                  </p>
                  <p>
                    Com o tempo cada amigo ajudado ou não, passou a fazer parte desta corrente do bem, participando através de email, fone, whatsapp, boca a boca, com apenas um objetivo: ajudar ao próximo.
                  </p>
                  <p>
                    A indicação, a referência tornou-se a base desta corrente. A corrente do bem, ao longo do tempo cresceu com a ajuda de cada boa alma tornando-se um elo forte e essencial, unindo as partes fazendo chegar a oportunidade e o Currículo, mudando o destino de milhares de amigos e amigas do bem.
                  </p>
                  <p className="font-bold text-[#1b1c1c]">
                    Hoje fazendo parte desta corrente com elos em praticamente todo o território nacional com mais de 4.000 amigos do bem, crescendo a cada dia, e provando para o mundo que juntos somos mais fortes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-16 lg:py-24 bg-[#f0eded]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1b1c1c] tracking-tight mb-8 font-headline">Como Funciona</h2>
                          <div className="flex flex-wrap gap-4 md:gap-8 mb-8 lg:mb-12 border-b border-[#bec8d1]/30">
                  <button 
                    onClick={() => setActiveTab('candidatos')}
                    className={`pb-4 font-bold transition-all text-xs md:text-base ${activeTab === 'candidatos' ? 'text-[#00628c] border-b-2 border-[#00628c]' : 'text-[#3e4850] hover:text-[#1b1c1c]'}`}
                  >
                    Para Candidatos
                  </button>
                  <button 
                    onClick={() => setActiveTab('empresas')}
                    className={`pb-4 font-bold transition-all text-xs md:text-base ${activeTab === 'empresas' ? 'text-[#00628c] border-b-2 border-[#00628c]' : 'text-[#3e4850] hover:text-[#1b1c1c]'}`}
                  >
                    Para Empresas
                  </button>
                  <button 
                    onClick={() => setActiveTab('negocios')}
                    className={`pb-4 font-bold transition-all text-xs md:text-base ${activeTab === 'negocios' ? 'text-[#00628c] border-b-2 border-[#00628c]' : 'text-[#3e4850] hover:text-[#1b1c1c]'}`}
                  >
                    Para Negócios
                  </button>
                </div>
                <div className="space-y-12">
                  <AnimatePresence mode="wait">
                    {activeTab === 'candidatos' && (
                      <motion.div 
                        key="candidatos"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#00628c] text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Crie seu Perfil</h3>
                            <p className="text-[#3e4850] leading-relaxed">Destaque suas habilidades e experiências, mesmo as informais. Nossa rede valoriza sua história real.</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#00628c] text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Busque Oportunidades</h3>
                            <p className="text-[#3e4850] leading-relaxed">Filtre vagas por localização e afinidade. Receba notificações de empresas que valorizam o impacto social.</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#00628c] text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Conecte-se e Trabalhe</h3>
                            <p className="text-[#3e4850] leading-relaxed">Agende entrevistas e receba suporte para sua integração no novo emprego com dignidade.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {activeTab === 'empresas' && (
                      <motion.div 
                        key="empresas"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#964900] text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Anuncie sua Vaga</h3>
                            <p className="text-[#3e4850] leading-relaxed">Publique oportunidades focadas em impacto social. Alcance talentos resilientes e preparados.</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#964900] text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Analise Currículos</h3>
                            <p className="text-[#3e4850] leading-relaxed">Acesse perfis validados pela nossa rede. Avalie mais do que técnica: veja propósito e superação.</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#964900] text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Contrate com Dignidade</h3>
                            <p className="text-[#3e4850] leading-relaxed">Gere valor real para o seu negócio enquanto promove a inclusão social efetiva na sua equipe.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {activeTab === 'negocios' && (
                      <motion.div 
                        key="negocios"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#00628c] text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Seja Sócio ou Patrocine</h3>
                            <p className="text-[#3e4850] leading-relaxed">Apadrinhe talentos ou patrocine cursos de capacitação. Fortaleça sua marca com responsabilidade social.</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#00628c] text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Invista em Ideias</h3>
                            <p className="text-[#3e4850] leading-relaxed">Conecte-se com novos negócios sociais e ajude a financiar projetos que geram autonomia e renda.</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-left">
                          <div className="flex-shrink-0 w-12 h-12 bg-[#00628c] text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                          <div>
                            <h3 className="text-xl font-bold mb-2 font-headline">Cadastre seu Negócio</h3>
                            <p className="text-[#3e4850] leading-relaxed">Ofereça mentorias, serviços ou produtos com impacto. Integre seu ecossistema à nossa rede do bem.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-[3rem] p-4 shadow-2xl relative z-10 border border-[#bec8d1]/10">
                  <div className="relative h-[300px] lg:h-[600px] w-full rounded-[2.5rem] overflow-hidden text-left">
                    <Image 
                      alt="Ambiente Colaborativo" 
                      className="object-cover" 
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000" 
                      fill
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fc820c] rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#007cb0] rounded-full opacity-20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section id="comunidade" className="py-16 lg:py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1b1c1c] text-center mb-12 lg:mb-20 tracking-tight font-headline">Depoimentos da Comunidade</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
              {isLoadingTestimonials ? (
                <>
                  <div className="h-64 bg-gray-100 animate-pulse rounded-[2rem]"></div>
                  <div className="h-64 bg-gray-100 animate-pulse rounded-[2rem]"></div>
                </>
              ) : testimonials.length > 0 ? (
                testimonials.map((t, idx) => (
                  <div key={t.id} className={cn(
                    "p-10 rounded-[2rem] relative border border-[#bec8d1]/10 flex flex-col",
                    idx % 2 === 0 ? "bg-[#f6f3f2]" : "bg-[#00628c] text-white shadow-xl shadow-[#00628c]/20"
                  )}>
                    <Quote className={cn(
                      "w-16 h-16 absolute -top-6 left-10 opacity-20 fill-current",
                      idx % 2 === 0 ? "text-[#fc820c]" : "text-white"
                    )} />
                    <p className="text-xl leading-relaxed mb-8 italic relative z-10">
                      &quot;{t.content}&quot;
                    </p>
                    <div className="flex items-center gap-4 mt-auto">
                      <div className={cn(
                        "w-14 h-14 rounded-full overflow-hidden border-2",
                        idx % 2 === 0 ? "border-[#fc820c]" : "border-white/40"
                      )}>
                        {t.photo_url ? (
                          <Image 
                            alt={t.name}
                            className="w-full h-full object-cover" 
                            src={t.photo_url} 
                            width={56}
                            height={56}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                             <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={cn("font-bold", idx % 2 === 0 ? "text-[#1b1c1c]" : "")}>{t.name}</div>
                        <div className={cn("text-sm font-semibold", idx % 2 === 0 ? "text-[#964900]" : "opacity-80")}>
                          {t.role} {t.company && `em ${t.company}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                   <p className="text-gray-500 font-medium">Nenhum depoimento aprovado ainda. Seja o primeiro!</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link 
                href="/depoimentos" 
                className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold bg-[#f6f3f2] text-[#00628c] hover:bg-[#00628c]/5 transition-colors border border-[#00628c]/10 text-center"
               >
                 Ver todos os depoimentos
               </Link>
               <Link 
                href="/depoimentos/novo" 
                className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold bg-[#fc820c] text-white hover:scale-105 transition-transform shadow-lg shadow-[#fc820c]/20 text-center"
               >
                 Escrever um depoimento
               </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-gradient-to-r from-[#00628c] to-[#007cb0] rounded-[2rem] lg:rounded-[3.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-[#00628c]/30">
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl lg:text-5xl font-extrabold mb-6 font-headline">Pronto para fazer parte desta corrente?</h2>
                <p className="text-base lg:text-lg opacity-90 mb-8 lg:mb-10 leading-relaxed">Seja você um profissional em busca de espaço ou uma empresa querendo transformar vidas, seu lugar é aqui.</p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
                  <Link href="/talentos/cadastrar" className="bg-white text-[#00628c] px-8 lg:px-10 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:scale-105 transition-transform shadow-lg">
                    Cadastrar Currículo
                  </Link>
                  <Link href="/vagas/cadastrar" className="bg-[#bff444] text-[#141f00] px-8 lg:px-10 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:scale-105 transition-transform shadow-lg">
                    Anunciar uma Vaga
                  </Link>
                  <Link href="/negocios/cadastrar" className="bg-[#fc820c] text-white px-8 lg:px-10 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:scale-105 transition-transform shadow-lg">
                    Publicar seu Negócio
                  </Link>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#fc820c]/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
