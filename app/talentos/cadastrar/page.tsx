'use client';

import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  AlignLeft, 
  Plus, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Star,
  Mail,
  Phone,
  FileText,
  Upload,
  Globe
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { LEGAL_VERSION } from '@/lib/legal';
import Link from 'next/link';
import Image from 'next/image';
import { maskPhone } from '@/lib/utils';
import {
  DOCUMENT_MIME_TYPES,
  GRAVATAR_PLACEHOLDER,
  IMAGE_MIME_TYPES,
  UPLOAD_CATEGORY_IDS,
  UPLOAD_LIMITS,
} from '@/lib/storage-config';
import { needsUnoptimizedMedia, resolvePublicMediaSrc } from '@/lib/media-src';
import { removeUploaded, uploadPublicImage, uploadToStorage, type StorageObjectRef } from '@/lib/storage-upload';

export default function CadastrarTalentoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    area: 'Tecnologia',
    role: '',
    summary: '',
    skills: [] as string[],
    image: GRAVATAR_PLACEHOLDER,
    resume_url: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<{ name: string; size: number; file: File }[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consentError, setConsentError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const resumeInputRef = React.useRef<HTMLInputElement>(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list',
    'link'
  ];

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = (file.type || '').toLowerCase();
    if (!IMAGE_MIME_TYPES.includes(mime as (typeof IMAGE_MIME_TYPES)[number])) {
      setErrorModal({
        isOpen: true,
        title: 'Arquivo não permitido',
        message: 'Envie uma imagem em JPEG, PNG, WebP ou GIF.',
      });
      return;
    }
    if (file.size > UPLOAD_LIMITS.profileImageBytes) {
      setErrorModal({
        isOpen: true,
        title: 'Arquivo Grande Demais',
        message: 'A foto deve ter no máximo 5MB.',
      });
      return;
    }

    if (formData.image.startsWith('blob:')) {
      URL.revokeObjectURL(formData.image);
    }
    setPhotoFile(file);
    setFormData((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newResumesList = [...resumes];
      let currentTotalSize = resumes.reduce((acc, r) => acc + r.size, 0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mime = (file.type || '').toLowerCase();
        if (!DOCUMENT_MIME_TYPES.includes(mime as (typeof DOCUMENT_MIME_TYPES)[number])) {
          setErrorModal({
            isOpen: true,
            title: 'Arquivo não permitido',
            message: `O arquivo "${file.name}" precisa ser PDF, DOC ou DOCX.`,
          });
          continue;
        }
        if (file.size > UPLOAD_LIMITS.documentBytes) {
          setErrorModal({
            isOpen: true,
            title: 'Arquivo Grande Demais',
            message: `O arquivo "${file.name}" excede o limite individual de 3MB. Por favor, envie arquivos menores.`
          });
          continue;
        }

        if (currentTotalSize + file.size > UPLOAD_LIMITS.documentsTotalBytes) {
          setErrorModal({
            isOpen: true,
            title: 'Limite Combinado Excedido',
            message: `Não foi possível adicionar o arquivo "${file.name}". O limite combinado para todos os anexos juntos é de 5MB.`
          });
          break;
        }

        newResumesList.push({
          name: file.name,
          size: file.size,
          file,
        });

        currentTotalSize += file.size;
      }

      setResumes(newResumesList);
      setFormData(prev => ({ ...prev, resume_url: newResumesList.length > 0 ? 'pending' : '' }));

      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const removeResume = (indexToRemove: number) => {
    const updated = resumes.filter((_, idx) => idx !== indexToRemove);
    setResumes(updated);
    setFormData(prev => ({
      ...prev,
      resume_url: updated.length > 0 ? 'pending' : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar e-mail de forma permissiva para aceitar caracteres com acento (Ex: dedé@gmail.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor, insira um e-mail válido.');
      return;
    }

    if (!termsAccepted || !privacyConsent) {
      setConsentError('Para enviar o cadastro, é necessário marcar as duas confirmações abaixo.');
      return;
    }

    setConsentError('');
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    const uploaded: StorageObjectRef[] = [];

    try {
      let imageValue = GRAVATAR_PLACEHOLDER;
      if (photoFile) {
        const photoRef = await uploadPublicImage({
          category: UPLOAD_CATEGORY_IDS.talentPhoto,
          file: photoFile,
          originalName: photoFile.name,
        });
        uploaded.push(photoRef);
        imageValue = photoRef.publicUrl || photoRef.path;
      }

      const resumeItems: { name: string; url: string }[] = [];
      for (const resume of resumes) {
        const docRef = await uploadToStorage({
          category: UPLOAD_CATEGORY_IDS.talentCv,
          file: resume.file,
          originalName: resume.name,
        });
        uploaded.push(docRef);
        resumeItems.push({ name: resume.name, url: docRef.path });
      }

      const acceptedAt = new Date().toISOString();
      const { resume_url: _resumeUrl, image: _image, ...rest } = formData;
      const submissionData = {
        ...rest,
        image: imageValue,
        cv_url: resumeItems.length > 0 ? JSON.stringify(resumeItems) : '',
        status: 'pending',
        terms_accepted: true,
        terms_accepted_at: acceptedAt,
        terms_version: LEGAL_VERSION,
        privacy_consent: true,
        privacy_consent_at: acceptedAt,
        privacy_policy_version: LEGAL_VERSION,
      };

      const { error } = await supabase
        .from('talentos')
        .insert([submissionData])
        .select();

      if (error) {
        console.error('Erro Supabase:', error);
        throw new Error(error.message);
      }

      try {
        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_talent',
            fields: {
              name: formData.name,
              role: formData.role,
              email: formData.email,
              phone: formData.phone,
              location: formData.location,
            },
          }),
        });
      } catch (err) {
        console.error('Erro ao enviar e-mail de notificação de talento:', err);
      }
      
      setIsSuccess(true);
    } catch (error: any) {
      await removeUploaded(uploaded);
      console.error('Erro ao cadastrar talento:', error);
      alert(`Erro: ${error.message || 'Verifique sua conexão ou se houve um problema no envio dos arquivos.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center border border-[#bec8d1]/20"
        >
          <div className="w-20 h-20 bg-[#bff444] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#bff444]/20">
            <CheckCircle2 className="w-10 h-10 text-[#141f00]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#00628c] mb-4 font-headline">Currículo enviado com sucesso</h2>
          <p className="text-[#3e4850] mb-10 leading-relaxed">
            Recebemos seu currículo. Ele passará por uma moderação para publicação e, quando estiver disponível no site, você receberá uma notificação por e-mail.
          </p>
          <Link 
            href="/" 
            className="inline-block w-full py-4 bg-[#00628c] text-white font-bold rounded-2xl hover:bg-[#004c6d] transition-all shadow-lg shadow-[#00628c]/20"
          >
            Voltar para o início
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] py-12 px-4 md:px-8 font-body">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#3e4850] hover:text-[#00628c] font-bold mb-10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar para o início
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-[#bec8d1]/10">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold text-[#00628c] font-headline mb-4">Cadastrar Currículo</h1>
            <p className="text-[#3e4850]">Mostre seu talento para empresas que valorizam a dignidade humana.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Selection */}
            <div className="flex justify-center mb-10">
               <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-[#f6f3f2] overflow-hidden border-2 border-dashed border-[#bec8d1] flex items-center justify-center group-hover:border-[#00628c] transition-colors relative shadow-inner text-white">
                    <Image 
                      src={resolvePublicMediaSrc(formData.image) || formData.image} 
                      alt="Avatar" 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized={needsUnoptimizedMedia(formData.image) || formData.image.startsWith('blob:')}
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white font-bold text-[10px] uppercase tracking-widest text-center px-4"
                    >
                      {formData.image.includes('gravatar') ? 'Adicionar Minha Foto' : 'Trocar Foto'}
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                  {!formData.image.includes('gravatar') ? (
                    <button 
                      type="button"
                      onClick={() => {
                        if (formData.image.startsWith('blob:')) {
                          URL.revokeObjectURL(formData.image);
                        }
                        setPhotoFile(null);
                        setFormData(prev => ({ ...prev, image: GRAVATAR_PLACEHOLDER }));
                      }}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-100 shadow-xl rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 active:scale-95 transition-all border border-red-200"
                      title="Remover foto"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-[#00628c] hover:scale-110 active:scale-95 transition-all border border-[#bec8d1]/20"
                      title="Adicionar foto"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Obrigatórios */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="Seu nome" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">E-mail de Contato *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="exemplo@email.com" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Telefone / WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="tel" 
                    placeholder="(00) 00000-0000" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                  />
                </div>
              </div>

              {/* Não obrigatórios */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Cidade / Estado</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="text" 
                    placeholder="Ex: Rio de Janeiro, RJ" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Cargo / Especialidade</label>
                <div className="relative">
                  <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="text" 
                    placeholder="Ex: Auxiliar de Cozinha" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Área Principal</label>
                <select 
                  className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c] transition-all"
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
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
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Resumo Profissional</label>
              <div className="bg-[#f6f3f2] rounded-2xl overflow-hidden border border-transparent focus-within:ring-2 focus-within:ring-[#00628c]/40 transition-all">
                <ReactQuill 
                  theme="snow"
                  value={formData.summary}
                  onChange={(val) => setFormData(prev => ({ ...prev, summary: val }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Conte um pouco sobre suas experiências profissionais..."
                  className="bg-white min-h-[150px]"
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
                min-height: 150px;
              }
            `}</style>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Currículo (Opcional) - Envie um ou mais arquivos</label>
              <div 
                onClick={() => resumeInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#bec8d1] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-[#f6f3f2]/30 hover:bg-[#00628c]/5 hover:border-[#00628c] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform text-[#00628c]">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#3e4850]">
                    Clique para anexar arquivos de currículo
                  </p>
                  <p className="text-xs text-[#6f7881] mt-1">Formatos aceitos: PDF, DOC, DOCX</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-1.5 bg-amber-50 px-2 py-1 rounded">Limite: Até 3MB por arquivo / Máximo de 5MB somando todos os anexos</p>
                </div>
                <input 
                  type="file"
                  multiple
                  ref={resumeInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                />
              </div>

              {resumes.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-bold text-[#3e4850] uppercase tracking-wider ml-1">Arquivos Anexados ({resumes.length})</p>
                  <div className="grid grid-cols-1 gap-2">
                    {resumes.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white border border-[#bec8d1]/30 rounded-2xl shadow-sm">
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
                            removeResume(idx);
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

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Habilidades</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Trabalho em Equipe, Excel..." 
                  className="flex-1 px-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button 
                  type="button"
                  onClick={addSkill}
                  className="p-4 bg-[#00628c] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, idx) => (
                  <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-[#00628c]/5 text-[#00628c] font-black uppercase text-[10px] tracking-widest rounded-xl border border-[#00628c]/10">
                    {skill}
                    <button type="button" onClick={() => removeSkill(idx)}>
                      <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#00628c]/15 bg-[#00628c]/5 p-5 space-y-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#00628c]">Seu perfil será público</h2>
              <p className="text-sm text-[#3e4850] leading-relaxed">
                Após aprovação pela equipe da Corrente do Bem, as informações deste cadastro poderão ser visualizadas por visitantes, empresas e recrutadores. Isso inclui seus dados de contato e o currículo enviado.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-[#bec8d1] text-[#00628c] focus:ring-[#00628c]/40"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    setConsentError('');
                  }}
                />
                <span className="text-sm text-[#3e4850] leading-relaxed">
                  Li e concordo com os{' '}
                  <Link href="/termos" target="_blank" rel="noopener noreferrer" className="font-bold text-[#00628c] underline underline-offset-2">
                    Termos de Uso
                  </Link>{' '}
                  e declaro que as informações fornecidas são verdadeiras e de minha responsabilidade.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-[#bec8d1] text-[#00628c] focus:ring-[#00628c]/40"
                  checked={privacyConsent}
                  onChange={(e) => {
                    setPrivacyConsent(e.target.checked);
                    setConsentError('');
                  }}
                />
                <span className="text-sm text-[#3e4850] leading-relaxed">
                  Autorizo expressamente a Corrente do Bem a tratar e publicar os dados enviados neste cadastro, incluindo meu nome, foto, localização, e-mail, telefone, informações profissionais e currículo/PDF completo. Estou ciente de que, após aprovação, essas informações ficarão publicamente acessíveis na internet pelo período informado na{' '}
                  <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-bold text-[#00628c] underline underline-offset-2">
                    Política de Privacidade
                  </Link>.
                </span>
              </label>

              {consentError && (
                <p className="text-sm font-bold text-red-600">{consentError}</p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-[#00628c] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#004c6d] transition-all shadow-xl shadow-[#00628c]/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Perfil Profissional'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation and Error Modals */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border border-[#bec8d1]/20 text-center"
            >
              <div className="w-16 h-16 bg-[#00628c]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#00628c]">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[#1a2b3b] mb-4">Confirmar Envio?</h3>
              <p className="text-[#3e4850] mb-8 leading-relaxed">
                Você revisou as informações e deseja realmente enviar seu currículo para aprovação?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="py-4 px-6 bg-[#f6f3f2] text-[#3e4850] font-bold rounded-2xl hover:bg-[#e8e4e2] transition-all"
                >
                  Revisar
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="py-4 px-6 bg-[#00628c] text-white font-bold rounded-2xl hover:bg-[#004c6d] transition-all shadow-lg shadow-[#00628c]/20"
                >
                  Sim, Enviar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {errorModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border border-red-100 text-center relative overflow-hidden"
            >
              {/* Top accent bar to convey high quality error visual */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-red-500" />
              
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[#1a2b3b] mb-3">{errorModal.title}</h3>
              <p className="text-[#6f7881] text-sm mb-8 leading-relaxed">
                {errorModal.message}
              </p>
              <button 
                onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20"
              >
                Entendi e vou corrigir
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
