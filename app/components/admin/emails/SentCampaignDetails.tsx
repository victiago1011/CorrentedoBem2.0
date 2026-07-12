'use client';

import React from 'react';
import { ChevronLeft, Mail } from 'lucide-react';
import EmailPreview from '@/app/components/admin/emails/EmailPreview';
import type { EmailCampaignRow } from '@/app/components/admin/emails/SentCampaignsPanel';

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
  processing: 'bg-amber-50 text-amber-800 border-amber-200',
  sent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partial: 'bg-orange-50 text-orange-800 border-orange-200',
  failed: 'bg-red-50 text-red-800 border-red-200',
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Não disponível';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Não disponível';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayText(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return 'Não disponível';
  return String(value);
}

interface SentCampaignDetailsProps {
  campaign: EmailCampaignRow;
  onBack?: () => void;
  showBack?: boolean;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:w-36 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-slate-800 font-medium break-words min-w-0">{value}</dd>
    </div>
  );
}

export default function SentCampaignDetails({
  campaign,
  onBack,
  showBack = false,
}: SentCampaignDetailsProps) {
  const statusLabel = STATUS_LABELS[campaign.status] ?? campaign.status;
  const statusStyle = STATUS_STYLES[campaign.status] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  const categoryLabel = CATEGORY_LABELS[campaign.category] ?? campaign.category;
  const displayDate = campaign.sent_at || campaign.created_at;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3 shrink-0">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shrink-0"
            aria-label="Voltar à lista"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-[#00628c] shrink-0" />
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md border ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 leading-snug break-words">
            {displayText(campaign.subject)}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{formatDateTime(displayDate)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <dl>
          <MetaRow label="Categoria" value={displayText(categoryLabel)} />
          <MetaRow label="Remetente" value={displayText(campaign.from_email)} />
          <MetaRow label="Data e hora" value={formatDateTime(displayDate)} />
          <MetaRow label="Status" value={statusLabel} />
          <MetaRow
            label="Destinatários"
            value={
              typeof campaign.recipients_count === 'number'
                ? campaign.recipients_count
                : 'Não disponível'
            }
          />
          <MetaRow
            label="Sucessos"
            value={
              typeof campaign.success_count === 'number'
                ? campaign.success_count
                : 'Não disponível'
            }
          />
          <MetaRow
            label="Falhas"
            value={
              typeof campaign.failure_count === 'number'
                ? campaign.failure_count
                : 'Não disponível'
            }
          />
          <MetaRow
            label="Inválidos"
            value={
              typeof campaign.invalid_count === 'number'
                ? campaign.invalid_count
                : 'Não disponível'
            }
          />
          <MetaRow
            label="Texto do botão"
            value={displayText(campaign.primary_button_text)}
          />
          <MetaRow
            label="Link do botão"
            value={
              campaign.primary_button_link ? (
                <span className="font-mono text-xs break-all">
                  {campaign.primary_button_link}
                </span>
              ) : (
                'Não disponível'
              )
            }
          />
          <MetaRow
            label="Cliques"
            value={
              <span className="text-slate-500 italic font-normal">
                Cliques indisponíveis nesta etapa
              </span>
            }
          />
        </dl>

        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">
            Conteúdo salvo
          </h3>
          {campaign.html_content?.trim() ? (
            <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono">
              {campaign.html_content}
            </pre>
          ) : (
            <p className="text-sm text-slate-500 italic">Não disponível</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">
            Pré-visualização do e-mail
          </h3>
          <EmailPreview
            htmlContent={campaign.html_content}
            buttonText={campaign.primary_button_text}
            buttonLink={campaign.primary_button_link}
          />
        </div>
      </div>
    </div>
  );
}
