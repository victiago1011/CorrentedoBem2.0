'use client';

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Plus,
  X,
  Loader2,
  Mail,
  Phone,
  Link as LinkIcon,
  Upload,
  FileText,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { maskPhone, maskCurrency } from '@/lib/utils';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export type JobFormValues = {
  title: string;
  company: string;
  email: string;
  phone: string;
  site_url: string;
  location: string;
  type: string;
  area: string;
  salary: string;
  description: string;
  attachment_url: string;
  logo_url: string;
  requirements: string[];
};

export type JobFormProps = {
  mode: 'public' | 'admin';
  initialValues?: Partial<JobFormValues>;
  onSubmit: (values: JobFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showHeader?: boolean;
};

const DEFAULT_VALUES: JobFormValues = {
  title: '',
  company: '',
  email: '',
  phone: '',
  site_url: '',
  location: '',
  type: 'Tempo Integral',
  area: 'Tecnologia',
  salary: '',
  description: '',
  attachment_url: '',
  logo_url: '',
  requirements: [],
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'link',
];

export default function JobForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
  showHeader = mode === 'public',
}: JobFormProps) {
  const [formData, setFormData] = useState<JobFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
    requirements: initialValues?.requirements ?? DEFAULT_VALUES.requirements,
  });
  const [reqInput, setReqInput] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>(() => {
    if (!initialValues?.attachment_url) return [];
    try {
      const parsed = JSON.parse(initialValues.attachment_url);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: { name?: string; url?: string }) => item?.url);
      }
    } catch {
      // ignore invalid JSON
    }
    return [];
  });
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  const resolvedSubmitLabel =
    submitLabel ?? (mode === 'admin' ? 'Publicar Vaga' : 'Anunciar Vaga');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addRequirement = () => {
    if (reqInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, reqInput.trim()],
      }));
      setReqInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachmentsList = [...attachments];

      let currentTotalSize = attachments.reduce((acc, a) => {
        const base64Str = a.url.split(',')[1] || '';
        return acc + base64Str.length * 0.75;
      }, 0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 3 * 1024 * 1024) {
          setErrorModal({
            isOpen: true,
            title: 'Arquivo Grande Demais',
            message: `O arquivo "${file.name}" excede o limite individual de 3MB. Por favor, envie arquivos menores.`,
          });
          continue;
        }

        if (currentTotalSize + file.size > 5 * 1024 * 1024) {
          setErrorModal({
            isOpen: true,
            title: 'Limite Combinado Excedido',
            message: `Não foi possível adicionar o arquivo "${file.name}". O limite combinado para todos os anexos juntos é de 5MB, para garantir que os arquivos sejam gravados de forma estável no banco de dados.`,
          });
          break;
        }

        const fileDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachmentsList.push({
          name: file.name,
          url: fileDataUrl,
        });

        currentTotalSize += file.size;
      }

      setAttachments(newAttachmentsList);
      setFormData((prev) => ({ ...prev, attachment_url: JSON.stringify(newAttachmentsList) }));

      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    const updated = attachments.filter((_, idx) => idx !== indexToRemove);
    setAttachments(updated);
    setFormData((prev) => ({
      ...prev,
      attachment_url: updated.length > 0 ? JSON.stringify(updated) : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
      }
    }

    await onSubmit({
      ...formData,
      attachment_url:
        attachments.length > 0 ? JSON.stringify(attachments) : formData.attachment_url,
    });
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col items-center mb-10">
        <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] mb-4">
          Logo da Empresa / Instituição
        </label>
        <div className="relative group">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 rounded-[2.5rem] bg-[#f6f3f2] overflow-hidden border-2 border-dashed border-[#bec8d1] flex items-center justify-center group-hover:border-[#00628c] transition-colors relative shadow-inner cursor-pointer"
          >
            {formData.logo_url ? (
              <Image
                src={formData.logo_url}
                alt="Logo"
                fill
                className="object-contain p-4"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#6f7881]">
                <Upload className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Upload Logo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-[10px] uppercase tracking-widest text-center px-4">
              {formData.logo_url ? 'Trocar Logo' : 'Adicionar Logo'}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleLogoChange}
          />
          {formData.logo_url && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFormData((prev) => ({ ...prev, logo_url: '' }));
              }}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-100 shadow-xl rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 active:scale-95 transition-all border border-red-200"
              title="Remover logo"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-[#6f7881] mt-3 font-medium italic">
          Recomendado: Logo em formato quadrado ou circular.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Título da Vaga <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              required
              type="text"
              placeholder="Ex: Cozinheiro Industrial"
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Empresa / Instituição <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              required
              type="text"
              placeholder="Ex: Abrigo Esperança"
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Email de Contato
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              type="text"
              placeholder="contato@empresa.com"
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            WhatsApp / Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Site ou Link da Vaga
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              type="text"
              placeholder="https://empresa.com/vaga"
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all font-bold text-[#1b1c1c]"
              value={formData.site_url}
              onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Localização
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              type="text"
              placeholder="Ex: Porto Alegre, RS"
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-black uppercase tracking-widest text-[#3e4850]">
              Salário / Remuneração
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-[#00628c] cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-[#bec8d1] text-[#00628c] focus:ring-[#00628c]/40"
                checked={formData.salary === 'A combinar'}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, salary: 'A combinar' });
                  } else {
                    setFormData({ ...formData, salary: '' });
                  }
                }}
              />
              A combinar
            </label>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
            <input
              type="text"
              placeholder={formData.salary === 'A combinar' ? 'A combinar' : 'Ex: R$ 2.500,00'}
              className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all font-bold text-[#1b1c1c] disabled:opacity-50"
              value={formData.salary === 'A combinar' ? '' : formData.salary}
              disabled={formData.salary === 'A combinar'}
              onChange={(e) => setFormData({ ...formData, salary: maskCurrency(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Tipo de Vaga <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c]"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option>Tempo Integral</option>
            <option>Meio Período</option>
            <option>Híbrido</option>
            <option>Remoto</option>
            <option>Temporário</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
            Área de Atuação <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c]"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          >
            <option>Tecnologia</option>
            <option>Saúde</option>
            <option>Finanças</option>
            <option>Engenharia & Arquitetura</option>
            <option>Autônomos</option>
            <option>Educação</option>
            <option>Serviços Gerais</option>
            <option>Outros</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
          Descrição Detalhada
        </label>
        <div className="bg-[#f6f3f2] rounded-2xl overflow-hidden border border-transparent focus-within:ring-2 focus-within:ring-[#00628c]/40 transition-all">
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Descreva as responsabilidades e o que a vaga oferece..."
            className="bg-white min-h-[200px]"
          />
        </div>
      </div>

      <style jsx global>{`
        .ql-container {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          font-family: inherit;
          font-size: 1rem;
        }
        .ql-toolbar {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #f6f3f2 !important;
          background: #fcf9f8;
        }
        .ql-container.ql-snow {
          border-color: #f6f3f2 !important;
        }
        .ql-editor {
          min-height: 200px;
        }
      `}</style>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-[#3e4850]">
            Requisitos / Exigências
          </label>
          <span className="text-[10px] text-[#6f7881] font-bold">Pressione Enter para adicionar</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Experiência anterior em cozinha"
            className="flex-1 px-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
            value={reqInput}
            onChange={(e) => setReqInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
          />
          <button
            type="button"
            onClick={addRequirement}
            className="p-4 bg-[#00628c] text-white rounded-2xl hover:scale-105 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.requirements.map((req, idx) => (
            <span
              key={idx}
              className="flex items-center gap-2 px-4 py-2 bg-[#00628c]/5 text-[#00628c] font-bold rounded-xl border border-[#00628c]/10"
            >
              {req}
              <button type="button" onClick={() => removeRequirement(idx)}>
                <X className="w-4 h-4 hover:text-red-500 transition-colors" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">
          Anexos / Arquivos - Envie um ou mais arquivos
        </label>
        <div
          onClick={() => attachmentInputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#bec8d1] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-[#f6f3f2]/30 hover:bg-[#00628c]/5 hover:border-[#00628c] transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-[#00628c]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-[#3e4850]">
              Clique para anexar um ou mais documentos complementares
            </p>
            <p className="text-xs text-[#6f7881] mt-1">Formatos aceitos: PDF, DOCX, Imagens</p>
            <p className="text-[10px] text-amber-600 font-bold mt-1.5 bg-amber-50 px-2 py-1 rounded">
              Limite: Até 3MB por arquivo / Máximo de 5MB somando todos os anexos
            </p>
          </div>
          <input
            type="file"
            multiple
            ref={attachmentInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleAttachmentChange}
          />
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-bold text-[#3e4850] uppercase tracking-wider ml-1">
              Arquivos Anexados ({attachments.length})
            </p>
            <div className="grid grid-cols-1 gap-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-white border border-[#bec8d1]/30 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-3 truncate pr-4">
                    <div className="p-2 bg-[#00628c]/10 text-[#00628c] rounded-xl shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-[#3e4850] truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(idx);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    title="Remover anexo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {mode === 'admin' && onCancel ? (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-[#f6f3f2] text-[#3e4850] rounded-xl font-bold hover:bg-[#e8e4e2] transition-all disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-[#00628c] text-white rounded-xl font-bold shadow-lg shadow-[#00628c]/20 hover:bg-[#004c6d] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cadastrando...
              </>
            ) : (
              resolvedSubmitLabel
            )}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-[#00628c] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#004c6d] transition-all shadow-xl shadow-[#00628c]/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Cadastrando...
            </>
          ) : (
            resolvedSubmitLabel
          )}
        </button>
      )}
    </form>
  );

  return (
    <>
      {showHeader ? (
        <>
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold text-[#00628c] font-headline mb-4">Anunciar Vaga</h1>
            <p className="text-[#3e4850]">
              Preencha os detalhes da oportunidade para encontrar o talento ideal.
            </p>
          </header>
          {formBody}
        </>
      ) : (
        formBody
      )}

      <AnimatePresence>
        {errorModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border border-red-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-red-500" />

              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[#1a2b3b] mb-3">{errorModal.title}</h3>
              <p className="text-[#6f7881] text-sm mb-8 leading-relaxed">{errorModal.message}</p>
              <button
                onClick={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20"
              >
                Entendi e vou corrigir
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
