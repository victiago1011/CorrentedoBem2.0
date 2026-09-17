'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { getOpenableFileUrl, isStoragePath, parseAttachments } from '@/lib/media-src';
import type { SignedFileKind } from '@/lib/storage-config';
import { openStoredAttachment } from '@/lib/storage-upload';

type FileAttachmentsProps = {
  value?: string | null;
  defaultName?: string;
  compact?: boolean;
  kind?: SignedFileKind;
  recordId?: string | number;
  useAdminSession?: boolean;
};

export function FileAttachments({
  value,
  defaultName = 'Anexo',
  compact = false,
  kind,
  recordId,
  useAdminSession = false,
}: FileAttachmentsProps) {
  const items = parseAttachments(value, defaultName);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  const iconBox = compact
    ? 'w-10 h-10 rounded-xl bg-[#c8e6ff] flex items-center justify-center text-[#00628c]'
    : 'w-12 h-12 rounded-xl bg-[#c8e6ff] flex items-center justify-center text-[#00628c]';
  const titleClass = compact
    ? 'text-xs font-black text-[#00628c] uppercase tracking-wider truncate'
    : 'text-sm font-black text-[#00628c] uppercase tracking-wider truncate';
  const rowClass =
    'flex items-center gap-4 p-4 bg-[#f6f3f2] rounded-2xl border border-transparent';

  const openPrivate = async (index: number, url: string, name: string) => {
    if (!kind || recordId === undefined) {
      alert('Não foi possível abrir o arquivo.');
      return;
    }
    setBusyIndex(index);
    try {
      await openStoredAttachment({
        url,
        name,
        kind,
        recordId,
        index,
        useAdminSession,
      });
    } catch {
      alert('Não foi possível abrir o arquivo. Tente novamente em instantes.');
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      {items.map((attachment, index) => {
        const href = getOpenableFileUrl(attachment.url);
        const canSign = Boolean(kind && recordId !== undefined && isStoragePath(attachment.url));
        const helperText = href || canSign
          ? busyIndex === index
            ? 'Abrindo arquivo...'
            : 'Clique para baixar o arquivo anexado'
          : 'Arquivo armazenado. O download será liberado na próxima etapa.';
        const body = (
          <>
            <div className={iconBox}>
              <Paperclip className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={titleClass} title={attachment.name}>
                {attachment.name}
              </p>
              <p className="text-[10px] text-[#6f7881]">{helperText}</p>
            </div>
          </>
        );

        if (href) {
          return (
            <a
              key={`${attachment.name}-${index}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.name}
              className={`${rowClass} hover:bg-[#c8e6ff]/20 transition-all hover:border-[#00628c]/10`}
            >
              {body}
            </a>
          );
        }

        if (canSign) {
          return (
            <button
              key={`${attachment.name}-${index}`}
              type="button"
              onClick={() => openPrivate(index, attachment.url, attachment.name)}
              disabled={busyIndex === index}
              className={`${rowClass} w-full text-left hover:bg-[#c8e6ff]/20 transition-all hover:border-[#00628c]/10 disabled:opacity-70`}
            >
              {body}
            </button>
          );
        }

        return (
          <div key={`${attachment.name}-${index}`} className={rowClass}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
