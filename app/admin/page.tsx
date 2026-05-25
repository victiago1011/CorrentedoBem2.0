'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

import { 
  ChevronDown,
  Globe,
  LayoutGrid, 
  FileText, 
  History, 
  Settings, 
  Search, 
  Bell, 
  HelpCircle, 
  Briefcase, 
  Palette, 
  Megaphone, 
  DollarSign,
  CheckCircle2,
  XCircle,
  X,
  Menu,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Verified,
  ExternalLink,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  Zap,
  Paperclip,
  Handshake,
  Loader2,
  Quote,
  Edit,
  Trash2,
  Phone,
  TrendingUp,
  Upload,
  Maximize2,
  Minimize2,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, maskCurrency, maskPhone, ensureExternalLink, stripHtml } from '@/lib/utils';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

import Link from 'next/link';

// Helper component for candidate images with error fallback
const CandidateAvatar = ({ src, name, className = "object-cover" }: { src?: string; name: string; className?: string }) => {
  const [error, setError] = React.useState(false);
  const isGravatar = !src || src.includes('gravatar');

  if (error || isGravatar) {
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

  // --- Types ---

type View = 'noticias' | 'vagas' | 'curriculos' | 'negocios' | 'historico' | 'configuracoes' | 'galeria' | 'galeria_vagas' | 'galeria_negocios' | 'recusados' | 'contatos' | 'depoimentos';

interface Testimonial {
  id: string | number;
  name: string;
  role?: string;
  company?: string;
  content: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

interface Noticia {
  id: string | number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  author?: string;
  category?: string;
  status: 'pending' | 'active' | 'archived';
  published_at?: string;
  created_at?: string;
}

interface Job {
  id: string | number;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  contact_email?: string;
  contact_phone?: string;
  site_url?: string;
  attachment_url?: string;
  location: string;
  type: string;
  area: string;
  status: 'pending' | 'active' | 'rejected' | 'closed';
  date?: string;
  time?: string;
  salary: string;
  description: string;
  requirements: string[];
  logo_url?: string;
  verified?: boolean;
  created_at?: string;
}

interface Candidate {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  location: string;
  area: string;
  date?: string;
  time?: string;
  status: 'pending' | 'active' | 'rejected';
  role: string;
  summary: string;
  skills: string[];
  image: string;
  cv_url?: string;
  verified?: boolean;
  created_at?: string;
}

interface Negocio {
  id: string | number;
  title: string;
  owner_name: string;
  description: string;
  location: string;
  type: string;
  area: string;
  status: 'pending' | 'active' | 'rejected' | 'closed';
  contact_email?: string;
  contact_phone?: string;
  contact_name?: string;
  attachment_url?: string;
  link?: string;
  logo_url?: string;
  created_at?: string;
  verified?: boolean;
}

interface HistoryItem {
  id: string;
  action: string;
  details: string;
  created_at: string;
}

interface Contato {
  id: string | number;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

// --- Mock Data ---

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Desenvolvedor Frontend Sênior',
    company: 'Tech Solutions Inc.',
    location: 'Remoto / Brasil',
    type: 'Tempo Integral',
    area: 'Tecnologia',
    status: 'pending',
    date: '12 Out, 2023',
    time: '14:30',
    salary: 'R$ 12k - 16k',
    description: 'Buscamos uma pessoa apaixonada por interfaces modernas e performance. Você será responsável por liderar o desenvolvimento de nossos novos dashboards administrativos utilizando React, Tailwind CSS e integração com APIs RESTful.',
    requirements: ['5+ anos de experiência com React.', 'Domínio de TypeScript e Tailwind CSS.', 'Experiência com testes unitários (Jest/Cypress).'],
    verified: true
  },
  {
    id: '2',
    title: 'UI/UX Designer Pleno',
    company: 'Creative Minds Studio',
    location: 'São Paulo, SP • Híbrido',
    type: 'Híbrido',
    area: 'Tecnologia',
    status: 'pending',
    date: '11 Out, 2023',
    time: '09:15',
    salary: 'R$ 8k - 11k',
    description: 'Responsável por criar experiências incríveis para nossos usuários mobile e web.',
    requirements: ['3+ anos de experiência.', 'Figma expert.', 'Conhecimento em Design Systems.']
  },
  {
    id: '3',
    title: 'Analista de Marketing Digital',
    company: 'Varejo Global S.A.',
    location: 'Rio de Janeiro, RJ • Presencial',
    type: 'Presencial',
    area: 'Outros Serviços',
    status: 'pending',
    date: '10 Out, 2023',
    time: '17:45',
    salary: 'R$ 5k - 7k',
    description: 'Foco em performance e crescimento orgânico.',
    requirements: ['Experiência com SEO/SEM.', 'Análise de dados.', 'Gestão de redes sociais.']
  },
  {
    id: '4',
    title: 'Gerente de Contas',
    company: 'Fintech Inovadora',
    location: 'Remoto • PJ',
    type: 'PJ',
    area: 'Finanças',
    status: 'pending',
    date: '10 Out, 2023',
    time: '11:20',
    salary: 'R$ 10k + comissão',
    description: 'Gestão de carteira de clientes B2B.',
    requirements: ['Experiência em vendas consultivas.', 'Networking no setor financeiro.']
  }
];

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: '1',
    name: 'Ana Paula Castro',
    location: 'São Paulo, SP',
    area: 'Desenvolvimento Web',
    date: '12 Out, 2023',
    status: 'pending',
    role: 'Desenvolvedora Full Stack Pleno',
    summary: 'Desenvolvedora com mais de 5 anos de experiência em tecnologias JavaScript (React, Node.js). Especialista em criar arquiteturas escaláveis e foco total em experiência do usuário e acessibilidade.',
    skills: ['React & Next.js', 'TypeScript', 'Node.js (API Rest)', 'PostgreSQL', 'UI Design Systems', 'CI/CD Pipeline'],
    image: 'https://picsum.photos/seed/ana/200/200',
    verified: true
  },
  {
    id: '2',
    name: 'Bruno Lima',
    location: 'Rio de Janeiro, RJ',
    area: 'UI/UX Design',
    date: '11 Out, 2023',
    status: 'pending',
    role: 'Product Designer',
    summary: 'Especialista em interfaces intuitivas e centradas no usuário.',
    skills: ['Figma', 'Prototipagem', 'User Research'],
    image: 'https://picsum.photos/seed/bruno/200/200'
  },
  {
    id: '3',
    name: 'Carla Mendes',
    location: 'Belo Horizonte, MG',
    area: 'Marketing Digital',
    date: '10 Out, 2023',
    status: 'pending',
    role: 'Growth Hacker',
    summary: 'Focada em métricas e escala de negócios digitais.',
    skills: ['SEO', 'Google Ads', 'Copywriting'],
    image: 'https://picsum.photos/seed/carla/200/200'
  }
];

// --- Components ---

