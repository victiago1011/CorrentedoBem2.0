'use client';

import React from 'react';

interface CampaignButtonPreviewProps {
  buttonText: string;
  buttonLink: string;
  onButtonTextChange: (value: string) => void;
  onButtonLinkChange: (value: string) => void;
}

/** Visual styles mirrored from the email CTA in send-campaign renderTemplate. */
const emailButtonStyle: React.CSSProperties = {
  backgroundColor: '#00628c',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '15px',
  display: 'inline-block',
  boxShadow: '0 4px 6px rgba(0,98,140,0.2)',
  cursor: 'default',
  userSelect: 'none',
};

export default function CampaignButtonPreview({
  buttonText,
  buttonLink,
  onButtonTextChange,
  onButtonLinkChange,
}: CampaignButtonPreviewProps) {
  const previewLabel = buttonText.trim() || 'Texto do botão';

  return (
    <div className="px-6 py-5 border-b border-slate-100 bg-white">
      <h3 className="text-sm font-extrabold text-slate-800 mb-1">
        Botão no e-mail (opcional)
      </h3>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Adicione um botão de chamada para ação para aumentar os cliques e o engajamento.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="campaign-btn-text"
              className="block text-xs font-bold text-slate-600 mb-1.5"
            >
              Texto do botão
            </label>
            <input
              id="campaign-btn-text"
              type="text"
              placeholder="Ex: Acessar portal de vagas"
              value={buttonText}
              onChange={(e) => onButtonTextChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#00628c]/20 outline-none transition"
            />
          </div>
          <div>
            <label
              htmlFor="campaign-btn-link"
              className="block text-xs font-bold text-slate-600 mb-1.5"
            >
              Link de destino
            </label>
            <input
              id="campaign-btn-link"
              type="text"
              placeholder="Ex: https://correntedobembr.com.br/vagas"
              value={buttonLink}
              onChange={(e) => onButtonLinkChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#00628c]/20 outline-none transition"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold text-slate-600 mb-3">
            Pré-visualização do botão
          </p>
          <div className="flex justify-center items-center min-h-[72px] py-3">
            <span style={emailButtonStyle} aria-hidden="true">
              {previewLabel}
            </span>
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-3 flex items-start gap-1.5">
            <span className="shrink-0" aria-hidden="true">
              ✔
            </span>
            <span>Este botão será rastreado automaticamente.</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/80">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-600">Dica importante:</span>{' '}
              E-mails com botões claros e chamativos costumam receber significativamente mais
              cliques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
