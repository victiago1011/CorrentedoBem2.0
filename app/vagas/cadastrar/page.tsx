'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  AlignLeft, 
  Plus, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Link as LinkIcon,
  Paperclip,
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
import { maskPhone, maskCurrency } from '@/lib/utils';

export default function CadastrarVagaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
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
    requirements: [] as string[]
  });
  const [reqInput, setReqInput] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addRequirement = () => {
    if (reqInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, reqInput.trim()]
      }));
      setReqInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachment_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('vagas')
        .insert([{
          title: formData.title,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          site_url: formData.site_url,
          location: formData.location,
          type: formData.type,
          area: formData.area,
          salary: formData.salary,
          description: formData.description,
          attachment_url: formData.attachment_url,
          logo_url: formData.logo_url || null,
          requirements: formData.requirements,
          status: 'pending'
        }]);

      if (error) {
        console.error('Erro detalhado do Supabase (Jobs):', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Erro ao cadastrar vaga:', error);
      const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      alert(`Erro ao cadastrar vaga: ${errorMsg}\n\nNota: Verifique se a tabela 'jobs' existe no seu Supabase e se as chaves API estão corretas no painel Settings.`);
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
          <h2 className="text-3xl font-extrabold text-[#00628c] mb-4 font-headline">Vaga Enviada!</h2>
          <p className="text-[#3e4850] mb-10 leading-relaxed">
            Sua vaga foi enviada e está aguardando aprovação dos nossos administradores. Em breve ela estará disponível no portal.
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
    <div className="min-h-screen bg-[#fcf9f8] py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#3e4850] hover:text-[#00628c] font-bold mb-10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar para o início
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-[#bec8d1]/10">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold text-[#00628c] font-headline mb-4">Anunciar Vaga</h1>
            <p className="text-[#3e4850]">Preencha os detalhes da oportunidade para encontrar o talento ideal.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Upload Section */}
            <div className="flex flex-col items-center mb-10">
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] mb-4">Logo da Empresa / Instituição</label>
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
                      setFormData(prev => ({ ...prev, logo_url: '' }));
                    }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-100 shadow-xl rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 active:scale-95 transition-all border border-red-200"
                    title="Remover logo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#6f7881] mt-3 font-medium italic">Recomendado: Logo em formato quadrado ou circular.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Título da Vaga <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Cozinheiro Industrial" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Empresa / Instituição <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Abrigo Esperança" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Email de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="email" 
                    placeholder="contato@empresa.com" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">WhatsApp / Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Site ou Link da Vaga</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="text" 
                    placeholder="https://empresa.com/vaga" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all font-bold text-[#1b1c1c]"
                    value={formData.site_url}
                    onChange={e => setFormData({...formData, site_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Localização</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="text" 
                    placeholder="Ex: Porto Alegre, RS" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Salário / Remuneração</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="text" 
                    placeholder="Ex: R$ 2.500,00" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all font-bold text-[#1b1c1c]"
                    value={formData.salary}
                    onChange={e => setFormData({...formData, salary: maskCurrency(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Tipo de Vaga <span className="text-red-500">*</span></label>
                <select 
                  required
                  className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c]"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option>Tempo Integral</option>
                  <option>Meio Período</option>
                  <option>Híbrido</option>
                  <option>Remoto</option>
                  <option>Temporário</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Área de Atuação <span className="text-red-500">*</span></label>
                <select 
                  required
                  className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c]"
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
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Descrição Detalhada</label>
              <div className="bg-[#f6f3f2] rounded-2xl overflow-hidden border border-transparent focus-within:ring-2 focus-within:ring-[#00628c]/40 transition-all">
                <ReactQuill 
                  theme="snow"
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
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
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850]">Requisitos / Exigências</label>
                <span className="text-[10px] text-[#6f7881] font-bold">Pressione Enter para adicionar</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Experiência anterior em cozinha" 
                  className="flex-1 px-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all"
                  value={reqInput}
                  onChange={e => setReqInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
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
                  <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-[#00628c]/5 text-[#00628c] font-bold rounded-xl border border-[#00628c]/10">
                    {req}
                    <button type="button" onClick={() => removeRequirement(idx)}>
                      <X className="w-4 h-4 hover:text-red-500 transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Anexo / Arquivo</label>
              <div 
                onClick={() => attachmentInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#bec8d1] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-[#f6f3f2]/30 hover:bg-[#00628c]/5 hover:border-[#00628c] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-[#00628c]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#3e4850] truncate max-w-xs md:max-w-md">
                    {attachmentName || 'Clique para anexar um documento complementar'}
                  </p>
                  <p className="text-xs text-[#6f7881] mt-1">Formatos aceitos: PDF, DOCX, Imagens (Máx. 5MB)</p>
                </div>
                <input 
                  type="file"
                  ref={attachmentInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleAttachmentChange}
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full py-5 bg-[#00628c] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#004c6d] transition-all shadow-xl shadow-[#00628c]/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Anunciar Vaga'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
