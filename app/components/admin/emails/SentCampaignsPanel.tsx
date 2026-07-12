'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Inbox,
  Loader2,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SentCampaignDetails from '@/app/components/admin/emails/SentCampaignDetails';

export interface EmailCampaignRow {
  id: string;
  subject: string;
  category: string;
  html_content: string;
  primary_button_text: string | null;
  primary_button_link: string | null;
  from_email: string;
  status: string;
  recipients_count: number;
  success_count: number;
  failure_count: number;
  invalid_count: number;
  sent_at: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  curriculos: 'Currículos',
  vagas: 'Vagas',
  noticias: 'Notícias',
  eventos: 'Eventos',
  institucional: 'Institucional',
  outros: 'Outros',
};

const STATUS_LABELS: Record<string, string> = {
  processing: 'Processando',
  sent: 'Enviado',
  partial: 'Parcial',
  failed: 'Falhou',
};

const STATUS_STYLES: Record<string, string> = {
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

type StatusFilter = 'all' | 'processing' | 'sent' | 'partial' | 'failed';

function campaignSortKey(c: EmailCampaignRow): number {
  const iso = c.sent_at || c.created_at;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function formatListDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SentCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<EmailCampaignRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(
          'id, subject, category, html_content, primary_button_text, primary_button_link, from_email, status, recipients_count, success_count, failure_count, invalid_count, sent_at, created_at'
        )
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMessage(
          error.message ||
            'Não foi possível carregar as campanhas enviadas. Verifique se a tabela email_campaigns existe e se você está autenticado.'
        );
        setCampaigns([]);
        return;
      }

      const rows = (data ?? []) as EmailCampaignRow[];
      rows.sort((a, b) => campaignSortKey(b) - campaignSortKey(a));
      setCampaigns(rows);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro inesperado ao carregar campanhas.';
      setErrorMessage(message);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (q && !(c.subject || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [campaigns, searchQuery, statusFilter]);

  useEffect(() => {
    if (filteredCampaigns.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredCampaigns.some((c) => c.id === selectedId)) {
      setSelectedId(filteredCampaigns[0].id);
    }
  }, [filteredCampaigns, selectedId]);

  const selectedCampaign =
    filteredCampaigns.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileShowDetails(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#00628c]" />
            Enviados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Campanhas registradas em email_campaigns, da mais recente para a mais antiga.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Buscar por assunto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00628c]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00628c]/20"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            <option value="sent">Enviado</option>
            <option value="partial">Parcial</option>
            <option value="failed">Falhou</option>
            <option value="processing">Processando</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00628c] animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Carregando campanhas...</p>
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-start">
          <div className="bg-amber-100 p-2.5 rounded-full text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 mb-1">
              Não foi possível carregar os enviados
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchCampaigns}
              className="mt-3 text-xs font-bold text-[#00628c] hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && campaigns.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-16 px-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#00628c]/10 text-[#00628c] flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 mb-1">
            Nenhuma campanha enviada ainda
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Quando você enviar um e-mail pela aba Novo E-mail, a campanha aparecerá aqui com
            status, contagens e pré-visualização.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[560px] lg:h-[640px] flex flex-col lg:flex-row">
          {/* Lista */}
          <div
            className={`w-full lg:w-[380px] lg:border-r border-slate-100 flex flex-col min-h-0 ${
              mobileShowDetails && selectedCampaign ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {filteredCampaigns.length}{' '}
                {filteredCampaigns.length === 1 ? 'campanha' : 'campanhas'}
              </p>
            </div>

            {filteredCampaigns.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-sm text-slate-500">
                  Nenhuma campanha corresponde à busca ou ao filtro.
                </p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredCampaigns.map((c) => {
                  const isSelected = c.id === selectedId;
                  const categoryLabel = CATEGORY_LABELS[c.category] ?? c.category;
                  const statusLabel = STATUS_LABELS[c.status] ?? c.status;
                  const statusStyle =
                    STATUS_STYLES[c.status] ?? 'bg-slate-50 text-slate-600 border-slate-200';
                  const listDate = c.sent_at || c.created_at;

                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(c.id)}
                        className={`w-full text-left px-4 py-3.5 transition ${
                          isSelected
                            ? 'bg-[#00628c]/8 border-l-4 border-l-[#00628c]'
                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span
                            className={`text-sm font-extrabold leading-snug line-clamp-2 ${
                              isSelected ? 'text-[#00628c]' : 'text-slate-800'
                            }`}
                          >
                            {c.subject || 'Sem assunto'}
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusStyle}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mb-1.5">
                          {categoryLabel} · {formatListDate(listDate)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {c.recipients_count} dest. · {c.success_count} ok · {c.failure_count}{' '}
                          falhas
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Detalhes */}
          <div
            className={`flex-1 min-w-0 min-h-0 ${
              mobileShowDetails && selectedCampaign ? 'flex' : 'hidden lg:flex'
            } flex-col`}
          >
            {selectedCampaign ? (
              <SentCampaignDetails
                campaign={selectedCampaign}
                showBack
                onBack={() => setMobileShowDetails(false)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-slate-400">
                  Selecione uma campanha na lista para ver os detalhes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
