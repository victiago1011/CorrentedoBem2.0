'use client';

import React, { useMemo } from 'react';

export interface EmailPreviewProps {
  htmlContent: string | null | undefined;
  buttonText?: string | null;
  buttonLink?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyNeutralPlaceholders(html: string): string {
  return html
    .replace(/\{\{\s*nome\s*\}\}/gi, 'Amigo(a)')
    .replace(/\{\{\s*email\s*\}\}/gi, 'exemplo@email.com');
}

/** Builds a visual email envelope for admin preview (no tracking / unsubscribe links). */
export function buildPreviewHtml(
  htmlContent: string | null | undefined,
  buttonText?: string | null,
  buttonLink?: string | null
): string {
  const year = new Date().getFullYear();
  const body =
    typeof htmlContent === 'string' && htmlContent.trim()
      ? applyNeutralPlaceholders(htmlContent)
      : '<p style="color:#94a3b8;font-style:italic;">Conteúdo não disponível.</p>';

  const text = typeof buttonText === 'string' ? buttonText.trim() : '';
  const link = typeof buttonLink === 'string' ? buttonLink.trim() : '';

  let actionButtonHtml = '';
  if (text && link) {
    const safeText = escapeHtml(text);
    actionButtonHtml = `
      <div style="text-align: center; margin: 30px 0;">
        <span style="background-color: #00628c; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,98,140,0.2);">
          ${safeText}
        </span>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155; line-height: 1.6; margin: 0; padding: 0; }
    .content-area p { margin-bottom: 16px; }
    .content-area ul, .content-area ol { margin-bottom: 16px; padding-left: 20px; }
  </style>
</head>
<body style="background-color: #f8fafc; padding: 20px 10px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="background-color: #00628c; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.025em;">Corrente do Bem</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Conectando Talentos e Oportunidades</p>
    </div>
    <div style="padding: 30px 24px;" class="content-area">
      ${body}
      ${actionButtonHtml}
    </div>
    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 8px 0;">Você está recebendo este e-mail porque faz parte da rede da <strong>Corrente do Bem</strong>.</p>
      <p style="margin: 0 0 16px 0;">Corrente do Bem © ${year} — Todos os direitos reservados.</p>
      <div style="margin-top: 12px;">
        <span style="color: #64748b; text-decoration: underline; font-weight: 500;">
          Não quero mais receber estes e-mails (Descadastrar)
        </span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function EmailPreview({
  htmlContent,
  buttonText,
  buttonLink,
}: EmailPreviewProps) {
  const srcDoc = useMemo(
    () => buildPreviewHtml(htmlContent, buttonText, buttonLink),
    [htmlContent, buttonText, buttonLink]
  );

  return (
    <iframe
      title="Pré-visualização do e-mail"
      sandbox=""
      srcDoc={srcDoc}
      className="w-full h-[420px] md:h-[520px] rounded-xl border border-slate-200 bg-white"
    />
  );
}
