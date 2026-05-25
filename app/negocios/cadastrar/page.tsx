'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  AlignLeft, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Link as LinkIcon,
  Users,
  Handshake,
  DollarSign,
  Trophy,
  Award,
  Upload,
  FileText,
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

export default function CadastrarNegocioPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    owner_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    location: '',
    link: '',
    type: 'Parceria',
    area: 'Serviços',
    description: '',
    attachment_url: '',
    logo_url: ''
  });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('negocios')
        .insert([{
          title: formData.title,
          owner_name: formData.owner_name,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          location: formData.location || null,
          link: formData.link || null,
          type: formData.type || null,
          area: formData.area || null,
          description: formData.description || null,
          attachment_url: formData.attachment_url || null,
          logo_url: formData.logo_url || null,
          status: 'pending'
        }]);

      if (error) {
        console.error('Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`${error.message} (${error.hint || 'Sem dicas adicionais'})`);
      }
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Erro ao cadastrar negócio:', error);
      const msg = error.message || 'Erro desconhecido';
      alert(`Erro no Supabase: ${msg}\n\nVerifique se o SQL foi executado corretamente.`);
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
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-100/20">
            <CheckCircle2 className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#00628c] mb-4 font-headline">Oportunidade Enviada!</h2>
          <p className="text-[#3e4850] mb-10 leading-relaxed">
            Sua oportunidade de negócio foi enviada e está aguardando aprovação. Em breve ela estará disponível na galeria de negócios.
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
            <h1 className="text-4xl font-extrabold text-[#00628c] font-headline mb-4">Divulgar Negócio</h1>
            <p className="text-[#3e4850]">Compartilhe sua oportunidade de negócio, parceria ou investimento.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Upload Section */}
            <div className="flex flex-col items-center mb-10">
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] mb-4">Logo do Negócio</label>
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
              <p className="text-[10px] text-[#6f7881] mt-3 font-medium italic">Opcional: Uma logo ajuda a destacar seu negócio.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Título da Oportunidade *</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Expansão de Franquia" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Nome do Negócio / Empresa *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Café Bela Vista" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.owner_name}
                    onChange={e => setFormData({...formData, owner_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Nome do Responsável *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    required
                    type="text" 
                    placeholder="Seu nome completo" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.contact_name}
                    onChange={e => setFormData({...formData, contact_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Email de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="email" 
                    placeholder="contato@exemplo.com" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.contact_email}
                    onChange={e => setFormData({...formData, contact_email: e.target.value})}
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
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.contact_phone}
                    onChange={e => setFormData({...formData, contact_phone: maskPhone(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Link (Site, Redes Sociais, etc)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7881]" />
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c] font-bold"
                    value={formData.link}
                    onChange={e => setFormData({...formData, link: e.target.value})}
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
                    className="w-full pl-12 pr-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 transition-all text-[#1b1c1c]"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Tipo de Oportunidade</label>
                <select 
                  className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c] appearance-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option>Sócio</option>
                  <option>Investimento</option>
                  <option>Parceria</option>
                  <option>Patrocínio</option>
                  <option>Venda</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Área / Categoria</label>
                <select 
                  className="w-full px-4 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c]/40 font-bold text-[#1b1c1c] appearance-none"
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                >
                  <option>Comércio</option>
                  <option>Tecnologia</option>
                  <option>Serviços</option>
                  <option>Franquias</option>
                  <option>Esportes</option>
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
                  placeholder="Descreva o que sua empresa faz, o que está buscando e quais os benefícios da parceria..."
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
              <label className="text-xs font-black uppercase tracking-widest text-[#3e4850] ml-1">Anexo / Arquivo (Opcional)</label>
              <div 
                onClick={() => attachmentInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#bec8d1] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-[#f6f3f2]/30 hover:bg-[#00628c]/5 hover:border-[#00628c] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-[#00628c]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#3e4850] truncate max-w-xs md:max-w-md">
                    {attachmentName || 'Clique para anexar um documento ou imagem'}
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
                  Enviando...
                </>
              ) : (
                'Divulgar Oportunidade'
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
                Você revisou as informações e deseja realmente publicar sua oportunidade de negócio?
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
                  className="py-4 px-6 bg-[#fc820c] text-white font-bold rounded-2xl hover:bg-[#e6760b] transition-all shadow-lg shadow-[#fc820c]/20"
                >
                  Sim, Publicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
