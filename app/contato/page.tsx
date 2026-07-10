'use client';

import React, { useState } from 'react';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { Mail, MessageSquare, Send, ArrowLeft, CheckCircle2, User, Sparkles, Handshake, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function ContatoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: 'Dúvida Geral',
    mensagem: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar e-mail de forma permissiva para aceitar caracteres com acento (Ex: dedé@gmail.com)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('contatos').insert([formData]);
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }
      
      // Enviar notificação de e-mail ao administrador (falha não impede o sucesso do formulário)
      try {
        const enviadoEm = new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'robinho@correntedobembr.com.br',
            replyTo: formData.email,
            subject: `Novo contato pelo site — ${formData.assunto}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #00628c; margin-top: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Novo contato pelo site</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">Uma nova mensagem foi enviada pelo formulário de contato.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 12px;">
                  <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; width: 120px;">Nome:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.nome}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">E-mail:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Assunto:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.assunto}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Mensagem:</td>
                      <td style="padding: 6px 0; color: #010101; white-space: pre-wrap;">${formData.mensagem}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Data e hora:</td>
                      <td style="padding: 6px 0; color: #010101;">${enviadoEm}</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                  Para responder ao visitante, basta clicar em &ldquo;Responder&rdquo;. A resposta será enviada diretamente para o e-mail informado no formulário.
                </p>

                <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                  Esta mensagem foi enviada através do formulário de contato do site Corrente do Bem.
                </p>
              </div>
            `
          })
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json().catch(() => null);
          console.error('Erro ao enviar e-mail de notificação de contato:', emailError || emailResponse.statusText);
        }
      } catch (err) {
        console.error('Erro ao enviar e-mail de notificação de contato:', err);
      }
      
      setIsSuccess(true);
      setFormData({ nome: '', email: '', assunto: 'Dúvida Geral', mensagem: '' });
    } catch (err: any) {
      console.error('Erro ao enviar contato:', err);
      const msg = err?.message || 'Erro desconhecido';
      alert(`Ocorreu um erro ao enviar sua mensagem: ${msg}. Por favor, verifique se a tabela 'contatos' existe no Supabase.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcf9f8]">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[#00628c] font-bold mb-8 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Voltar para o Início
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Info Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 lg:pr-12"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[#00628c]"></div>
                  <span className="text-[#00628c] font-black uppercase tracking-widest text-xs">Fale Conosco</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-[#1b1c1c] font-headline leading-tight">
                  Como podemos <br />
                  <span className="text-[#00628c]">ajudar você?</span>
                </h1>
                <p className="mt-6 text-[#3e4850] text-lg leading-relaxed italic">
                   &quot;Nossa rede é baseada na conexão humana. Se você tem uma dúvida, sugestão ou apenas quer fazer parte desta corrente, estamos aqui para ouvir.&quot;
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-[#bec8d1]/10 text-[#00628c] group-hover:bg-[#00628c] group-hover:text-white transition-all duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[#6f7881] mb-1">E-mail Direto</div>
                    <div className="text-lg font-bold text-[#1b1c1c]">robinho@correntedobembr.com.br</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#bff444] rounded-2xl flex items-center justify-center shadow-lg text-[#141f00]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[#6f7881] mb-1">Rede Global</div>
                    <div className="text-lg font-bold text-[#1b1c1c]">Mais de 4.000 amigos</div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#00628c] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-xl font-bold mb-2 relative z-10">Dica Amiga</h3>
                <p className="text-white/80 text-sm leading-relaxed relative z-10">
                  Somos um projeto voluntário. Respondemos a todas as mensagens com carinho e o mais rápido possível para ajudar em sua jornada.
                </p>
              </div>
            </motion.div>

            {/* Form Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[3rem] shadow-2xl shadow-[#00628c]/10 border border-[#bec8d1]/10 p-8 md:p-12 relative"
            >
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-[#bff444] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#bff444]/20 animate-bounce">
                      <CheckCircle2 className="w-10 h-10 text-[#141f00]" />
                    </div>
                    <h2 className="text-3xl font-black text-[#1b1c1c] font-headline mb-4">Mensagem Enviada!</h2>
                    <p className="text-[#3e4850] mb-8">
                      Obrigado por entrar em contato. <br />Recebemos sua mensagem e retornaremos em breve.
                    </p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="px-8 py-4 bg-[#00628c] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#005275] transition-all shadow-lg"
                    >
                      Enviar Nova Mensagem
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-[#6f7881] ml-1">Seu Nome</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#bec8d1]" />
                          <input 
                            required
                            type="text"
                            placeholder="Ex: Albert Einstein"
                            className="w-full pl-12 pr-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c] outline-none transition-all font-bold text-[#1b1c1c]"
                            value={formData.nome}
                            onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-[#6f7881] ml-1">Seu E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#bec8d1]" />
                          <input 
                            required
                            type="text"
                            placeholder="exemplo@gmail.com"
                            className="w-full pl-12 pr-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c] outline-none transition-all font-bold text-[#1b1c1c]"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#6f7881] ml-1">Assunto</label>
                      <select 
                        className="w-full px-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c] outline-none transition-all font-bold text-[#1b1c1c] appearance-none"
                        value={formData.assunto}
                        onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                      >
                        <option>Dúvida Geral</option>
                        <option>Sugestão para a Corrente</option>
                        <option>Quero me tornar Ativo</option>
                        <option>Problemas com o site</option>
                        <option>Outros</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[#6f7881] ml-1">Sua Mensagem</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-5 w-5 h-5 text-[#bec8d1]" />
                        <textarea 
                          required
                          rows={5}
                          placeholder="Fique à vontade para escrever..."
                          className="w-full pl-12 pr-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:ring-2 focus:ring-[#00628c] outline-none transition-all font-bold text-[#1b1c1c] resize-none"
                          value={formData.mensagem}
                          onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                        ></textarea>
                      </div>
                    </div>

                    <button 
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full py-5 bg-[#00628c] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#005275] transition-all shadow-xl shadow-[#00628c]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>Aguarde...</>
                      ) : (
                        <>
                          Enviar Mensagem <Send className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    
                    <p className="text-center text-[#6f7881] text-xs px-8">
                      Ao enviar, você concorda com nossa Política de Privacidade. Prometemos não fazer spam.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