const Sidebar = ({ activeView, setView, isOpen, onClose }: { activeView: View, setView: (v: View) => void, isOpen: boolean, onClose: () => void }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "w-64 h-screen fixed left-0 top-0 bg-white border-r border-outline-variant/20 flex flex-col py-6 z-[70] transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 mb-10">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary leading-none font-headline tracking-tighter">Corrente do Bem</h2>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black mt-1">Painel Adm</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 text-on-surface-variant hover:text-primary transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {[
            { id: 'vagas', label: 'Vagas Pendentes', icon: <Clock className="w-5 h-5" /> },
            { id: 'noticias', label: 'Notícias', icon: <Megaphone className="w-5 h-5" /> },
            { id: 'curriculos', label: 'Currículos Pendentes', icon: <FileText className="w-5 h-5" /> },
            { id: 'negocios', label: 'Negócios Pendentes', icon: <TrendingUp className="w-5 h-5" /> },
            { id: 'depoimentos', label: 'Depoimentos Pendentes', icon: <Quote className="w-5 h-5" /> },
            { id: 'galeria_vagas', label: 'Galeria de Vagas', icon: <Briefcase className="w-5 h-5" /> },
            { id: 'galeria', label: 'Galeria de Talentos', icon: <LayoutGrid className="w-5 h-5" /> },
            { id: 'galeria_negocios', label: 'Galeria de Negócios', icon: <Zap className="w-5 h-5" /> },
            { id: 'recusados', label: 'Recusados', icon: <XCircle className="w-5 h-5" /> },
            { id: 'historico', label: 'Histórico', icon: <History className="w-5 h-5" /> },
            { id: 'contatos', label: 'Mensagens de Contato', icon: <Mail className="w-5 h-5" /> },
            { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as View);
                if (window.innerWidth < 1024) onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeView === item.id 
                  ? "bg-primary/5 text-primary font-bold border-r-4 border-primary" 
                  : "text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              <span className={cn("transition-transform group-hover:scale-110", activeView === item.id && "text-primary")}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 mt-auto space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-error hover:bg-error/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">Sair do Sistema</span>
          </button>
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Sistema Ativo</p>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ onMenuOpen }: { onMenuOpen: () => void }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 flex justify-between items-center px-4 lg:px-8">
      <div className="flex items-center gap-4 w-full max-w-md">
        <button 
          onClick={onMenuOpen}
          className="lg:hidden p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar vagas ou empresas..." 
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-6">
        <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
        </button>
        <div className="hidden sm:block h-8 w-[1px] bg-outline-variant/30"></div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-all group"
        >
          <span className="text-xs lg:text-sm font-semibold">Sair</span>
          <LogOut className="w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-300" />
        </button>
        <Link href="/" className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full hover:bg-surface-container-low transition-all group">
          <span className="text-xs lg:text-sm font-semibold text-primary">Site</span>
          <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </header>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [activeView, setView] = useState<View>('vagas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isAddingNegocio, setIsAddingNegocio] = useState(false);
  const [isAddingNoticia, setIsAddingNoticia] = useState(false);
  const [newsContent, setNewsContent] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editingNegocio, setEditingNegocio] = useState<Negocio | null>(null);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    requirements: false,
    attachments: false
  });
  
  const [talentSearch, setTalentSearch] = useState('');
  const [talentCategory, setTalentCategory] = useState('Todos os Talentos');
  const [jobSearch, setJobSearch] = useState('');
  const [jobCategory, setJobCategory] = useState('Todas as Vagas');
  const [negocioSearch, setNegocioSearch] = useState('');
  const [negocioCategory, setNegocioCategory] = useState('Todas');
  const [testimonialSearch, setTestimonialSearch] = useState('');
  const [settings, setSettings] = useState<{
    id?: number;
    platform_name: string;
    contact_email: string;
    manual_approval: boolean;
    auto_notifications: boolean;
  }>({
    platform_name: 'HumanConnect',
    contact_email: 'contato@humanconnect.com.br',
    manual_approval: true,
    auto_notifications: true
  });

  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'delete' | 'edit';
    target: 'job' | 'candidate' | 'negocio' | 'noticia';
    id: string | number;
    payload?: any;
  } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast('Imagem muito grande! Máximo 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link'
  ];

  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [richDescription, setRichDescription] = useState('');
  const [richSummary, setRichSummary] = useState('');
  const [richDescriptionNegocio, setRichDescriptionNegocio] = useState('');

  useEffect(() => {
    if (editingJob) setRichDescription(editingJob.description || '');
    else if (!isAddingJob) setRichDescription('');
  }, [editingJob, isAddingJob]);

  useEffect(() => {
    if (editingCandidate) setRichSummary(editingCandidate.summary || '');
  }, [editingCandidate]);

  useEffect(() => {
    if (editingNegocio) setRichDescriptionNegocio(editingNegocio.description || '');
    else if (!isAddingNegocio) setRichDescriptionNegocio('');
  }, [editingNegocio, isAddingNegocio]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobsRes, candidatesRes, negociosRes, noticiasRes, testimonialsRes, historyRes, settingsRes, contatosRes] = await Promise.all([
        supabase.from('vagas').select('*').order('created_at', { ascending: false }),
        supabase.from('talentos').select('*').order('created_at', { ascending: false }),
        supabase.from('negocios').select('*').order('created_at', { ascending: false }),
        supabase.from('noticias').select('*').order('created_at', { ascending: false }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('history').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*').maybeSingle(),
        supabase.from('contatos').select('*').order('created_at', { ascending: false })
      ]);

      if (jobsRes.data) setJobs(jobsRes.data);
      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (negociosRes.data) setNegocios(negociosRes.data);
      if (noticiasRes.data) setNoticias(noticiasRes.data);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data);
      if (historyRes.data) setHistory(historyRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (contatosRes.data) setContatos(contatosRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      triggerToast('Erro ao carregar dados', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        setIsAuthChecking(false);
        fetchData();
      }
    };
    checkAuth();
  }, [router, fetchData]);

  const approveJob = React.useCallback(async (id: string | number) => {
    const job = jobs.find(j => String(j.id) === String(id));
    if (!job) return;

    const { data, error } = await supabase
      .from('vagas')
      .update({ status: 'active' })
      .eq('id', id)
      .select();

    if (!error && data && data.length > 0) {
      setJobs(prev => prev.map(j => String(j.id) === String(id) ? { ...j, status: 'active' } : j));
      triggerToast('Vaga aprovada com sucesso!');
      
      const historyEntry = {
        action: 'Vaga Aprovada',
        details: `Vaga "${job.title}" da empresa "${job.company}" foi aprovada.`
      };
      
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      
      setSelectedJob(null);
      setConfirmAction(null);
    } else {
      console.error('Erro ao aprovar vaga:', error || 'Nenhuma linha afetada.');
      triggerToast(error ? `Erro: ${error.message}` : 'Erro: Vaga não encontrada ou RLS bloqueou.', 'error');
    }
  }, [jobs]);

  const rejectJob = React.useCallback(async (id: string | number) => {
    const job = jobs.find(j => String(j.id) === String(id));
    if (!job) return;

    const { data, error } = await supabase
      .from('vagas')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select();

    if (!error && data && data.length > 0) {
      setJobs(prev => prev.map(j => String(j.id) === String(id) ? { ...j, status: 'rejected' } : j));
      triggerToast('Vaga recusada.');
      
      const historyEntry = {
        action: 'Vaga Recusada',
        details: `Vaga "${job.title}" da empresa "${job.company}" foi recusada.`
      };
      
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      
      setSelectedJob(null);
      setConfirmAction(null);
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro ao recusar vaga.', 'error');
    }
  }, [jobs]);

  const deleteJob = React.useCallback(async (id: string | number) => {
    const job = jobs.find(j => String(j.id) === String(id));
    if (!job) return;

    const { error } = await supabase
      .from('vagas')
      .delete()
      .eq('id', id);

    if (!error) {
      setJobs(prev => prev.filter(j => String(j.id) !== String(id)));
      triggerToast('Vaga removida.');
      
      const historyEntry = {
        action: 'Vaga Removida',
        details: `Vaga "${job.title}" da empresa "${job.company}" foi removida manualmente.`
      };
      
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    } else {
      triggerToast(`Erro ao deletar: ${error.message}`, 'error');
    }
  }, [jobs]);

  const approveCandidate = React.useCallback(async (id: string | number) => {
    const cand = candidates.find(c => String(c.id) === String(id));
    if (!cand) return;

    const { data, error } = await supabase
      .from('talentos')
      .update({ status: 'active' })
      .eq('id', id)
      .select();

    if (!error && data && data.length > 0) {
      setCandidates(prev => prev.map(c => String(c.id) === String(id) ? { ...c, status: 'active' } : c));
      triggerToast('Currículo aprovado!');
      
      const historyEntry = {
        action: 'Currículo Aprovado',
        details: `Currículo de "${cand.name}" foi aprovado.`
      };
      
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      
      setSelectedCandidate(null);
      setConfirmAction(null);
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro: Currículo não encontrado ou RLS bloqueou.', 'error');
    }
  }, [candidates]);

  const rejectCandidate = React.useCallback(async (id: string | number) => {
    const cand = candidates.find(c => String(c.id) === String(id));
    if (!cand) return;

    const { data, error } = await supabase
      .from('talentos')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select();

    if (!error && data && data.length > 0) {
      setCandidates(prev => prev.map(c => String(c.id) === String(id) ? { ...c, status: 'rejected' } : c));
      triggerToast('Currículo recusado.');
      
      const historyEntry = {
        action: 'Currículo Recusado',
        details: `Currículo de "${cand.name}" foi recusado.`
      };
      
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      
      setSelectedCandidate(null);
      setConfirmAction(null);
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro ao recusar currículo.', 'error');
    }
  }, [candidates]);

  const approveTestimonial = React.useCallback(async (id: string | number) => {
    const testimonial = testimonials.find(t => String(t.id) === String(id));
    if (!testimonial) return;

    const { data, error } = await supabase
      .from('testimonials')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTestimonials(prev => prev.map(t => String(t.id) === String(id) ? data : t));
      triggerToast('Depoimento aprovado!');
      
      const historyEntry = {
        action: 'Depoimento Aprovado',
        details: `Depoimento de "${testimonial.name}" foi aprovado.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    } else {
      triggerToast(error ? error.message : 'Erro ao aprovar depoimento', 'error');
    }
  }, [testimonials]);

  const rejectTestimonial = React.useCallback(async (id: string | number) => {
    const testimonial = testimonials.find(t => String(t.id) === String(id));
    if (!testimonial) return;

    const { data, error } = await supabase
      .from('testimonials')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTestimonials(prev => prev.map(t => String(t.id) === String(id) ? data : t));
      triggerToast('Depoimento recusado.');
      
      const historyEntry = {
        action: 'Depoimento Recusado',
        details: `Depoimento de "${testimonial.name}" foi recusado.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    } else {
      triggerToast(error ? error.message : 'Erro ao recusar depoimento', 'error');
    }
  }, [testimonials]);

  const deleteTestimonial = React.useCallback(async (id: string | number) => {
    const testimonial = testimonials.find(t => String(t.id) === String(id));
    if (!testimonial) return;

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (!error) {
      setTestimonials(prev => prev.filter(t => String(t.id) !== String(id)));
      triggerToast('Depoimento removido.');
      
      const historyEntry = {
        action: 'Depoimento Removido',
        details: `Depoimento de "${testimonial.name}" foi removido manualmente.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    } else {
      triggerToast(`Erro ao deletar: ${error.message}`, 'error');
    }
  }, [testimonials]);

  const addJob = React.useCallback(async (newJob: Partial<Job>) => {
    const jobData = {
      title: newJob.title || 'Nova Vaga',
      company: newJob.company || 'Empresa',
      location: newJob.location || 'Remoto',
      type: newJob.type || 'Tempo Integral',
      area: newJob.area || 'Outros Serviços',
      status: 'active',
      salary: newJob.salary || 'A combinar',
      email: newJob.email || '',
      phone: newJob.phone || '',
      site_url: newJob.site_url || '',
      description: newJob.description || '',
      requirements: newJob.requirements || [],
    };

    const { data, error } = await supabase
      .from('vagas')
      .insert(jobData)
      .select()
      .single();

    if (data && !error) {
      setJobs(prev => [data, ...prev]);
      setIsAddingJob(false);
      
      const historyEntry = {
        action: 'Vaga Criada',
        details: `Vaga "${data.title}" foi criada manualmente.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    }
  }, []);

  const updateJob = React.useCallback(async (updatedJob: Job) => {
    const { data, error } = await supabase
      .from('vagas')
      .update({
        title: updatedJob.title,
        company: updatedJob.company,
        location: updatedJob.location,
        type: updatedJob.type,
        area: updatedJob.area,
        salary: updatedJob.salary,
        site_url: updatedJob.site_url,
        logo_url: updatedJob.logo_url,
        description: updatedJob.description,
        requirements: updatedJob.requirements,
      })
      .eq('id', updatedJob.id)
      .select()
      .single();

    if (data && !error) {
      setJobs(prev => prev.map(j => String(j.id) === String(data.id) ? data : j));
      setEditingJob(null);
      setConfirmAction(null);
      
      const historyEntry = {
        action: 'Vaga Editada',
        details: `Vaga "${data.title}" foi editada manualmente.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    }
  }, []);

  const deleteCandidate = React.useCallback(async (id: string | number) => {
    const cand = candidates.find(c => String(c.id) === String(id));
    if (!cand) return;

    const { error } = await supabase
      .from('talentos')
      .delete()
      .eq('id', id);

    if (!error) {
      setCandidates(prev => prev.filter(c => String(c.id) !== String(id)));
      triggerToast('Currículo removido.');
      setConfirmAction(null);
      
      const historyEntry = {
        action: 'Candidato Removido',
        details: `Currículo de "${cand.name}" foi removido manualmente.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    } else {
      triggerToast(`Erro ao deletar: ${error.message}`, 'error');
    }
  }, [candidates]);

  const updateCandidate = React.useCallback(async (updatedCand: Candidate) => {
    const { data, error } = await supabase
      .from('talentos')
      .update({
        name: updatedCand.name,
        location: updatedCand.location,
        area: updatedCand.area,
        role: updatedCand.role,
        summary: updatedCand.summary,
        skills: updatedCand.skills,
      })
      .eq('id', updatedCand.id)
      .select()
      .single();

    if (data && !error) {
      setCandidates(prev => prev.map(c => String(c.id) === String(data.id) ? data : c));
      setEditingCandidate(null);
      setConfirmAction(null);
      
      const historyEntry = {
        action: 'Candidato Editado',
        details: `Currículo de "${data.name}" foi editado manualmente.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    }
  }, []);

  // Negocios CRUD
  const approveNegocio = React.useCallback(async (id: string | number) => {
    const negocio = negocios.find(n => String(n.id) === String(id));
    if (!negocio) return;
    const { data, error } = await supabase.from('negocios').update({ status: 'active' }).eq('id', id).select();
    if (!error && data && data.length > 0) {
      setNegocios(prev => prev.map(n => String(n.id) === String(id) ? { ...n, status: 'active' } : n));
      triggerToast('Negócio aprovado!');
      const { data: hData } = await supabase.from('history').insert({
        action: 'Negócio Aprovado',
        details: `Negócio "${negocio.title}" foi aprovado.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      setSelectedNegocio(null);
      setConfirmAction(null);
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro: Negócio não encontrado ou RLS bloqueou.', 'error');
    }
  }, [negocios]);

  const rejectNegocio = React.useCallback(async (id: string | number) => {
    const negocio = negocios.find(n => String(n.id) === String(id));
    if (!negocio) return;
    const { data, error } = await supabase.from('negocios').update({ status: 'rejected' }).eq('id', id).select();
    if (!error && data && data.length > 0) {
      setNegocios(prev => prev.map(n => String(n.id) === String(id) ? { ...n, status: 'rejected' } : n));
      triggerToast('Negócio recusado.');
      const { data: hData } = await supabase.from('history').insert({
        action: 'Negócio Recusado',
        details: `Negócio "${negocio.title}" foi recusado.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      setSelectedNegocio(null);
      setConfirmAction(null);
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro ao recusar negócio.', 'error');
    }
  }, [negocios]);

  const deleteNegocio = React.useCallback(async (id: string | number) => {
    const negocio = negocios.find(n => String(n.id) === String(id));
    if (!negocio) return;
    const { error } = await supabase.from('negocios').delete().eq('id', id);
    if (!error) {
      setNegocios(prev => prev.filter(n => String(n.id) !== String(id)));
      triggerToast('Negócio removido.');
      const { data: hData } = await supabase.from('history').insert({
        action: 'Negócio Removido',
        details: `Negócio "${negocio.title}" foi removido manualmente.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      setConfirmAction(null);
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro ao deletar.', 'error');
    }
  }, [negocios]);

  const updateNegocio = React.useCallback(async (updatedNegocio: Negocio) => {
    const { data, error } = await supabase
      .from('negocios')
      .update({
        title: updatedNegocio.title,
        owner_name: updatedNegocio.owner_name,
        location: updatedNegocio.location,
        type: updatedNegocio.type,
        area: updatedNegocio.area,
        link: updatedNegocio.link,
        logo_url: updatedNegocio.logo_url,
        description: updatedNegocio.description,
        contact_email: updatedNegocio.contact_email,
        contact_phone: updatedNegocio.contact_phone,
        contact_name: updatedNegocio.contact_name,
      })
      .eq('id', updatedNegocio.id)
      .select()
      .single();

    if (data && !error) {
      setNegocios(prev => prev.map(n => String(n.id) === String(data.id) ? data : n));
      setEditingNegocio(null);
      setConfirmAction(null);
      
      const historyEntry = {
        action: 'Negócio Editado',
        details: `Negócio "${data.title}" foi editado manualmente.`
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      triggerToast('Negócio atualizado com sucesso!');
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro ao atualizar negócio.', 'error');
    }
  }, []);

  const approveNoticia = React.useCallback(async (id: string | number) => {
    const noticia = noticias.find(n => String(n.id) === String(id));
    if (!noticia) return;
    const { data, error } = await supabase.from('noticias').update({ status: 'active', published_at: new Date().toISOString() }).eq('id', id).select();
    if (!error && data && data.length > 0) {
      setNoticias(prev => prev.map(n => String(n.id) === String(id) ? { ...n, status: 'active' } : n));
      const { data: hData } = await supabase.from('history').insert({
        action: 'Notícia Aprovada',
        details: `Notícia "${noticia.title}" foi publicada.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      setSelectedNoticia(null);
      setConfirmAction(null);
      triggerToast('Notícia aprovada!');
    } else {
      triggerToast(error ? `Erro: ${error.message}` : 'Erro: Notícia não encontrada ou RLS bloqueou.', 'error');
    }
  }, [noticias]);

  const addNoticia = React.useCallback(async (newNoticia: Partial<Noticia>) => {
    const slug = (newNoticia.title || '').toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const noticiaData = {
      title: newNoticia.title || 'Nova Notícia',
      slug: `${slug}-${Date.now()}`,
      content: newNoticia.content || '',
      excerpt: newNoticia.excerpt || '',
      image_url: newNoticia.image_url || '',
      author: newNoticia.author || 'Administrador',
      category: newNoticia.category || 'Geral',
      status: 'active',
      published_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('noticias').insert(noticiaData).select().single();
    if (data && !error) {
      setNoticias(prev => [data, ...prev]);
      setIsAddingNoticia(false);
      const { data: hData } = await supabase.from('history').insert({
        action: 'Notícia Criada',
        details: `Notícia "${data.title}" foi postada.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    }
  }, []);

  const updateNoticia = React.useCallback(async (updatedNoticia: Noticia) => {
    const { data, error } = await supabase.from('noticias').update({
      title: updatedNoticia.title,
      content: updatedNoticia.content,
      excerpt: updatedNoticia.excerpt,
      image_url: updatedNoticia.image_url,
      author: updatedNoticia.author,
      category: updatedNoticia.category
    }).eq('id', updatedNoticia.id).select().single();

    if (data && !error) {
      setNoticias(prev => prev.map(n => n.id === data.id ? data : n));
      setEditingNoticia(null);
      const { data: hData } = await supabase.from('history').insert({
        action: 'Notícia Editada',
        details: `Notícia "${data.title}" foi atualizada.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    }
  }, []);

  const deleteNoticia = React.useCallback(async (id: string | number) => {
    const noticia = noticias.find(n => n.id === id);
    if (!noticia) return;
    const { error } = await supabase.from('noticias').delete().eq('id', id);
    if (!error) {
      setNoticias(prev => prev.filter(n => n.id !== id));
      const { data: hData } = await supabase.from('history').insert({
        action: 'Notícia Removida',
        details: `Notícia "${noticia.title}" foi excluída.`
      }).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
      setConfirmAction(null);
    }
  }, [noticias]);

  const deleteContato = React.useCallback(async (id: string | number) => {
    const { error } = await supabase.from('contatos').delete().eq('id', id);
    if (!error) {
      setContatos(prev => prev.filter(c => String(c.id) !== String(id)));
      triggerToast('Mensagem removida.');
    } else {
      triggerToast('Erro ao remover mensagem.', 'error');
    }
  }, []);

  const markContatoAsRead = React.useCallback(async (id: string | number) => {
    const { error } = await supabase.from('contatos').update({ lida: true }).eq('id', id);
    if (!error) {
      setContatos(prev => prev.map(c => String(c.id) === String(id) ? { ...c, lida: true } : c));
    }
  }, []);

  const handleSaveSettings = React.useCallback(async (formData: FormData) => {
    const newSettings = {
      platform_name: formData.get('platform_name') as string,
      contact_email: formData.get('contact_email') as string,
      manual_approval: formData.get('manual_approval') === 'on',
      auto_notifications: formData.get('auto_notifications') === 'on',
    };

    // Se já temos um ID, usamos ele para atualizar. Se não, deixamos o banco gerar.
    const payload = settings.id ? { id: settings.id, ...newSettings } : newSettings;

    const { data, error } = await supabase
      .from('settings')
      .upsert(payload)
      .select()
      .single();

    if (!error && data) {
      setSettings(data);
      triggerToast('Configurações salvas com sucesso!');
      
      const historyEntry = {
        action: 'Configurações Atualizadas',
        details: 'As configurações globais do sistema foram atualizadas.'
      };
      const { data: hData } = await supabase.from('history').insert(historyEntry).select().single();
      if (hData) setHistory(prev => [hData, ...prev]);
    } else {
      console.error('Error saving settings:', error);
      triggerToast('Erro ao salvar configurações.', 'error');
    }
  }, [settings.id]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-sm font-black text-primary uppercase tracking-widest animate-pulse">Verificando Credenciais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar activeView={activeView} setView={setView} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="lg:ml-64 pt-16 flex-1 flex flex-col w-full">
        <Header onMenuOpen={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Sincronizando Dados...</p>
                </div>
              </div>
            )}
            {activeView === 'vagas' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Vagas Pendentes</h1>
                    <p className="text-on-surface-variant mt-1">Gerencie e analise as solicitações de novas vagas na plataforma.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="px-4 py-2 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-full text-xs flex items-center gap-2 shadow-sm">
                      <Zap className="w-4 h-4 fill-current" />
                      {jobs.filter(j => j.status === 'pending').length} Pendentes Hoje
                    </span>
                  </div>
                </header>

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-surface-container-low border-b border-outline-variant/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Vaga / Cargo</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Empresa</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2">Área / Tipo</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Data de Envio</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {jobs.filter(j => j.status === 'pending').map((job) => (
                        <tr 
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className={cn(
                            "hover:bg-primary/5 transition-all cursor-pointer group",
                            selectedJob?.id === job.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                          )}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative overflow-hidden",
                                selectedJob?.id === job.id ? "bg-primary text-on-primary" : "bg-surface-container text-outline group-hover:bg-primary/20 group-hover:text-primary"
                              )}>
                                {job.logo_url ? (
                                  <Image src={job.logo_url} alt="Logo" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                                ) : (job.attachment_url && job.attachment_url.startsWith('data:image')) ? (
                                  <Image src={job.attachment_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Briefcase className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className={cn("font-bold", selectedJob?.id === job.id ? "text-primary" : "text-on-surface")}>{job.title}</p>
                                <p className="text-xs text-on-surface-variant">{job.location} • {job.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{job.company}</span>
                              {job.verified && <Verified className="w-4 h-4 text-tertiary fill-current" />}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg w-fit">{job.area}</span>
                              <span className="text-[10px] text-on-surface-variant font-medium">{job.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant">
                            {job.date || 'Hoje'} • {job.time || 'Agora'}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button className={cn(
                              "px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95",
                              selectedJob?.id === job.id 
                                ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                                : "bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary"
                            )}>
                              Analisar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {jobs.filter(j => j.status === 'pending').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant">
                            Nenhuma vaga pendente no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeView === 'noticias' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Gerenciar Notícias</h1>
                    <p className="text-on-surface-variant mt-1">Crie e edite as últimas novidades da comunidade.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAddingNoticia(true);
                      setNewsContent('');
                      setNewsImageUrl('');
                    }}
                    className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Megaphone className="w-5 h-5" />
                    Nova Notícia
                  </button>
                </header>

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-surface-container-low border-b border-outline-variant/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Notícia</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Categoria</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Autor</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Data</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {noticias.map((n) => (
                        <tr key={n.id} className="hover:bg-primary/5 transition-all group border-l-4 border-transparent">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              {n.image_url && (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                                  <Image 
                                    src={n.image_url} 
                                    alt={n.title} 
                                    fill 
                                    className="object-cover" 
                                    unoptimized 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <p className="font-bold text-on-surface line-clamp-1">{n.title}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-full">
                              {n.category}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant">
                            {n.author}
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant">
                            {n.published_at ? new Date(n.published_at).toLocaleDateString('pt-BR') : 'Não publicada'}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingNoticia(n);
                                  setNewsContent(n.content);
                                  setNewsImageUrl(n.image_url || '');
                                }}
                                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => setConfirmAction({ type: 'delete', target: 'noticia' as any, id: n.id })}
                                className="p-2 text-on-surface-variant hover:text-secondary transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {noticias.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                            Nenhuma notícia cadastrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeView === 'curriculos' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <span className="text-secondary font-bold text-sm tracking-widest uppercase mb-2 block">Central de Talentos</span>
                    <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                      Currículos <span className="text-primary italic">Pendentes</span>
                    </h1>
                    <p className="text-on-surface-variant mt-2 max-w-xl">Analise e aprove novos candidatos para a rede. Cada currículo é uma oportunidade de transformar uma carreira.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-tertiary-fixed flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-tertiary-fixed/20 flex items-center justify-center text-tertiary">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface leading-tight">{candidates.filter(c => c.status === 'pending').length}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Aguardando Revisão</p>
                    </div>
                  </div>
                </header>

                <div className="bg-white rounded-2xl p-2 shadow-sm border border-outline-variant/10 overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2 px-2 min-w-[600px]">
                    <thead className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
                      <tr>
                        <th className="px-4 py-4">Candidato</th>
                        <th className="px-4 py-4">Área</th>
                        <th className="px-4 py-4">Data</th>
                        <th className="px-4 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {candidates.filter(c => c.status === 'pending').map((c) => (
                        <tr 
                          key={c.id}
                          onClick={() => setSelectedCandidate(c)}
                          className={cn(
                            "group hover:bg-surface-container-low transition-all cursor-pointer rounded-xl",
                            selectedCandidate?.id === c.id ? "bg-surface-container-low" : "bg-surface-container-low/30"
                          )}
                        >
                          <td className="px-4 py-4 rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-sm">
                                <CandidateAvatar src={c.image} name={c.name} />
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{c.name}</p>
                                <p className="text-[11px] text-on-surface-variant">{c.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">{c.area}</span>
                          </td>
                          <td className="px-4 py-4 text-on-surface-variant font-medium">{c.date || 'Hoje'}</td>
                          <td className="px-4 py-4 rounded-r-xl">
                            <div className="flex items-center gap-1 text-secondary font-bold text-xs italic uppercase">
                              <span className="w-2 h-2 rounded-full bg-secondary"></span>
                              Pendente
                            </div>
                          </td>
                        </tr>
                      ))}
                      {candidates.filter(c => c.status === 'pending').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-on-surface-variant">
                            Nenhum currículo pendente no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeView === 'negocios' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <span className="text-orange-600 font-bold text-sm tracking-widest uppercase mb-2 block">Central de Negócios</span>
                    <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                      Negócios <span className="text-orange-600 italic">Pendentes</span>
                    </h1>
                    <p className="text-on-surface-variant mt-2 max-w-xl">Gerencie propostas de parcerias e investimentos. Analise cada oportunidade com critério.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-orange-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface leading-tight">{negocios.filter(n => n.status === 'pending').length}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Aguardando Revisão</p>
                    </div>
                  </div>
                </header>

                <div className="bg-white rounded-2xl p-2 shadow-sm border border-outline-variant/10 overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2 px-2 min-w-[600px]">
                    <thead className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
                      <tr>
                        <th className="px-4 py-4">Negócio / Oportunidade</th>
                        <th className="px-4 py-4">Empresa</th>
                        <th className="px-4 py-4">Área / Tipo</th>
                        <th className="px-4 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {negocios.filter(n => n.status === 'pending').map((n) => (
                        <tr 
                          key={n.id}
                          onClick={() => setSelectedNegocio(n)}
                          className={cn(
                            "group hover:bg-orange-50 transition-all cursor-pointer rounded-xl",
                            selectedNegocio?.id === n.id ? "bg-orange-50" : "bg-surface-container-low/30"
                          )}
                        >
                          <td className="px-4 py-4 rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 relative overflow-hidden">
                                {n.logo_url ? (
                                  <Image src={n.logo_url} alt="Logo" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                                ) : (n.attachment_url && n.attachment_url.startsWith('data:image')) ? (
                                  <Image src={n.attachment_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <TrendingUp className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{n.title}</p>
                                <p className="text-[11px] text-on-surface-variant">{n.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium text-on-surface-variant">{n.owner_name}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-lg w-fit">{n.area}</span>
                              <span className="text-[10px] text-on-surface-variant font-medium">{n.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 rounded-r-xl">
                            <div className="flex items-center gap-1 text-orange-600 font-bold text-xs italic uppercase">
                              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                              Pendente
                            </div>
                          </td>
                        </tr>
                      ))}
                      {negocios.filter(n => n.status === 'pending').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-on-surface-variant">
                            Nenhum negócio pendente no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeView === 'depoimentos' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Depoimentos Pendentes</h1>
                    <p className="text-on-surface-variant mt-1">Gerencie os depoimentos enviados pela comunidade para o site.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-full text-xs flex items-center gap-2">
                       {testimonials.filter(t => t.status === 'pending').length} Pendentes
                    </span>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                  {testimonials.filter(t => t.status === 'pending').map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container border-2 border-primary/20">
                          {t.photo_url ? (
                            <Image src={t.photo_url} alt={t.name} width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline-variant">
                              <User className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-on-surface">{t.name}</h3>
                            <p className="text-sm text-primary font-medium">{t.role} {t.company && `em ${t.company}`}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => approveTestimonial(t.id)}
                              className="px-4 py-2 bg-tertiary text-on-tertiary rounded-xl font-bold text-xs shadow-md shadow-tertiary/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprovar
                            </button>
                            <button 
                              onClick={() => rejectTestimonial(t.id)}
                              className="px-4 py-2 bg-error text-on-error rounded-xl font-bold text-xs shadow-md shadow-error/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Recusar
                            </button>
                          </div>
                        </div>
                        <div className="bg-surface-container-low p-4 rounded-2xl italic text-on-surface-variant text-sm border border-outline-variant/5">
                          &quot;{t.content}&quot;
                        </div>
                        <div className="flex justify-end pt-2">
                           <button 
                             onClick={() => deleteTestimonial(t.id)}
                             className="text-xs font-bold text-error hover:underline flex items-center gap-1"
                           >
                             <Trash2 className="w-3 h-3" />
                             Excluir Permanentemente
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {testimonials.filter(t => t.status === 'pending').length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-outline-variant/30">
                       <Quote className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-50" />
                       <p className="text-on-surface-variant font-bold">Nenhum depoimento aguardando aprovação.</p>
                    </div>
                  )}
                </div>

                {testimonials.filter(t => t.status === 'approved').length > 0 && (
                   <div className="mt-12 space-y-6">
                      <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 px-2">
                        <CheckCircle2 className="w-5 h-5 text-tertiary" />
                        Depoimentos Aprovados
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.filter(t => t.status === 'approved').map((t) => (
                          <div key={t.id} className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex gap-4">
                             <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-primary/10">
                                {t.photo_url ? (
                                  <Image src={t.photo_url} alt={t.name} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-surface-container flex items-center justify-center text-outline-variant">
                                    <User className="w-6 h-6" />
                                  </div>
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="truncate">
                                    <p className="font-bold text-on-surface truncate">{t.name}</p>
                                    <p className="text-[10px] text-primary font-medium truncate">{t.role} {t.company && `em ${t.company}`}</p>
                                  </div>
                                  <button 
                                    onClick={() => deleteTestimonial(t.id)}
                                    className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 italic">&quot;{t.content}&quot;</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                )}
              </motion.div>
            )}

            {activeView === 'galeria_negocios' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-orange-700 tracking-tight font-headline">Galeria de Negócios</h1>
                    <p className="text-on-surface-variant mt-1">Negócios ativos e oportunidades de parceria disponíveis na plataforma.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                      <input 
                        type="text" 
                        value={negocioSearch}
                        onChange={(e) => setNegocioSearch(e.target.value)}
                        placeholder="Buscar negócio..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                      />
                    </div>
                  </div>
                </header>

                <nav className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                  {['Todas', 'Tecnologia', 'Comércio', 'Serviços', 'Franquias', 'Esportes', 'Outros'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setNegocioCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                        negocioCategory === cat ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {negocios
                    .filter(n => n.status === 'active')
                    .filter(n => negocioCategory === 'Todas' || n.area === negocioCategory)
                    .filter(n => n.title.toLowerCase().includes(negocioSearch.toLowerCase()) || n.owner_name.toLowerCase().includes(negocioSearch.toLowerCase()))
                    .map((n) => (
                      <div key={n.id} className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-all group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 relative overflow-hidden">
                            {n.logo_url ? (
                              <Image src={n.logo_url} alt="Logo" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                            ) : (n.attachment_url && n.attachment_url.startsWith('data:image')) ? (
                              <Image src={n.attachment_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <TrendingUp className="w-6 h-6" />
                            )}
                          </div>
                          <button 
                            onClick={() => setConfirmAction({ type: 'delete', target: 'negocio' as any, id: n.id })}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{n.title}</h3>
                        <p className="text-orange-600 font-semibold text-sm mb-3">{n.owner_name}</p>
                        <p className="text-on-surface-variant text-xs mb-4 line-clamp-3">{stripHtml(n.description)}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10 mt-auto">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full uppercase">{n.type}</span>
                          <button 
                            onClick={() => setSelectedNegocio(n)}
                            className="text-xs font-bold text-[#00628c] hover:underline"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  {negocios.filter(n => n.status === 'active').length === 0 && (
                    <div className="col-span-full py-12 text-center text-on-surface-variant">
                      Nenhum negócio ativo na galeria.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'galeria_vagas' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Galeria de Vagas</h1>
                    <p className="text-on-surface-variant mt-1">Gerencie as vagas ativas no site. Adicione novas ou remova as encerradas.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                      <input 
                        type="text" 
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        placeholder="Buscar vaga..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => setIsAddingJob(true)}
                      className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 text-sm"
                    >
                      <Briefcase className="w-4 h-4" />
                      Nova Vaga
                    </button>
                  </div>
                </header>

                <nav className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                  {['Todas as Vagas', 'Tecnologia', 'Saúde', 'Finanças', 'Engenharia', 'Outros Serviços'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setJobCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                        jobCategory === cat ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </nav>

                <div className="flex flex-col lg:flex-row gap-12">
                  <aside className="w-full lg:w-72 space-y-10">
                    <div>
                      <h3 className="font-headline font-bold text-lg mb-6">Tipo de Contratação</h3>
                      <div className="space-y-4">
                        {['Tempo Integral', 'Meio Período', 'PJ / Freelance', 'Híbrido', 'Remoto'].map(d => (
                          <label key={d} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary w-5 h-5" />
                            <span className="text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg mb-6">Nível de Experiência</h3>
                      <div className="space-y-4">
                        {['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'].map(d => (
                          <label key={d} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary w-5 h-5" />
                            <span className="text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="pt-6">
                      <button className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" />
                        Filtrar Vagas
                      </button>
                    </div>
                  </aside>

                  <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    {jobs
                      .filter(j => j.status === 'active')
                      .filter(j => jobCategory === 'Todas as Vagas' || j.area === jobCategory)
                      .filter(j => j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.company.toLowerCase().includes(jobSearch.toLowerCase()))
                      .map((job) => (
                      <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-all group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden">
                            {job.logo_url ? (
                              <Image src={job.logo_url} alt="Logo" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                            ) : (job.attachment_url && job.attachment_url.startsWith('data:image')) ? (
                              <Image src={job.attachment_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Briefcase className="w-6 h-6" />
                            )}
                          </div>
                          <button 
                            onClick={() => setConfirmAction({ type: 'delete', target: 'job', id: job.id })}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                        <p className="text-primary font-semibold text-sm mb-3">{job.company}</p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <Clock className="w-3 h-3" />
                            {job.type} • {job.area}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10 mt-auto">
                          <span className="text-xs font-bold text-tertiary uppercase">ATIVA</span>
                          <button 
                            onClick={() => setEditingJob(job)}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}
                    {jobs.filter(j => j.status === 'active').length === 0 && (
                      <div className="col-span-full py-12 text-center text-on-surface-variant">
                        Nenhuma vaga ativa na galeria.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'recusados' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header>
                  <h1 className="text-3xl font-extrabold text-error tracking-tight font-headline">Itens Recusados</h1>
                  <p className="text-on-surface-variant mt-1">Visualize vagas e candidatos que não foram aprovados.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Vagas Recusadas
                    </h2>
                    <div className="space-y-3">
                      {jobs.filter(j => j.status === 'rejected').map(job => (
                        <div key={job.id} className="p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="font-bold text-on-surface">{job.title}</p>
                            <p className="text-xs text-on-surface-variant">{job.company}</p>
                          </div>
                          <button 
                            onClick={() => setConfirmAction({ type: 'approve', target: 'job', id: job.id })}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Reavaliar
                          </button>
                        </div>
                      ))}
                      {jobs.filter(j => j.status === 'rejected').length === 0 && (
                        <p className="text-sm text-on-surface-variant italic">Nenhuma vaga recusada.</p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Candidatos Recusados
                    </h2>
                    <div className="space-y-3">
                      {candidates.filter(c => c.status === 'rejected').map(cand => (
                        <div key={cand.id} className="p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                              <CandidateAvatar src={cand.image} name={cand.name} />
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{cand.name}</p>
                              <p className="text-xs text-on-surface-variant">{cand.role}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setConfirmAction({ type: 'approve', target: 'candidate', id: cand.id })}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Reavaliar
                          </button>
                        </div>
                      ))}
                      {candidates.filter(c => c.status === 'rejected').length === 0 && (
                        <p className="text-sm text-on-surface-variant italic">Nenhum candidato recusado.</p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Negócios Recusados
                    </h2>
                    <div className="space-y-3">
                      {negocios.filter(n => n.status === 'rejected').map(neg => (
                        <div key={neg.id} className="p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="font-bold text-on-surface">{neg.title}</p>
                            <p className="text-xs text-on-surface-variant">{neg.owner_name}</p>
                          </div>
                          <button 
                            onClick={() => setConfirmAction({ type: 'approve', target: 'negocio' as any, id: neg.id })}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Reavaliar
                          </button>
                        </div>
                      ))}
                      {negocios.filter(n => n.status === 'rejected').length === 0 && (
                        <p className="text-sm text-on-surface-variant italic">Nenhum negócio recusado.</p>
                      )}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
            
            {activeView === 'contatos' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header>
                  <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Mensagens de Contato</h1>
                  <p className="text-on-surface-variant mt-1">Veja quem entrou em contato através do formulário do site.</p>
                </header>

                <div className="grid grid-cols-1 gap-6 text-left">
                  {contatos.length > 0 ? (
                    contatos.map((contato) => (
                      <div 
                        key={contato.id} 
                        className={cn(
                          "bg-white p-6 rounded-3xl border transition-all duration-300 relative group",
                          contato.lida ? "border-outline-variant/10 opacity-70" : "border-primary/20 shadow-md shadow-primary/5"
                        )}
                      >
                        {!contato.lida && (
                          <div className="absolute top-6 right-6 flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Nova</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                            contato.lida ? "bg-surface-container-highest text-on-surface-variant" : "bg-primary/10 text-primary"
                          )}>
                            <Mail className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div>
                               <div className="flex items-center gap-3 mb-1 flex-wrap">
                                 <h3 className="text-lg font-bold text-on-surface">{contato.nome}</h3>
                                 <span className="text-xs font-medium text-on-surface-variant">{contato.email}</span>
                                 <span className="text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container-low px-2 py-0.5 rounded-full">
                                   {new Date(contato.created_at).toLocaleString('pt-BR')}
                                 </span>
                               </div>
                               <p className="text-primary font-bold text-sm">{contato.assunto}</p>
                            </div>

                            <div className="bg-[#f6f3f2] p-6 rounded-2xl text-on-surface-variant text-sm border border-outline-variant/5 italic shadow-inner">
                              &quot;{contato.mensagem}&quot;
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                              {!contato.lida && (
                                <button 
                                  onClick={() => markContatoAsRead(contato.id)}
                                  className="text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all"
                                >
                                  Marcar como Lida
                                </button>
                              )}
                              <button 
                                onClick={() => deleteContato(contato.id)}
                                className="text-xs font-black uppercase tracking-widest text-error hover:bg-error/5 px-4 py-2 rounded-xl transition-all"
                              >
                                Apagar Mensagem
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-outline-variant/30">
                      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6 text-outline">
                        <Mail className="w-10 h-10" />
                      </div>
                      <p className="text-on-surface-variant font-bold">Nenhuma mensagem recebida ainda.</p>
                      <p className="text-xs text-outline mt-1">As mensagens enviadas pelo site aparecerão aqui.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'historico' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header>
                  <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Histórico de Ações</h1>
                  <p className="text-on-surface-variant mt-1">Acompanhe todas as atividades de moderação realizadas no painel.</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                  <div className="divide-y divide-outline-variant/10">
                    {history.length > 0 ? history.map((item) => (
                      <div key={item.id} className="p-6 hover:bg-surface-container-low transition-colors flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          item.action.includes('Aprovada') || item.action.includes('Aprovado') ? "bg-tertiary/10 text-tertiary" : 
                          item.action.includes('Recusada') || item.action.includes('Recusado') ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                        )}>
                          <History className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-on-surface">{item.action}</p>
                            <span className="text-xs text-on-surface-variant">{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-sm text-on-surface-variant">{item.details}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center text-on-surface-variant">
                        Nenhuma ação registrada ainda.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'galeria' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="max-w-2xl">
                    <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4 font-headline">Galeria de Talentos</h1>
                    <p className="text-on-surface-variant text-lg">Conecte-se com profissionais excepcionais prontos para transformar sua empresa com dignidade e competência.</p>
                  </div>
                  <div className="w-full md:w-96">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                      <input 
                        type="text" 
                        value={talentSearch}
                        onChange={(e) => setTalentSearch(e.target.value)}
                        placeholder="Buscar por nome ou competência..." 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-surface-container-highest focus:bg-white focus:ring-2 focus:ring-primary/40 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </header>

                <nav className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                  {['Todos os Talentos', 'Tecnologia', 'Saúde', 'Finanças', 'Engenharia', 'Outros Serviços'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setTalentCategory(cat)}
                      className={cn(
                        "px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all",
                        talentCategory === cat ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </nav>

                <div className="flex flex-col lg:flex-row gap-12">
                  <aside className="w-full lg:w-72 space-y-10">
                    <div>
                      <h3 className="font-headline font-bold text-lg mb-6">Disponibilidade</h3>
                      <div className="space-y-4">
                        {['Imediata', 'Em 15 dias', 'Em 30 dias'].map(d => (
                          <label key={d} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary w-5 h-5" />
                            <span className="text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg mb-6">Localização</h3>
                      <div className="space-y-4">
                        {['Remoto', 'Híbrido', 'Presencial'].map(l => (
                          <label key={l} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" defaultChecked={l === 'Remoto'} className="rounded border-outline-variant text-primary focus:ring-primary w-5 h-5" />
                            <span className="text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">{l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="pt-6">
                      <button className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" />
                        Filtrar Talentos
                      </button>
                    </div>
                  </aside>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {candidates
                      .filter(c => c.status === 'active')
                      .filter(c => talentCategory === 'Todos os Talentos' || c.area.includes(talentCategory) || (talentCategory === 'Tecnologia' && c.area.includes('Desenvolvimento')))
                      .filter(c => c.name.toLowerCase().includes(talentSearch.toLowerCase()) || c.skills.some(s => s.toLowerCase().includes(talentSearch.toLowerCase())))
                      .map((cand) => (
                      <div key={cand.id} className="bg-surface-container-low rounded-3xl p-6 hover:bg-white transition-all duration-300 border border-outline-variant/10 group relative flex flex-col">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingCandidate(cand)}
                            className="p-2 bg-white rounded-full shadow-sm text-primary hover:bg-primary hover:text-white transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ type: 'delete', target: 'candidate', id: cand.id })}
                            className="p-2 bg-white rounded-full shadow-sm text-error hover:bg-error hover:text-white transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-4 mb-4">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md shrink-0">
                            <CandidateAvatar src={cand.image} name={cand.name} />
                          </div>
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-widest">{cand.area}</span>
                            <h4 className="text-lg font-bold mt-1 font-headline leading-tight">{cand.name}</h4>
                            <p className="text-primary text-xs font-medium">{cand.role}</p>
                          </div>
                        </div>
                        <p className="text-on-surface-variant text-xs mb-4 leading-relaxed line-clamp-3">
                          {stripHtml(cand.summary)}
                        </p>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/5">
                          <div className="flex items-center text-on-surface-variant text-[10px] gap-1 font-medium">
                            <MapPin className="w-3 h-3" />
                            {cand.location}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedCandidate(cand);
                            }}
                            className="text-primary font-bold text-xs hover:underline decoration-2 underline-offset-4"
                          >
                            Ver Currículo
                          </button>
                        </div>
                      </div>
                    ))}
                    {candidates.filter(c => c.status === 'active').length === 0 && (
                      <div className="col-span-2 p-12 text-center text-on-surface-variant">
                        Nenhum talento aprovado na galeria ainda.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'configuracoes' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 max-w-4xl"
              >
                <header>
                  <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Configurações do Sistema</h1>
                  <p className="text-on-surface-variant mt-1">Gerencie as preferências globais da plataforma HumanConnect.</p>
                </header>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSettings(new FormData(e.currentTarget));
                }} className="grid grid-cols-1 gap-6">
                  <section className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Geral
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase">Nome da Plataforma</label>
                        <input name="platform_name" defaultValue={settings.platform_name} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase">E-mail de Contato</label>
                        <input name="contact_email" defaultValue={settings.contact_email} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Segurança & Moderação
                    </h2>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name="manual_approval" defaultChecked={settings.manual_approval} className="rounded border-outline-variant text-primary focus:ring-primary w-5 h-5" />
                        <div>
                          <p className="font-bold text-on-surface">Aprovação Manual Obrigatória</p>
                          <p className="text-xs text-on-surface-variant">Novas vagas e currículos devem ser aprovados por um administrador.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name="auto_notifications" defaultChecked={settings.auto_notifications} className="rounded border-outline-variant text-primary focus:ring-primary w-5 h-5" />
                        <div>
                          <p className="font-bold text-on-surface">Notificações Automáticas</p>
                          <p className="text-xs text-on-surface-variant">Enviar e-mails automáticos após aprovação ou recusa.</p>
                        </div>
                      </label>
                    </div>
                  </section>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      Salvar Configurações
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {isAddingJob && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl lg:text-2xl font-bold text-primary font-headline">Cadastrar Nova Vaga</h2>
                  <button onClick={() => setIsAddingJob(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-on-surface-variant" />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addJob({
                    title: formData.get('title') as string,
                    company: formData.get('company') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    location: formData.get('location') as string,
                    type: formData.get('type') as string,
                    area: formData.get('area') as string,
                    salary: formData.get('salary') as string,
                    description: richDescription,
                    requirements: (formData.get('requirements') as string).split('\n').filter(r => r.trim()),
                  });
                }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Título da Vaga</label>
                      <input name="title" required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Ex: Desenvolvedor React" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Empresa</label>
                      <input name="company" required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Nome da empresa" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">E-mail de Contato</label>
                      <input name="email" type="email" className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="contato@empresa.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Telefone / WhatsApp</label>
                      <input 
                        name="phone" 
                        className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" 
                        placeholder="(00) 00000-0000"
                        onInput={(e) => {
                          const input = e.target as HTMLInputElement;
                          input.value = maskPhone(input.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Localização</label>
                      <input name="location" required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Ex: Remoto" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Área / Setor</label>
                      <select name="area" className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none">
                        <option>Tecnologia</option>
                        <option>Saúde</option>
                        <option>Finanças</option>
                        <option>Engenharia</option>
                        <option>Outros Serviços</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Tipo</label>
                      <select name="type" className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none">
                        <option>Tempo Integral</option>
                        <option>Meio Período</option>
                        <option>PJ / Freelance</option>
                        <option>Híbrido</option>
                        <option>Remoto</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Salário</label>
                      <input name="salary" className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Ex: R$ 5.000" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Descrição</label>
                    <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden">
                      <ReactQuill 
                        theme="snow"
                        value={richDescription}
                        onChange={setRichDescription}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Descreva a vaga..."
                        className="h-48"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Requisitos (um por linha)</label>
                    <textarea name="requirements" rows={3} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Ex: React&#10;TypeScript&#10;Tailwind"></textarea>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddingJob(false)} className="flex-1 py-3 px-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 px-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Publicar Vaga</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Right Panel (Contextual Detail) */}
          <AnimatePresence mode="wait">
            {(activeView === 'vagas' && selectedJob) && (
              <motion.aside 
                key={`job-${selectedJob.id}`}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed lg:relative top-0 right-0 w-full lg:w-[450px] h-full bg-white border-l border-outline-variant/10 p-6 lg:p-8 overflow-y-auto shadow-2xl z-[80] lg:z-30"
              >
                <div className="flex justify-between items-start mb-6">
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <span className="px-3 py-1 bg-secondary-container/20 text-secondary font-bold text-[10px] uppercase tracking-wider rounded-full">Pendente</span>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-4 border-surface-container shadow-sm bg-surface-container flex items-center justify-center">
                      {selectedJob.logo_url ? (
                        <Image src={selectedJob.logo_url} alt="Logo" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                      ) : (selectedJob.attachment_url && selectedJob.attachment_url.startsWith('data:image')) ? (
                        <Image src={selectedJob.attachment_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Briefcase className="w-8 h-8 text-outline" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-on-surface leading-tight font-headline">{selectedJob.title}</h2>
                      <p className="text-primary font-bold">{selectedJob.company}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Localização</p>
                      <p className="text-sm font-bold">{selectedJob.location}</p>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Salário</p>
                      <p className="text-sm font-bold">{selectedJob.salary}</p>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Tipo</p>
                      <p className="text-sm font-bold">{selectedJob.type}</p>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Área</p>
                      <p className="text-sm font-bold">{selectedJob.area}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-2">Contato</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          {selectedJob.email || selectedJob.contact_email || 'Não informado'}
                        </p>
                        {(selectedJob.phone || selectedJob.contact_phone) && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            {selectedJob.phone || selectedJob.contact_phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedJob.site_url && (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] uppercase font-bold text-primary mb-2">Link da Vaga</p>
                        <a 
                          href={ensureExternalLink(selectedJob.site_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-primary hover:underline flex items-center gap-2 break-all"
                        >
                          <Globe className="w-4 h-4 shrink-0" />
                          <span className="truncate">{selectedJob.site_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  {/* Collapsible Sections Accordion */}
                  <div className="border border-outline-variant/10 rounded-3xl overflow-hidden bg-surface-container-low/30">
                    {/* Description Section */}
                    <button 
                      onClick={() => setExpandedSections(prev => ({...prev, description: !prev.description}))}
                      className="w-full p-5 flex items-center justify-between transition-colors hover:bg-surface-container-low group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Descrição</span>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-outline transition-transform duration-300", expandedSections.description && "rotate-180")} />
                    </button>
                    {expandedSections.description && (
                      <div className="p-5 pt-0 text-sm text-on-surface-variant leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                        <div dangerouslySetInnerHTML={{ __html: selectedJob.description }} className="rich-text-content prose prose-sm max-w-none" />
                      </div>
                    )}

                    <div className="h-px bg-outline-variant/10 mx-5" />

                    {/* Requirements Section */}
                    <button 
                      onClick={() => setExpandedSections(prev => ({...prev, requirements: !prev.requirements}))}
                      className="w-full p-5 flex items-center justify-between transition-colors hover:bg-surface-container-low group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Requisitos</span>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-outline transition-transform duration-300", expandedSections.requirements && "rotate-180")} />
                    </button>
                    {expandedSections.requirements && (
                      <div className="p-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ul className="text-sm text-on-surface-variant space-y-3">
                          {selectedJob.requirements.map((req, i) => (
                            <li key={i} className="flex gap-3 items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="h-px bg-outline-variant/10 mx-5" />

                    {/* Attachments Section */}
                    <button 
                      onClick={() => setExpandedSections(prev => ({...prev, attachments: !prev.attachments}))}
                      className="w-full p-5 flex items-center justify-between transition-colors hover:bg-surface-container-low group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Anexos</span>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-outline transition-transform duration-300", expandedSections.attachments && "rotate-180")} />
                    </button>
                    {expandedSections.attachments && (
                       <div className="p-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        {selectedJob.attachment_url ? (
                          <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                            {selectedJob.attachment_url.startsWith('data:image') ? (
                              <div className="space-y-3">
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-black/5">
                                  <Image src={selectedJob.attachment_url} alt="Anexo" fill className="object-contain" referrerPolicy="no-referrer" />
                                </div>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedJob.attachment_url!;
                                    link.download = `anexo-vaga-${selectedJob.id}`;
                                    link.click();
                                  }}
                                  className="w-full py-2 bg-white text-primary text-[10px] font-bold uppercase tracking-wider rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Upload className="w-3 h-3 rotate-180" />
                                  Baixar Imagem
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-primary" />
                                  </div>
                                  <span className="text-xs font-bold truncate max-w-[120px]">Documento</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedJob.attachment_url!;
                                    link.download = `documento-vaga-${selectedJob.id}`;
                                    link.click();
                                  }}
                                  className="p-2 bg-primary text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                  <Upload className="w-3 h-3 rotate-180" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 p-4 border border-dashed border-outline-variant/30 rounded-2xl">
                             <p className="text-xs text-outline italic">Nenhum anexo enviado.</p>
                          </div>
                        )}
                       </div>
                    )}
                  </div>
                </div>

                <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Ações de Moderação
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-extrabold text-on-surface-variant mb-2 block ml-1">Justificativa da Recusa</label>
                      <textarea 
                        className="w-full bg-white border-outline-variant/30 rounded-2xl text-sm p-4 focus:ring-primary focus:border-primary min-h-[120px] transition-all" 
                        placeholder="Explique o motivo para que a empresa possa corrigir a vaga..."
                      />
                    </div>
                    <div className="flex items-center gap-3 px-1">
                      <input type="checkbox" id="notify" defaultChecked className="rounded text-primary focus:ring-primary w-5 h-5" />
                      <label htmlFor="notify" className="text-xs font-bold text-on-surface">Notificar por e-mail</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button 
                        onClick={() => setConfirmAction({ type: 'reject', target: 'job', id: selectedJob.id })}
                        className="py-4 px-4 bg-error text-on-error rounded-2xl font-bold text-sm hover:brightness-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-error/20"
                      >
                        <XCircle className="w-5 h-5" />
                        Recusar
                      </button>
                      <button 
                        onClick={() => setConfirmAction({ type: 'approve', target: 'job', id: selectedJob.id })}
                        className="py-4 px-4 bg-primary text-on-primary rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-v from-primary to-primary-container"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}

            {(selectedCandidate && (activeView === 'curriculos' || activeView === 'galeria')) && (
              <motion.aside 
                key={`candidate-${selectedCandidate.id}`}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed lg:relative top-0 right-0 w-full lg:w-[450px] h-full bg-white border-l border-outline-variant/10 p-6 lg:p-8 overflow-y-auto shadow-2xl z-[80] lg:z-30"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4">
                    <div className="relative w-16 lg:w-20 h-16 lg:h-20 rounded-2xl overflow-hidden shadow-xl">
                      <CandidateAvatar src={selectedCandidate.image} name={selectedCandidate.name} />
                      {selectedCandidate.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-tertiary-fixed flex items-center justify-center border-2 lg:border-4 border-white">
                          <Verified className="w-3 h-3 lg:w-4 lg:h-4 text-on-tertiary-fixed fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl lg:text-2xl font-extrabold text-on-surface leading-tight font-headline">{selectedCandidate.name}</h3>
                      <p className="text-on-surface-variant font-medium text-xs lg:text-sm">{selectedCandidate.role}</p>
                      <div className="flex gap-3 mt-3">
                        <ExternalLink className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                        <Share2 className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                        <Bookmark className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8 mb-10">
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Resumo do Perfil</h4>
                    <div dangerouslySetInnerHTML={{ __html: selectedCandidate.summary }} className="text-on-surface-variant text-sm leading-relaxed rich-text-content prose prose-sm max-w-none" />
                  </section>
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Informações de Contato</h4>
                    <div className="space-y-2">
                       {selectedCandidate.email && (
                          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                             <Mail className="w-4 h-4" />
                             {selectedCandidate.email}
                          </div>
                       )}
                       {selectedCandidate.phone && (
                          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                             <Phone className="w-4 h-4" />
                             {selectedCandidate.phone}
                          </div>
                       )}
                       {selectedCandidate.cv_url && (
                          <a 
                            href={selectedCandidate.cv_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-primary/5 text-primary text-sm font-bold rounded-xl border border-primary/10 hover:bg-primary/10 transition-colors mt-4"
                          >
                             <FileText className="w-4 h-4" />
                             Ver Currículo Anexado
                          </a>
                       )}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Competências Principais</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-outline-variant/10">{s}</span>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="bg-surface-container-low rounded-3xl p-6 space-y-6 border border-outline-variant/10">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 ml-1">Justificativa da Decisão</label>
                    <textarea 
                      className="w-full bg-white border-outline-variant/30 rounded-2xl text-sm p-4 focus:ring-primary focus:border-primary min-h-[100px] transition-all" 
                      placeholder="Insira uma observação ou motivo da recusa/aprovação..."
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 px-1">
                      <input type="checkbox" id="notify-cand" defaultChecked className="rounded text-primary focus:ring-primary w-5 h-5" />
                      <label htmlFor="notify-cand" className="text-xs font-bold text-on-surface-variant">Enviar e-mail de notificação para a candidata</label>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmAction({ type: 'reject', target: 'candidate', id: selectedCandidate.id })}
                        className="flex-1 py-4 px-4 bg-error-container text-on-error-container hover:bg-error/10 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Recusar
                      </button>
                      <button 
                        onClick={() => setConfirmAction({ type: 'approve', target: 'candidate', id: selectedCandidate.id })}
                        className="flex-1 py-4 px-4 bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/30 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-v from-primary to-primary-container"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}

            {(selectedNegocio && (activeView === 'negocios' || activeView === 'galeria_negocios')) && (
              <motion.aside 
                key={`negocio-${selectedNegocio.id}`}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed lg:relative top-0 right-0 w-full lg:w-[450px] h-full bg-white border-l border-outline-variant/10 p-6 lg:p-8 overflow-y-auto shadow-2xl z-[80] lg:z-30"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4">
                    <div className="w-16 lg:w-20 h-16 lg:h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 shadow-xl overflow-hidden relative">
                      {selectedNegocio.logo_url ? (
                        <Image src={selectedNegocio.logo_url} alt="Logo" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                      ) : (selectedNegocio.attachment_url && selectedNegocio.attachment_url.startsWith('data:image')) ? (
                        <Image src={selectedNegocio.attachment_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <TrendingUp className="w-8 h-8 lg:w-10 lg:h-10" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl lg:text-2xl font-extrabold text-on-surface leading-tight font-headline">{selectedNegocio.title}</h3>
                      <p className="text-orange-600 font-bold text-xs lg:text-sm">{selectedNegocio.owner_name}</p>
                      <div className="flex gap-3 mt-3">
                        <Share2 className="w-4 h-4 text-orange-600 cursor-pointer hover:scale-110 transition-transform" />
                        <Zap className="w-4 h-4 text-orange-600 cursor-pointer hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedNegocio(null)} className="p-2 hover:bg-orange-50 rounded-full text-on-surface-variant">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8 mb-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                      <p className="text-[10px] uppercase font-bold text-orange-600 mb-1">Localização</p>
                      <p className="text-sm font-bold">{selectedNegocio.location}</p>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                      <p className="text-[10px] uppercase font-bold text-orange-600 mb-1">Área</p>
                      <p className="text-sm font-bold">{selectedNegocio.area}</p>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 col-span-2">
                      <p className="text-[10px] uppercase font-bold text-orange-600 mb-1">Tipo de Negócio</p>
                      <p className="text-sm font-bold">{selectedNegocio.type}</p>
                    </div>
                  </div>

                  {selectedNegocio.link && (
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                      <p className="text-[10px] uppercase font-bold text-orange-600 mb-2">Link do Negócio / Site</p>
                      <a 
                        href={ensureExternalLink(selectedNegocio.link)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-2 break-all"
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <span className="truncate">{selectedNegocio.link}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Contact Info for Business */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedNegocio.contact_email && (
                      <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">E-mail de Contato</p>
                        <a href={`mailto:${selectedNegocio.contact_email}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {selectedNegocio.contact_email}
                        </a>
                      </div>
                    )}
                    {selectedNegocio.contact_phone && (
                      <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Telefone / WhatsApp</p>
                        <a href={`tel:${selectedNegocio.contact_phone}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {selectedNegocio.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="border border-outline-variant/10 rounded-3xl overflow-hidden bg-orange-50/20">
                    {/* Description Section */}
                    <button 
                      onClick={() => setExpandedSections(prev => ({...prev, description: !prev.description}))}
                      className="w-full p-5 flex items-center justify-between transition-colors hover:bg-orange-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Sobre a Oportunidade</span>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-outline transition-transform duration-300", expandedSections.description && "rotate-180")} />
                    </button>
                    {expandedSections.description && (
                      <div className="p-5 pt-0 text-sm text-on-surface-variant leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                        <div dangerouslySetInnerHTML={{ __html: selectedNegocio.description }} className="rich-text-content prose prose-sm max-w-none" />
                      </div>
                    )}

                    <div className="h-px bg-outline-variant/10 mx-5" />

                    {/* Attachments Section */}
                    <button 
                      onClick={() => setExpandedSections(prev => ({...prev, attachments: !prev.attachments}))}
                      className="w-full p-5 flex items-center justify-between transition-colors hover:bg-orange-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:scale-110 transition-transform">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Anexos</span>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-outline transition-transform duration-300", expandedSections.attachments && "rotate-180")} />
                    </button>
                    {expandedSections.attachments && (
                       <div className="p-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        {selectedNegocio.attachment_url ? (
                          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            {selectedNegocio.attachment_url.startsWith('data:image') ? (
                              <div className="space-y-3">
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-black/5">
                                  <Image src={selectedNegocio.attachment_url} alt="Anexo" fill className="object-contain" referrerPolicy="no-referrer" />
                                </div>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedNegocio.attachment_url!;
                                    link.download = `anexo-negocio-${selectedNegocio.id}`;
                                    link.click();
                                  }}
                                  className="w-full py-2 bg-white text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-orange-200 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Upload className="w-3 h-3 rotate-180" />
                                  Baixar Imagem
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-orange-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <span className="text-xs font-bold truncate max-w-[120px]">Documento</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedNegocio.attachment_url!;
                                    link.download = `documento-negocio-${selectedNegocio.id}`;
                                    link.click();
                                  }}
                                  className="p-2 bg-orange-600 text-white rounded-lg shadow-lg shadow-orange-600/20 hover:scale-105 transition-transform"
                                >
                                  <Upload className="w-3 h-3 rotate-180" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 p-4 border border-dashed border-orange-200 rounded-2xl">
                             <p className="text-xs text-orange-600 italic">Nenhum anexo enviado.</p>
                          </div>
                        )}
                       </div>
                    )}
                  </div>

                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Informações de Contato</h4>
                    <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                      <div className="flex items-center gap-3 text-sm text-on-surface font-medium">
                        <Mail className="w-4 h-4 text-orange-600" />
                        {selectedNegocio.contact_email || 'Não informado'}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-on-surface font-medium">
                        <Phone className="w-4 h-4 text-orange-600" />
                        {selectedNegocio.contact_phone || 'Não informado'}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-on-surface font-medium">
                        <Handshake className="w-4 h-4 text-orange-600" />
                        Responsável: {selectedNegocio.contact_name || 'Não informado'}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="bg-orange-50 rounded-3xl p-6 space-y-6 border border-orange-200">
                  <h4 className="text-sm font-bold text-orange-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Moderação de Negócios
                  </h4>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmAction({ type: 'reject', target: 'negocio' as any, id: selectedNegocio.id })}
                        className="flex-1 py-4 px-4 bg-white border-2 border-error text-error hover:bg-error/5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Recusar
                      </button>
                      <button 
                        onClick={() => setConfirmAction({ type: 'approve', target: 'negocio' as any, id: selectedNegocio.id })}
                        className="flex-1 py-4 px-4 bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>

      {editingJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-primary font-headline">Editar Vaga</h2>
              <button onClick={() => setEditingJob(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-on-surface-variant" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedJob = {
                ...editingJob,
                title: formData.get('title') as string,
                company: formData.get('company') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                location: formData.get('location') as string,
                type: formData.get('type') as string,
                area: formData.get('area') as string,
                salary: formData.get('salary') as string,
                site_url: formData.get('site_url') as string,
                description: richDescription,
                requirements: (formData.get('requirements') as string).split('\n').filter(r => r.trim()),
                logo_url: formData.get('logo_url') as string,
              };
              setConfirmAction({ type: 'edit', target: 'job', id: editingJob.id, payload: updatedJob });
            }} className="space-y-4">
              <input type="hidden" name="logo_url" defaultValue={editingJob.logo_url} />
              
              {editingJob.logo_url && (
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white">
                    <Image src={editingJob.logo_url} alt="Logo Atual" fill className="object-contain p-1" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Logo da Empresa</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-medium">Este é o logo atual desta vaga</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Título da Vaga</label>
                  <input name="title" defaultValue={editingJob.title} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Empresa</label>
                  <input name="company" defaultValue={editingJob.company} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">E-mail de Contato</label>
                  <input name="email" type="email" defaultValue={editingJob.email} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Telefone / WhatsApp</label>
                  <input 
                    name="phone" 
                    defaultValue={editingJob.phone} 
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none"
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.value = maskPhone(input.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Link da Vaga / Site Externo</label>
                <input name="site_url" defaultValue={editingJob.site_url} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Localização</label>
                  <input name="location" defaultValue={editingJob.location} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Área / Setor</label>
                  <select name="area" defaultValue={editingJob.area} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none">
                    <option>Tecnologia</option>
                    <option>Saúde</option>
                    <option>Finanças</option>
                    <option>Engenharia</option>
                    <option>Outros Serviços</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Tipo</label>
                  <select name="type" defaultValue={editingJob.type} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none">
                    <option>Tempo Integral</option>
                    <option>Meio Período</option>
                    <option>PJ / Freelance</option>
                    <option>Híbrido</option>
                    <option>Remoto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Salário</label>
                  <input 
                    name="salary" 
                    defaultValue={editingJob.salary} 
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none"
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.value = maskCurrency(input.value);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Descrição</label>
                <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={richDescription}
                    onChange={setRichDescription}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Descreva a vaga..."
                    className="h-48"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Requisitos (um por linha)</label>
                <textarea name="requirements" defaultValue={editingJob.requirements.join('\n')} rows={3} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none"></textarea>
              </div>

              {editingJob.attachment_url && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Anexo Atual</label>
                  <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {editingJob.attachment_url.startsWith('data:image') ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-outline-variant/20 relative">
                          <Image src={editingJob.attachment_url} alt="Minatura" fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold">Arquivo Anexado</p>
                        <p className="text-[10px] text-on-surface-variant uppercase">ID: {editingJob.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingJob(null)} className="flex-1 py-3 px-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Salvar Alterações</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-primary font-headline">Editar Talento</h2>
              <button onClick={() => setEditingCandidate(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-on-surface-variant" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedCand = {
                ...editingCandidate,
                name: formData.get('name') as string,
                location: formData.get('location') as string,
                area: formData.get('area') as string,
                role: formData.get('role') as string,
                summary: richSummary,
                skills: (formData.get('skills') as string).split(',').map(s => s.trim()).filter(s => s),
              };
              setConfirmAction({ type: 'edit', target: 'candidate', id: editingCandidate.id, payload: updatedCand });
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Nome Completo</label>
                  <input name="name" defaultValue={editingCandidate.name} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Localização</label>
                  <input name="location" defaultValue={editingCandidate.location} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Área</label>
                  <input name="area" defaultValue={editingCandidate.area} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Cargo</label>
                  <input name="role" defaultValue={editingCandidate.role} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Resumo Profissional</label>
                <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={richSummary}
                    onChange={setRichSummary}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Conte um pouco sobre suas experiências profissionais..."
                    className="h-48"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Competências (separadas por vírgula)</label>
                <textarea name="skills" defaultValue={editingCandidate.skills.join(', ')} rows={2} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingCandidate(null)} className="flex-1 py-3 px-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Salvar Alterações</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingNegocio && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-orange-600 font-headline">Editar Negócio</h2>
              <button onClick={() => setEditingNegocio(null)} className="p-2 hover:bg-orange-50 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-on-surface-variant" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedNegocio = {
                ...editingNegocio,
                title: formData.get('title') as string,
                owner_name: formData.get('owner_name') as string,
                location: formData.get('location') as string,
                type: formData.get('type') as string,
                area: formData.get('area') as string,
                link: formData.get('link') as string,
                description: richDescriptionNegocio,
                contact_email: formData.get('contact_email') as string,
                contact_phone: formData.get('contact_phone') as string,
                contact_name: formData.get('contact_name') as string,
                logo_url: formData.get('logo_url') as string,
              };
              setConfirmAction({ type: 'edit', target: 'negocio' as any, id: editingNegocio.id, payload: updatedNegocio });
            }} className="space-y-4">
              <input type="hidden" name="logo_url" defaultValue={editingNegocio.logo_url} />
              
              {editingNegocio.logo_url && (
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white">
                    <Image src={editingNegocio.logo_url} alt="Logo Atual" fill className="object-contain p-1" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Logo do Negócio</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-medium">Este é o logo atual deste negócio</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Título do Negócio</label>
                  <input name="title" defaultValue={editingNegocio.title} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-orange-600/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Empresa / Proprietário</label>
                  <input name="owner_name" defaultValue={editingNegocio.owner_name} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-orange-600/40 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Link / Site do Negócio</label>
                <input name="link" defaultValue={editingNegocio.link} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-orange-600/40 outline-none" placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Localização</label>
                  <input name="location" defaultValue={editingNegocio.location} required className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-orange-600/40 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Área</label>
                  <select name="area" defaultValue={editingNegocio.area} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-orange-600/40 outline-none">
                    <option>Serviços</option>
                    <option>Varejo</option>
                    <option>Indústria</option>
                    <option>Tecnologia</option>
                    <option>Imobiliário</option>
                    <option>Agronegócio</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Tipo de Oportunidade</label>
                <select name="type" defaultValue={editingNegocio.type} className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:ring-2 focus:ring-orange-600/40 outline-none">
                  <option>Parceria</option>
                  <option>Sociedade</option>
                  <option>Venda Total</option>
                  <option>Venda Parcial</option>
                  <option>Franquia</option>
                  <option>Investimento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Descrição</label>
                <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={richDescriptionNegocio}
                    onChange={setRichDescriptionNegocio}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Descreva sobre a oportunidade de negócio..."
                    className="h-48"
                  />
                </div>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-orange-600">Informações de Contato</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase font-mono">Email</label>
                    <input name="contact_email" defaultValue={editingNegocio.contact_email} className="w-full p-2 rounded-lg bg-white border border-orange-200 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase font-mono">Telefone</label>
                    <input name="contact_phone" defaultValue={editingNegocio.contact_phone} className="w-full p-2 rounded-lg bg-white border border-orange-200 outline-none text-sm" onInput={(e) => (e.target as HTMLInputElement).value = maskPhone((e.target as HTMLInputElement).value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase font-mono">Nome do Contato</label>
                  <input name="contact_name" defaultValue={editingNegocio.contact_name} className="w-full p-2 rounded-lg bg-white border border-orange-200 outline-none text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingNegocio(null)} className="flex-1 py-3 px-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 hover:scale-[1.02] transition-all">Salvar Alterações</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

        {isAddingNoticia && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "bg-white rounded-3xl p-6 lg:p-10 w-full shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto transition-all",
                isEditorExpanded ? "max-w-6xl" : "max-w-4xl"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black text-primary font-headline">Nova Notícia</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                    className="p-3 hover:bg-surface-container rounded-2xl transition-all text-on-surface-variant flex items-center gap-2 font-bold text-xs"
                  >
                    {isEditorExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    {isEditorExpanded ? 'Reduzir' : 'Expandir'}
                  </button>
                  <button onClick={() => {
                    setIsAddingNoticia(false);
                    setNewsContent('');
                    setNewsImageUrl('');
                    setIsEditorExpanded(false);
                  }} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <XCircle className="w-8 h-8 text-on-surface-variant" />
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addNoticia({
                  title: formData.get('title') as string,
                  content: newsContent,
                  excerpt: formData.get('excerpt') as string,
                  image_url: newsImageUrl,
                  category: formData.get('category') as string,
                  author: formData.get('author') as string,
                });
                setNewsContent('');
                setNewsImageUrl('');
                setIsEditorExpanded(false);
              }} className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Título do Artigo *</label>
                    <input name="title" required className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Ex: Impacto das histórias de vida..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Categoria</label>
                      <input name="category" className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Ex: Eventos" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Autor</label>
                      <input name="author" className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Nome do autor" />
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Imagem de Capa</label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          value={newsImageUrl}
                          onChange={(e) => setNewsImageUrl(e.target.value)}
                          className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                          placeholder="Cole o link ou use o botão ->" 
                        />
                        <input 
                          name="image_url"
                          type="hidden"
                          value={newsImageUrl}
                        />
                      </div>
                      <label className="cursor-pointer group">
                        <div className="h-full px-6 bg-surface-container-highest rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-md">
                          <Upload className="w-5 h-5" />
                          <span className="font-bold text-xs uppercase tracking-widest">Subir</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, setNewsImageUrl)}
                        />
                      </label>
                    </div>
                    {newsImageUrl && (
                      <div className="mt-3 relative aspect-video w-48 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                        <img src={newsImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setNewsImageUrl('')}
                          className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-error transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Resumo Curto (opcional)</label>
                    <textarea name="excerpt" rows={4} className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Aparecerá nos cards de notícia..."></textarea>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Conteúdo do Artigo</label>
                  <div className={cn("bg-white rounded-2xl", isEditorExpanded ? "h-[500px]" : "h-[350px]")}>
                    <ReactQuill 
                      theme="snow"
                      value={newsContent}
                      onChange={setNewsContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="h-full quill-editor"
                      placeholder="Comece a escrever sua história aqui..."
                    />
                  </div>
                </div>

                <style jsx global>{`
                  .quill-editor .ql-container {
                    border-bottom-left-radius: 1rem;
                    border-bottom-right-radius: 1rem;
                    font-size: 1rem;
                    background: #fbfbfb;
                  }
                  .quill-editor .ql-toolbar {
                    border-top-left-radius: 1rem;
                    border-top-right-radius: 1rem;
                    background: #fff;
                    border-color: #bec8d130;
                  }
                  .quill-editor .ql-container {
                    border-color: #bec8d130;
                  }
                `}</style>

                <div className="flex gap-4 pt-8">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingNoticia(false);
                      setNewsContent('');
                      setNewsImageUrl('');
                    }} 
                    className="flex-1 py-5 px-8 bg-surface-container-highest text-on-surface rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-surface-container transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-5 px-8 bg-primary text-on-primary rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Publicar Artigo Agora
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingNoticia && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "bg-white rounded-3xl p-6 lg:p-10 w-full shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto transition-all",
                isEditorExpanded ? "max-w-6xl" : "max-w-4xl"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Edit className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-primary font-headline">Editar Notícia</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                    className="p-3 hover:bg-surface-container rounded-2xl transition-all text-on-surface-variant flex items-center gap-2 font-bold text-xs"
                  >
                    {isEditorExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    {isEditorExpanded ? 'Reduzir' : 'Expandir'}
                  </button>
                  <button onClick={() => {
                    setEditingNoticia(null);
                    setNewsContent('');
                    setNewsImageUrl('');
                    setIsEditorExpanded(false);
                  }} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <XCircle className="w-8 h-8 text-on-surface-variant" />
                  </button>
                </div>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateNoticia({
                  ...editingNoticia,
                  title: formData.get('title') as string,
                  content: newsContent,
                  excerpt: formData.get('excerpt') as string,
                  image_url: newsImageUrl,
                  category: formData.get('category') as string,
                  author: formData.get('author') as string,
                });
                setNewsContent('');
                setNewsImageUrl('');
                setIsEditorExpanded(false);
              }} className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Título da Notícia</label>
                    <input name="title" defaultValue={editingNoticia.title} required className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Categoria</label>
                      <input name="category" defaultValue={editingNoticia.category} className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Autor</label>
                      <input name="author" defaultValue={editingNoticia.author} className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">URL da Imagem</label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          value={newsImageUrl}
                          onChange={(e) => setNewsImageUrl(e.target.value)}
                          className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                        />
                      </div>
                      <label className="cursor-pointer group">
                        <div className="h-full px-6 bg-surface-container-highest rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-md">
                          <Upload className="w-5 h-5" />
                          <span className="font-bold text-xs uppercase tracking-widest">Subir</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, setNewsImageUrl)}
                        />
                      </label>
                    </div>
                    {newsImageUrl && (
                      <div className="mt-3 relative aspect-video w-48 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                        <img src={newsImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setNewsImageUrl('')}
                          className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-error transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Resumo / Excerpt</label>
                    <textarea name="excerpt" defaultValue={editingNoticia.excerpt} rows={4} className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"></textarea>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Conteúdo Principal</label>
                  <div className={cn("bg-white rounded-2xl", isEditorExpanded ? "h-[500px]" : "h-[350px]")}>
                    <ReactQuill 
                      theme="snow"
                      value={newsContent}
                      onChange={setNewsContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="h-full quill-editor"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingNoticia(null);
                      setNewsContent('');
                      setNewsImageUrl('');
                    }} 
                    className="flex-1 py-5 px-8 bg-surface-container-highest text-on-surface rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-surface-container transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-5 px-8 bg-primary text-on-primary rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 max-w-md w-full shadow-2xl text-center border border-outline-variant/10"
          >
            <div className={cn(
              "w-16 lg:w-20 h-16 lg:h-20 rounded-2xl lg:rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl",
              confirmAction.type === 'approve' ? "bg-tertiary/10 text-tertiary" : 
              confirmAction.type === 'reject' ? "bg-error/10 text-error" :
              confirmAction.type === 'delete' ? "bg-error text-white" : "bg-primary/10 text-primary"
            )}>
              {confirmAction.type === 'approve' ? <CheckCircle2 className="w-10 h-10" /> : 
               confirmAction.type === 'reject' ? <XCircle className="w-10 h-10" /> :
               confirmAction.type === 'delete' ? <Trash2 className="w-10 h-10" /> : <Edit className="w-10 h-10" />}
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface mb-3 font-headline">
              {confirmAction.type === 'approve' ? 'Confirmar Aprovação?' : 
               confirmAction.type === 'reject' ? 'Confirmar Recusa?' :
               confirmAction.type === 'delete' ? 'Confirmar Exclusão?' : 'Confirmar Alteração?'}
            </h2>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
              Você tem certeza que deseja {
                confirmAction.type === 'approve' ? 'aprovar' : 
                confirmAction.type === 'reject' ? 'recusar' :
                confirmAction.type === 'delete' ? 'excluir permanentemente' : 'salvar as alterações deste'
              } {confirmAction.target === 'job' ? 'vaga' : confirmAction.target === 'candidate' ? 'candidato' : confirmAction.target === 'noticia' ? 'notícia' : 'negócio'}? 
              Esta ação será registrada no histórico do sistema.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfirmAction(null)}
                className="py-4 px-6 bg-surface-container-highest text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (confirmAction.target === 'job') {
                    if (confirmAction.type === 'approve') approveJob(confirmAction.id);
                    else if (confirmAction.type === 'reject') rejectJob(confirmAction.id);
                    else if (confirmAction.type === 'delete') deleteJob(confirmAction.id);
                    else if (confirmAction.type === 'edit') updateJob(confirmAction.payload);
                  } else if (confirmAction.target === 'candidate') {
                    if (confirmAction.type === 'approve') approveCandidate(confirmAction.id);
                    else if (confirmAction.type === 'reject') rejectCandidate(confirmAction.id);
                    else if (confirmAction.type === 'delete') deleteCandidate(confirmAction.id);
                    else if (confirmAction.type === 'edit') updateCandidate(confirmAction.payload);
                  } else if (confirmAction.target === 'negocio') {
                    if (confirmAction.type === 'approve') approveNegocio(confirmAction.id);
                    else if (confirmAction.type === 'reject') rejectNegocio(confirmAction.id);
                    else if (confirmAction.type === 'delete') deleteNegocio(confirmAction.id);
                    else if (confirmAction.type === 'edit') updateNegocio(confirmAction.payload);
                  } else if (confirmAction.target === 'noticia') {
                    if (confirmAction.type === 'delete') deleteNoticia(confirmAction.id);
                  }
                }}
                className={cn(
                  "py-4 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg",
                  confirmAction.type === 'approve' ? "bg-primary text-on-primary shadow-primary/20" : 
                  confirmAction.type === 'delete' ? "bg-error text-on-error shadow-error/20" :
                  confirmAction.type === 'reject' ? "bg-error text-on-error shadow-error/20" : "bg-primary text-on-primary shadow-primary/20"
                )}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Background Editorial Element */}
      <div className="fixed bottom-0 right-0 -z-10 opacity-5 pointer-events-none transform translate-x-1/4 translate-y-1/4 select-none">
        <span className="text-[25rem] font-black text-primary leading-none">CB</span>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 min-w-[300px]",
              showToast.type === 'success' ? "bg-primary text-on-primary" : "bg-error text-on-error"
            )}
          >
            {showToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
