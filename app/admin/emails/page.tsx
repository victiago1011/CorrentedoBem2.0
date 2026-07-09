'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
  User,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Upload,
  AlertTriangle,
  Loader2,
  Lock,
  Menu,
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import {
  fetchAllNewsletterSubscribers,
  fetchNewsletterCounts,
  isValidEmail,
  normalizeEmail,
} from '@/lib/newsletter-utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subscriber {
  id: string;
  nome: string | null;
  email: string;
  ativo: boolean;
  cliques_count: number;
  ultimo_clique: string | null;
  clicou_no_mes: boolean;
  data_cadastro: string;
}

interface SiteAnalyticsRow {
  id: string;
  visit_date: string;
  pageviews_count: number;
  unique_visitors_count?: number;
}

const CONTACTS_PER_PAGE = 25;

export default function EmailsAdminPage() {
  const router = useRouter();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaign' | 'stats'>('subscribers');

  // Site Analytics states
  const [analyticsRows, setAnalyticsRows] = useState<SiteAnalyticsRow[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Authentication states
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Subscriber states
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberCounts, setSubscriberCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDbReady, setIsDbReady] = useState(true);
  const [dbErrorMessage, setDbErrorMessage] = useState('');

  // Bulk Import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Add/Edit Subscriber modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [formError, setFormError] = useState('');

  // Campaign State
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [btnText, setBtnText] = useState('');
  const [btnLink, setBtnLink] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testEmailsManual, setTestEmailsManual] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<{
    successCount: number;
    failureCount: number;
    totalActiveSubscribers: number;
    totalValidEmails: number;
    invalidEmails: string[];
    hasFailures: boolean;
    errorDetails?: string;
  } | null>(null);

  // Loading indicator for list
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Feedback notifications
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch site visualizer analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const { data, error } = await supabase
        .from('site_analytics')
        .select('*')
        .order('visit_date', { ascending: false });

      if (!error && data) {
        setAnalyticsRows(data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Fetch Subscribers list (paginated — bypasses Supabase 1000-row default limit)
  const fetchSubscribers = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const [data, counts] = await Promise.all([
        fetchAllNewsletterSubscribers(supabase),
        fetchNewsletterCounts(supabase),
      ]);

      setIsDbReady(true);
      setSubscribers(data as Subscriber[]);
      setSubscriberCounts(counts);
    } catch (err: any) {
      setIsDbReady(false);
      setDbErrorMessage(err.message || 'Erro de conexão com o banco de dados');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Authentication logic
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        setIsAuthChecking(false);
        fetchSubscribers();
        fetchAnalytics();
      }
    };
    checkAuth();
  }, [router, fetchSubscribers, fetchAnalytics]);

  // Handle single subscriber Add or Edit
  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Insira um endereço de e-mail válido.');
      return;
    }

    try {
      const payload = {
        nome: formNome.trim() || null,
        email: formEmail.trim().toLowerCase(),
        ativo: formAtivo,
      };

      if (editingSubscriber) {
        // Edit flow
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update(payload)
          .eq('id', editingSubscriber.id);

        if (error) throw error;
        triggerToast('Contato atualizado com sucesso!');
      } else {
        // Create flow
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert([payload]);

        if (error) {
          if (error.code === '23505') {
            setFormError('Este e-mail já está cadastrado em nossa lista.');
            return;
          }
          throw error;
        }
        triggerToast('Contato cadastrado com sucesso!');
      }

      setShowFormModal(false);
      setEditingSubscriber(null);
      setFormNome('');
      setFormEmail('');
      setFormAtivo(true);
      fetchSubscribers();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao salvar o contato.');
    }
  };

  // Open Edit Subscriber
  const openEditModal = (sub: Subscriber) => {
    setEditingSubscriber(sub);
    setFormNome(sub.nome || '');
    setFormEmail(sub.email);
    setFormAtivo(sub.ativo);
    setFormError('');
    setShowFormModal(true);
  };

  // Delete Subscriber
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Tem certeza que deseja remover permanentemente o e-mail: ${email}?`)) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      triggerToast('Contato excluído permanentemente!');
      fetchSubscribers();
    } catch (err: any) {
      triggerToast(`Erro ao excluir: ${err.message}`, 'error');
    }
  };

  // Toggle active/inactive status quickly
  const toggleSubscriberStatus = async (sub: Subscriber) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ ativo: !sub.ativo })
        .eq('id', sub.id);

      if (error) throw error;
      triggerToast(sub.ativo ? 'Inscrição inativada!' : 'Inscrição reativada!');
      fetchSubscribers();
    } catch (err: any) {
      triggerToast(`Erro ao alterar status: ${err.message}`, 'error');
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      triggerToast('Insira pelo menos um e-mail para continuar.', 'error');
      return;
    }

    setIsImporting(true);
    const lines = bulkText.split('\n');
    let importedCount = 0;
    let duplicateOrErrorCount = 0;

    const parsedContacts: { nome: string | null; email: string; ativo: boolean }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Formats supported:
      // email@example.com
      // email@example.com, Nome Completo
      // Nome Completo, email@example.com
      let email = '';
      let nome: string | null = null;

      if (trimmed.includes(',')) {
        const parts = trimmed.split(',');
        const first = parts[0].trim();
        const second = parts[1].trim();

        if (first.includes('@')) {
          email = first.toLowerCase();
          nome = second;
        } else if (second.includes('@')) {
          email = second.toLowerCase();
          nome = first;
        }
      } else {
        if (trimmed.includes('@')) {
          email = trimmed.toLowerCase();
        }
      }

      if (email && email.includes('@')) {
        parsedContacts.push({
          nome: nome || null,
          email: email,
          ativo: true
        });
      }
    }

    if (parsedContacts.length === 0) {
      triggerToast('Nenhum formato de e-mail válido pôde ser extraído.', 'error');
      setIsImporting(false);
      return;
    }

    try {
      // Chunk insertions to prevent Supabase query size limits or network blocks
      const chunkSize = 200;
      for (let i = 0; i < parsedContacts.length; i += chunkSize) {
        const chunk = parsedContacts.slice(i, i + chunkSize);
        
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert(chunk);

        if (error) {
          // If insert fails (possibly due to duplicates), attempt a fallback unique approach
          // In actual Supabase, if some fail due to conflict we can single-insert or allow Upsert
          const { error: upsertErr } = await supabase
            .from('newsletter_subscribers')
            .upsert(chunk, { onConflict: 'email' });
            
          if (upsertErr) {
            duplicateOrErrorCount += chunk.length;
          } else {
            importedCount += chunk.length;
          }
        } else {
          importedCount += chunk.length;
        }
      }

      triggerToast(`Importação concluída: ${importedCount} adicionados, ${duplicateOrErrorCount} ignorados.`);
      setBulkText('');
      setShowBulkImport(false);
      fetchSubscribers();
    } catch (err: any) {
      triggerToast(`Houve uma falha na importação: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const parseManualTestEmails = (raw: string): { valid: string[]; invalid: string[] } => {
    const parts = raw
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);

    const valid: string[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    for (const part of parts) {
      const normalized = normalizeEmail(part);
      if (!isValidEmail(normalized)) {
        invalid.push(part);
        continue;
      }
      if (!seen.has(normalized)) {
        seen.add(normalized);
        valid.push(normalized);
      }
    }

    return { valid, invalid };
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!campaignSubject.trim() || !campaignContent.trim()) {
      triggerToast('Escreva o assunto e conteúdo antes de testar.', 'error');
      return;
    }

    const manualRaw = testEmailsManual.trim();
    let requestBody: Record<string, unknown>;

    if (manualRaw) {
      const { valid, invalid } = parseManualTestEmails(manualRaw);

      if (invalid.length > 0) {
        triggerToast(`E-mails inválidos: ${invalid.join(', ')}`, 'error');
        return;
      }

      if (valid.length === 0) {
        triggerToast('Informe ao menos um e-mail válido no campo de destinatários manuais.', 'error');
        return;
      }

      if (valid.length > 10) {
        triggerToast('O teste manual aceita no máximo 10 destinatários.', 'error');
        return;
      }

      requestBody = {
        subject: campaignSubject,
        content: campaignContent,
        primaryButtonText: btnText || null,
        primaryButtonLink: btnLink || null,
        testEmails: valid,
      };
    } else {
      if (!testEmail.trim() || !isValidEmail(normalizeEmail(testEmail))) {
        triggerToast('Insira seu e-mail do Zoho/pessoal de teste.', 'error');
        return;
      }

      requestBody = {
        subject: campaignSubject,
        content: campaignContent,
        primaryButtonText: btnText || null,
        primaryButtonLink: btnLink || null,
        testEmail: normalizeEmail(testEmail),
      };
    }

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const resData = await response.json();

      if (!response.ok) {
        const detail = resData.errorDetails || resData.resendMessage;
        throw new Error(
          detail ? `${resData.error || 'Erro ao enviar teste'}: ${detail}` : (resData.error || 'Erro ao enviar teste')
        );
      }

      const sentCount = resData.sentCount ?? 1;
      triggerToast(
        sentCount > 1
          ? `E-mail de teste enviado para ${sentCount} destinatários!`
          : 'E-mail de teste disparado! Verifique sua caixa de entrada.'
      );
    } catch (err: any) {
      triggerToast(`Erro no teste: ${err.message}`, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const openBulkSendConfirm = () => {
    if (isSendingCampaign) return;

    const activeCount = subscriberCounts.active;
    if (activeCount === 0) {
      triggerToast('Não existem contatos ativos em sua lista para enviar.', 'error');
      return;
    }

    if (!campaignSubject.trim() || !campaignContent.trim()) {
      triggerToast('Preencha o assunto e o conteúdo antes de enviar.', 'error');
      return;
    }

    setShowBulkConfirmModal(true);
  };

  // Send Core Campaign to Active Users (only after modal confirmation)
  const handleSendCampaign = async () => {
    if (isSendingCampaign) return;

    setShowBulkConfirmModal(false);
    setIsSendingCampaign(true);
    setCampaignProgress(null);

    try {
      const response = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: campaignSubject,
          content: campaignContent,
          primaryButtonText: btnText || null,
          primaryButtonLink: btnLink || null,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        const detail = resData.errorDetails || resData.resendMessage;
        throw new Error(
          detail ? `${resData.error || 'Falha ao enviar o e-mail'}: ${detail}` : (resData.error || 'Falha ao enviar o e-mail')
        );
      }

      const failureCount = resData.failureCount ?? 0;
      const invalidCount = resData.invalidEmails?.length ?? 0;
      const hasFailures = failureCount > 0 || invalidCount > 0 || !resData.success;

      setCampaignProgress({
        successCount: resData.successCount ?? 0,
        failureCount,
        totalActiveSubscribers: resData.totalActiveSubscribers ?? subscriberCounts.active,
        totalValidEmails: resData.totalValidEmails ?? 0,
        invalidEmails: resData.invalidEmails || [],
        hasFailures,
        errorDetails: resData.errorDetails || resData.message,
      });

      if (resData.success && !hasFailures) {
        triggerToast('E-mail enviado com sucesso!');
        setCampaignSubject('');
        setCampaignContent('');
        setBtnText('');
        setBtnLink('');
      } else if (hasFailures) {
        triggerToast(
          `Envio com falhas: ${resData.successCount ?? 0} enviados, ${failureCount} com falha.`,
          'error'
        );
      }

      fetchSubscribers();
    } catch (err: any) {
      setCampaignProgress({
        successCount: 0,
        failureCount: subscriberCounts.active,
        totalActiveSubscribers: subscriberCounts.active,
        totalValidEmails: 0,
        invalidEmails: [],
        hasFailures: true,
        errorDetails: err.message,
      });
      triggerToast(`Erro ao enviar: ${err.message}`, 'error');
    } finally {
      setIsSendingCampaign(false);
    }
  };

  // Filter, sort and paginate subscribers (client-side)
  const sortedFilteredSubscribers = useMemo(() => {
    const filtered = subscribers.filter((sub) => {
      const matchesSearch =
        sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.nome && sub.nome.toLowerCase().includes(searchQuery.toLowerCase()));

      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'active') return matchesSearch && sub.ativo;
      if (filterStatus === 'inactive') return matchesSearch && !sub.ativo;
      return matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const sortKeyA = (a.nome?.trim() || a.email).toLowerCase();
      const sortKeyB = (b.nome?.trim() || b.email).toLowerCase();
      return sortKeyA.localeCompare(sortKeyB, 'pt-BR');
    });
  }, [subscribers, searchQuery, filterStatus]);

  const totalFilteredCount = sortedFilteredSubscribers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / CONTACTS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedSubscribers = sortedFilteredSubscribers.slice(
    (effectivePage - 1) * CONTACTS_PER_PAGE,
    effectivePage * CONTACTS_PER_PAGE
  );
  const rangeStart = totalFilteredCount === 0 ? 0 : (effectivePage - 1) * CONTACTS_PER_PAGE + 1;
  const rangeEnd = Math.min(effectivePage * CONTACTS_PER_PAGE, totalFilteredCount);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Stats Counters (totals from exact count; engagement from loaded data)
  const totalSubscribersCount = subscriberCounts.total;
  const activeSubscribersCount = subscriberCounts.active;
  const inactiveSubscribersCount = subscriberCounts.inactive;
  const clickedSubscribersCount = subscribers.filter(s => s.clicou_no_mes).length;
  const totalClicksCount = subscribers.reduce((acc, curr) => acc + (curr.cliques_count || 0), 0);

  if (isAuthChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <Loader2 className="w-10 h-10 text-[#00628c] animate-spin mb-3" />
        <p className="text-gray-600 font-medium">Verificando credenciais administrativas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-800 font-sans">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl border-2 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20' 
                : 'bg-red-50 text-red-800 border-red-500/20'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${toast.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className="font-semibold text-sm">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Header */}
      <header className="border-b border-slate-200/60 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition"
              title="Voltar ao Painel Admin Principal"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-[#00628c]/10 p-2.5 rounded-xl text-[#00628c]">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Campanhas & Contatos</h1>
              <p className="text-xs text-slate-500 font-medium">Controle de e-mails, newsletters e notificações em massa</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'subscribers'
                  ? 'bg-white text-[#00628c] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Inscritos ({totalSubscribersCount})
            </button>
            <button
              onClick={() => setActiveTab('campaign')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'campaign'
                  ? 'bg-white text-[#00628c] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              Novo E-mail
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'stats'
                  ? 'bg-white text-[#00628c] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Estáticas & Cliques
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* DB Error State (Missing table warning instructions) */}
        {!isDbReady && (
          <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-500/20 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-800 mb-1">Configuração do Supabase pendente</h3>
              <p className="text-sm text-amber-700 leading-relaxed mb-4">
                A tabela de contatos necessários para a newsletter não existe ou o RLS está impedindo a comunicação.
                Para fazer funcionar perfeitamente, copie e execute as instruções SQL abaixo no seu painel do Supabase.
              </p>
              
              <div className="bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-xl mb-4 overflow-x-auto max-h-48 shadow-inner">
                {`CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  nome text,
  email text unique not null,
  ativo boolean default true,
  cliques_count int default 0,
  ultimo_clique timestamp with time zone,
  clicou_no_mes boolean default false,
  data_cadastro timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;`}
              </div>
              <button 
                onClick={fetchSubscribers} 
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition"
              >
                Testar Conexão Novamente
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: Subscribers List Management */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Contatos</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{totalSubscribersCount}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-slate-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assinantes Ativos</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{activeSubscribersCount}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <Check className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descadastrados</p>
                  <p className="text-2xl font-black text-slate-400 mt-1">{inactiveSubscribersCount}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl text-slate-400">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interações do Mês</p>
                  <p className="text-2xl font-black text-[#00628c] mt-1">{clickedSubscribersCount}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl text-[#00628c]">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Actions & Filters Header */}
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#00628c]/20 focus:border-[#00628c] transition"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full md:w-auto bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white transition"
                >
                  <option value="all">Filtro: Todos</option>
                  <option value="active">Sub: Ativos ({activeSubscribersCount})</option>
                  <option value="inactive">Sub: Inativos ({inactiveSubscribersCount})</option>
                </select>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition w-full md:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  Importar Lista
                </button>
                <button
                  onClick={() => {
                    setEditingSubscriber(null);
                    setFormNome('');
                    setFormEmail('');
                    setFormAtivo(true);
                    setFormError('');
                    setShowFormModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#00628c] hover:bg-[#004e70] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#00628c]/15 transition w-full md:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Novo Contato
                </button>
              </div>
            </div>

            {/* Subscribers Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Nome completo</th>
                      <th className="px-6 py-4">Endereço de E-mail</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Cliques Totais</th>
                      <th className="px-6 py-4 text-center">Interação no Mês</th>
                      <th className="px-6 py-4">Cadastro</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingList ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00628c]" />
                          Carregando lista de contatos...
                        </td>
                      </tr>
                    ) : sortedFilteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          Nenhum contato encontrado com os critérios de busca atuais.
                        </td>
                      </tr>
                    ) : (
                      paginatedSubscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-sm">
                              {sub.nome || <span className="text-slate-400 font-normal italic">Não informado</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                            {sub.email}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleSubscriberStatus(sub)}
                              title="Clique para alterar o status"
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                sub.ativo
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/10'
                                  : 'bg-slate-100 text-slate-500 border border-slate-300/10'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sub.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {sub.ativo ? 'Ativo' : 'Descadastrado'}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-black text-slate-600">
                            {sub.cliques_count || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {sub.clicou_no_mes ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-500/10">
                                Clicou este mês
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Sem interação</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-semibold">
                            {new Date(sub.data_cadastro).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(sub)}
                                className="p-1.5 text-slate-500 hover:text-[#00628c] hover:bg-slate-100 rounded-lg transition"
                                title="Editar dados"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                                title="Excluir contato permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoadingList && totalFilteredCount > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Mostrando <span className="font-bold text-slate-700">{rangeStart}–{rangeEnd}</span> de{' '}
                    <span className="font-bold text-slate-700">{totalFilteredCount}</span> contatos
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={effectivePage === 1}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#00628c] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-xs text-slate-400 font-medium px-2">
                      Página {effectivePage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={effectivePage === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#00628c] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Novo E-mail — composição estilo cliente de e-mail */}
        {activeTab === 'campaign' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">

              {/* Cabeçalho */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                <h2 className="text-base font-extrabold text-slate-800">Escrever novo e-mail</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escreva o assunto e a mensagem que será enviada aos contatos ativos.
                </p>
              </div>

              {/* Assunto — linha única estilo Gmail */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-4">
                  <label htmlFor="campaign-subject" className="text-sm font-bold text-slate-800 shrink-0 w-16">
                    Assunto
                  </label>
                  <input
                    id="campaign-subject"
                    type="text"
                    placeholder="Ex: Novidades do mês da Corrente do Bem"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00628c]/25 focus:border-[#00628c] shadow-sm transition"
                  />
                </div>
              </div>

              {/* Corpo do e-mail */}
              <div className="border-b border-slate-100">
                <div className="[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-100 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-sm">
                  <ReactQuill
                    theme="snow"
                    value={campaignContent}
                    onChange={setCampaignContent}
                    placeholder="Escreva sua mensagem aqui... Dica: use {{nome}} para personalizar com o nome de cada contato."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'clean'],
                      ],
                    }}
                    className="bg-white"
                  />
                </div>
                <p className="px-6 py-2 text-[10px] text-slate-400 border-t border-slate-50">
                  Use <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{'{{nome}}'}</code> para inserir o nome de cada contato automaticamente.
                </p>
              </div>

              {/* Botão opcional */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <p className="text-xs font-semibold text-slate-600 mb-3">Botão no e-mail (opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Texto do botão</label>
                    <input
                      type="text"
                      placeholder="Ex: Acessar portal de vagas"
                      value={btnText}
                      onChange={(e) => setBtnText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00628c]/20 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Link de destino</label>
                    <input
                      type="text"
                      placeholder="Ex: https://correntedobembr.com.br/vagas"
                      value={btnLink}
                      onChange={(e) => setBtnLink(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00628c]/20 outline-none transition"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Os cliques neste botão são rastreados automaticamente.</p>
              </div>

              {/* Painel de teste */}
              <div className="px-6 py-5 bg-amber-50 border-b border-amber-200/70">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-amber-100 p-1.5 rounded-lg">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-amber-900">Enviar e-mail de teste</h3>
                </div>
                <p className="text-xs text-amber-800/80 mb-4 ml-8">
                  Envie uma cópia para seu e-mail antes de enviar para todos.
                </p>
                <div className="space-y-4 ml-0 sm:ml-8">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      disabled={!!testEmailsManual.trim()}
                      className="flex-1 bg-white border border-amber-200/80 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 transition disabled:bg-amber-100/50 disabled:text-slate-500"
                    />
                    <button
                      onClick={handleSendTest}
                      disabled={isSendingTest}
                      className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-white font-bold text-sm rounded-lg shadow-sm transition"
                    >
                      {isSendingTest ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar teste
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label htmlFor="test-emails-manual" className="block text-xs font-bold text-amber-900 mb-1.5">
                      Teste para destinatários manuais (opcional)
                    </label>
                    <input
                      id="test-emails-manual"
                      type="text"
                      placeholder="email1@gmail.com; email2@gmail.com; email3@gmail.com"
                      value={testEmailsManual}
                      onChange={(e) => setTestEmailsManual(e.target.value)}
                      className="w-full bg-white border border-amber-200/80 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 transition"
                    />
                    <p className="text-[11px] text-amber-800/70 mt-1.5">
                      Separe até 10 e-mails com ponto e vírgula. Se preenchido, o teste será enviado para estes destinatários em vez do campo acima.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de envio em massa — separada e destacada como ação de produção */}
            <div className="bg-white rounded-2xl border-2 border-red-300/80 shadow-sm overflow-hidden">
              <div className="px-6 py-5 bg-red-50 border-b border-red-200/70">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-red-100 p-1.5 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="text-sm font-bold text-red-900">Envio em massa — produção</h3>
                </div>
                <p className="text-xs text-red-800/90 ml-8">
                  Esta ação envia o e-mail para <strong>todos os contatos ativos</strong>. Não pode ser desfeita.
                </p>
              </div>
              <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-red-600" />
                    {activeSubscribersCount} contatos ativos receberão este e-mail
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    O e-mail inclui rodapé padrão e link de descadastro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openBulkSendConfirm}
                  disabled={isSendingCampaign || activeSubscribersCount === 0}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-red-600/20 w-full md:w-auto min-w-[240px]"
                >
                  {isSendingCampaign ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar para todos os contatos
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resultado do envio em massa */}
            {campaignProgress && (
              <div className={`rounded-2xl border-2 shadow-sm overflow-hidden ${
                campaignProgress.hasFailures
                  ? 'bg-red-50/80 border-red-300'
                  : 'bg-emerald-50/50 border-emerald-200'
              }`}>
                <div className="px-6 py-5">
                  <div className="flex items-start gap-3 mb-3">
                    {campaignProgress.hasFailures ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`text-sm font-extrabold mb-1 ${
                        campaignProgress.hasFailures ? 'text-red-800' : 'text-emerald-800'
                      }`}>
                        {campaignProgress.hasFailures
                          ? 'Envio concluído com falhas'
                          : 'E-mail enviado com sucesso!'}
                      </h4>
                      <p className={`text-xs ${campaignProgress.hasFailures ? 'text-red-700' : 'text-slate-500'}`}>
                        Resultado do envio em massa:
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center max-w-md">
                    <div className={`p-3 rounded-xl border ${
                      campaignProgress.hasFailures
                        ? 'bg-white border-red-100'
                        : 'bg-emerald-50 border-emerald-100'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase ${
                        campaignProgress.hasFailures ? 'text-slate-500' : 'text-emerald-600'
                      }`}>Enviados</span>
                      <div className={`text-lg font-black ${
                        campaignProgress.hasFailures ? 'text-slate-800' : 'text-emerald-700'
                      }`}>{campaignProgress.successCount}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                      <span className="text-[10px] text-red-600 uppercase font-bold">Com falha</span>
                      <div className="text-lg font-black text-red-700">{campaignProgress.failureCount}</div>
                    </div>
                  </div>
                  {campaignProgress.hasFailures && (
                    <div className="mt-4 p-3 bg-red-100/70 border border-red-200 rounded-xl">
                      <p className="text-xs font-bold text-red-800 mb-1">
                        Verifique os logs do servidor e o painel do Resend para identificar a causa das falhas.
                      </p>
                      {campaignProgress.errorDetails && (
                        <p className="text-[11px] text-red-700 font-medium">
                          Detalhe: {campaignProgress.errorDetails}
                        </p>
                      )}
                    </div>
                  )}
                  {campaignProgress.invalidEmails.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-100/60 border border-amber-200 rounded-xl">
                      <p className="text-xs font-bold text-amber-800 mb-1">
                        {campaignProgress.invalidEmails.length} e-mail(s) inválido(s) ignorado(s) no envio:
                      </p>
                      <p className="text-[10px] font-mono text-amber-700 break-all">
                        {campaignProgress.invalidEmails.slice(0, 10).join(', ')}
                        {campaignProgress.invalidEmails.length > 10 &&
                          ` … e mais ${campaignProgress.invalidEmails.length - 10}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Boas práticas — compacto abaixo */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
              <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                Boas práticas de envio
              </h3>
              <ul className="text-[11px] text-slate-300 space-y-2.5 font-medium leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-extrabold shrink-0">✓</span>
                  <span><strong className="text-white">Cliques rastreados:</strong> use o botão opcional para acompanhar quem clicou.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-extrabold shrink-0">✓</span>
                  <span><strong className="text-white">Descadastro automático:</strong> todo e-mail inclui link para cancelar a inscrição.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sky-400 font-extrabold shrink-0">i</span>
                  <span>
                    <strong className="text-white">Remetente verificado:</strong>{' '}
                    <code className="bg-slate-800 text-sky-300 px-1 py-0.5 rounded text-[10px]">contato@send.correntedobembr.com.br</code>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: Campaigns Stats */}
        {activeTab === 'stats' && (() => {
          // Analytics computations
          const totalSitePageviews = analyticsRows.reduce((sum, r) => sum + (r.pageviews_count || 0), 0);
          
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const sevenDaysPageviews = analyticsRows
            .filter(r => new Date(r.visit_date + 'T00:00:00') >= sevenDaysAgo)
            .reduce((sum, r) => sum + (r.pageviews_count || 0), 0);

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysPageviews = analyticsRows
            .filter(r => new Date(r.visit_date + 'T00:00:00') >= thirtyDaysAgo)
            .reduce((sum, r) => sum + (r.pageviews_count || 0), 0);

          const maxDailyHits = analyticsRows.length > 0 
            ? Math.max(...analyticsRows.map(r => r.pageviews_count || 0)) 
            : 1;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* LEFT COLUMN: Email Campaign Stats */}
              <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#00628c]" />
                    Estatísticas de Campanhas e Cliques
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Análise de interações nos e-mails enviados pelos disparos em massa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Cliques Totais</span>
                    <div className="text-2xl font-black text-[#00628c] mt-1">{totalClicksCount}</div>
                    <p className="text-[10px] text-slate-450 mt-1 leading-tight">Cliques acumulados nos links.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Engajados (Mês)</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">{clickedSubscribersCount}</div>
                    <p className="text-[10px] text-slate-450 mt-1 leading-tight">Quem interagiu recentemente.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Taxa de Cliques</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                      {activeSubscribersCount > 0 
                        ? `${((clickedSubscribersCount / activeSubscribersCount) * 100).toFixed(1)}%` 
                        : '0%'}
                    </div>
                    <p className="text-[10px] text-slate-450 mt-1 leading-tight">Média do CTR atual.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00628c]" />
                    Contatos mais engajados (Mais Cliques)
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 font-medium">
                    <div className="space-y-3">
                      {subscribers.filter(s => s.cliques_count > 0).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Nenhum evento de clique foi registrado até agora.</p>
                      ) : (
                        subscribers
                          .filter(s => s.cliques_count > 0)
                          .sort((a, b) => b.cliques_count - a.cliques_count)
                          .slice(0, 6)
                          .map((s, index) => (
                            <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{index + 1}</span>
                                <div>
                                  <span className="font-extrabold text-slate-800">{s.nome || 'Sem Nome'}</span>
                                  <span className="text-slate-400 block font-mono text-[10px]">{s.email}</span>
                                </div>
                              </div>
                              <div className="font-extrabold text-[#00628c] bg-[#00628c]/5 px-2.5 py-1 rounded-lg">
                                {s.cliques_count} {s.cliques_count === 1 ? 'clique' : 'cliques'}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Site Access Visitor Analytics */}
              <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Acessos e Visitas ao Portal
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Estatísticas de visualizações e tráfego orgânico geral do site.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Total Geral</span>
                    <div className="text-2xl font-black text-indigo-600 mt-1">{totalSitePageviews}</div>
                    <p className="text-[10px] text-slate-450 mt-1 leading-tight">Acessos totais logados.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Últimos 30 dias</span>
                    <div className="text-2xl font-black text-violet-600 mt-1">{thirtyDaysPageviews}</div>
                    <p className="text-[10px] text-slate-450 mt-1 leading-tight">Visualizações do mês.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Últimos 7 dias</span>
                    <div className="text-2xl font-black text-purple-600 mt-1">{sevenDaysPageviews}</div>
                    <p className="text-[10px] text-slate-450 mt-1 leading-tight">Tráfego da última semana.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-650" />
                    Visualizações por Data Recente
                  </h3>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 overflow-hidden select-none">
                    {isLoadingAnalytics ? (
                      <div className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p className="text-xs text-slate-400">Carregando dados de tráfego...</p>
                      </div>
                    ) : analyticsRows.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10">Ainda não existem dados de visitas registadas. O contador começará assim que as páginas receberem os primeiros cliques!</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[295px] overflow-y-auto pr-1">
                        {analyticsRows.slice(0, 15).map((row) => {
                          const percentage = Math.max(8, ((row.pageviews_count || 0) / maxDailyHits) * 100);
                          const dateObj = new Date(row.visit_date + 'T12:00:00');
                          const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          });

                          return (
                            <div key={row.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-700">{formattedDate}</span>
                                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm font-mono text-[11px]">
                                  {row.pageviews_count} {row.pageviews_count === 1 ? 'visita' : 'visitas'}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-lg h-2.5 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-lg transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

      </main>

      {/* FORM MODAL: Add / Edit Subscriber */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingSubscriber ? 'Editar Informações do Assinante' : 'Cadastrar Novo Assinante'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscriber} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nome do contato (Ex: João Silva)"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#00628c]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Endereço de E-mail *</label>
                <input
                  type="email"
                  placeholder="Ex: jao@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  disabled={!!editingSubscriber}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#00628c]/20 disabled:opacity-60 transition"
                />
                {editingSubscriber && (
                  <p className="text-[10px] text-slate-400 mt-1 italic font-medium">Por razões de segurança estrutural, o e-mail não pode ser editado. Se necessário, remova o contato e adicione novamente.</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="form_ativo"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="w-4 h-4 text-[#00628c] border-slate-300 rounded focus:ring-[#00628c]/20"
                />
                <label htmlFor="form_ativo" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Inscrição Ativa (Pode receber e-mails em massa)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#00628c] hover:bg-[#004e70] text-white font-bold rounded-xl transition"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* BULK SEND CONFIRMATION MODAL */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border-2 border-red-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2.5 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                Confirmar envio em massa
              </h3>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              Você tem certeza que deseja enviar este e-mail para{' '}
              <strong className="text-red-700">{activeSubscribersCount} contatos ativos</strong>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                disabled={isSendingCampaign}
                className="px-5 py-2.5 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={isSendingCampaign}
                className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center gap-2"
              >
                {isSendingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Confirmar envio'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#00628c]" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Importar Assinantes em Lote
                </h3>
              </div>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Insira ou cole sua lista de contatos no campo de texto abaixo. Insira no máximo 2000 contatos por vez para processar de forma segura.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-medium">
                <p className="font-bold text-slate-800">Formatos aceitos (1 contato por linha):</p>
                <p>1. Apenas o e-mail: <code className="font-mono bg-white px-1 border rounded">joao@empresa.com</code></p>
                <p>2. E-mail com vírgula e nome: <code className="font-mono bg-white px-1 border rounded">joao@empresa.com, Joao Silva</code></p>
                <p>3. Nome com vírgula e e-mail: <code className="font-mono bg-white px-1 border rounded">Joao Silva, joao@empresa.com</code></p>
              </div>

              <div>
                <textarea
                  rows={8}
                  placeholder={`maria@gmail.com&#10;jose@hotmail.com, José Pedro&#10;Victor Santiago, victor.h.r.santiago@gmail.com`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  disabled={isImporting}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono outline-none focus:bg-white focus:ring-2 focus:ring-[#00628c]/20 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  disabled={isImporting}
                  className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={isImporting}
                  className="px-6 py-2 text-xs bg-[#00628c] hover:bg-[#004e70] text-white font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    'Processar e Importar'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
