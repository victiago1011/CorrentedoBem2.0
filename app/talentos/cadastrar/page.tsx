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
import Link from 'next/link';
import Image from 'next/image';
import { maskPhone } from '@/lib/utils';

export default function CadastrarTalentoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    area: 'Tecnologia',
    role: '',
    summary: '',
    skills: [] as string[],
    image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    resume_url: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [resumeName, setResumeName] = useState('');
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, resume_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      const { resume_url, ...rest } = formData;
      const submissionData = {
        ...rest,
        cv_url: resume_url,
        status: 'pending'
      };

      console.log('Enviando dados:', submissionData);

      const { error, data } = await supabase
        .from('talentos')
        .insert([submissionData])
        .select();

      if (error) {
        console.error('Erro Supabase:', error);
        throw new Error(error.message);
      }
      
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Erro ao cadastrar talento:', error);
      alert(`Erro: ${error.message || 'Verifique sua conexão ou se houve um problema no banco de dados.'}`);
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
          <h2 className="text-3xl font-extrabold text-[#00628c] mb-4 font-headline">Perfil Enviado!</h2>
          <p className="text-[#3e4850] mb-10 leading-relaxed">
            Seu currículo foi enviado e está aguardando aprovação. Em breve seu talento estará visível para empresas com propósito.
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
                      src={formData.image} 
                      alt="Avatar" 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
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
                      onClick={() => setFormData(prev => ({ ...prev, image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }))}
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
                    type="email" 
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
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Currículo (Opcional)</label>
              <div 
                onClick={() => resumeInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#bec8d1] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-[#f6f3f2]/30 hover:bg-[#00628c]/5 hover:border-[#00628c] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform text-[#00628c]">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#3e4850] truncate max-w-xs md:max-w-md">
                    {resumeName || 'Clique para anexar arquivo'}
                  </p>
                </div>
                <input 
                  type="file"
                  ref={resumeInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                />
              </div>
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

      {/* Confirmation Modal */}
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
      </AnimatePresence>
    </div>
  );
}
