'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import JobForm, { type JobFormValues } from '@/app/components/forms/JobForm';

export default function CadastrarVagaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (formData: JobFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from('vagas').insert([
        {
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
          status: 'pending',
        },
      ]);

      if (error) {
        console.error('Erro detalhado do Supabase (Jobs):', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'robinho@correntedobembr.com.br',
            subject: '🔔 Nova Vaga Cadastrada na Corrente do Bem',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #00628c; margin-top: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">🔔 Nova Vaga Recebida!</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">Uma nova vaga de emprego foi submetida no site e está aguardando revisão no Painel Admin.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 12px;">
                  <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Detalhes da Vaga</h3>
                  <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; width: 120px;">Título:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Empresa:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.company}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">E-mail:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.email || 'Não informado'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Telefone:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.phone || 'Não informado'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Local:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.location}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Tipo/Área:</td>
                      <td style="padding: 6px 0; color: #010101;">${formData.type} / ${formData.area}</td>
                    </tr>
                  </table>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://correntedobembr.com.br/admin" style="background-color: #00628c; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Acessar Painel de Moderação</a>
                </div>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.error('Erro ao enviar e-mail de notificação de vaga:', err);
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error('Erro ao cadastrar vaga:', error);
      const errorMsg =
        error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      alert(
        `Erro ao cadastrar vaga: ${errorMsg}\n\nNota: Verifique se a tabela 'jobs' existe no seu Supabase e se as chaves API estão corretas no painel Settings.`
      );
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
            Sua vaga foi enviada e está aguardando aprovação dos nossos administradores. Em breve ela
            estará disponível no portal.
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3e4850] hover:text-[#00628c] font-bold mb-10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para o início
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-[#bec8d1]/10">
          <JobForm
            mode="public"
            showHeader
            isSubmitting={isLoading}
            submitLabel="Anunciar Vaga"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
