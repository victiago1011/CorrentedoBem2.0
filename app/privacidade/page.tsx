'use client';

import React from 'react';
import { Navbar } from '@/app/components/Navbar';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#fcf9f8]">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[#00628c] font-bold mb-8 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Voltar para o Início
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-[#00628c]/5 border border-[#bec8d1]/10 p-8 md:p-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#bff444] rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#141f00]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1b1c1c] font-headline">Política de Privacidade</h1>
            </div>

            <div className="prose prose-slate max-w-none space-y-6 text-[#3e4850] leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#00628c]" /> 1. Introdução
                </h2>
                <p>
                  A Corrente do Bem valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos as informações fornecidas por candidatos, empresas e parceiros que utilizam nossa plataforma de recolocação benéfica.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#00628c]" /> 2. Coleta de Informações
                </h2>
                <p>Coletamos informações necessárias para facilitar a sua jornada profissional, incluindo:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Dados cadastrais (Nome, e-mail, telefone);</li>
                  <li>Informações profissionais (currículo, experiências, habilidades);</li>
                  <li>Dados de localização para vagas pertinentes à sua região.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00628c]" /> 3. Uso dos Dados
                </h2>
                <p>
                  Seus dados são utilizados exclusivamente para:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Apresentar seu perfil para empresas parceiras;</li>
                  <li>Notificar você sobre novas oportunidades de emprego;</li>
                  <li>Manter a segurança e integridade da nossa rede de amizades profissional.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#00628c]" /> 4. Proteção de Dados
                </h2>
                <p>
                  Implementamos medidas técnicas e organizacionais de segurança para proteger seus dados contra acessos não autorizados ou uso indevido. Seus dados nunca são vendidos a terceiros.
                </p>
              </section>

              <section className="pt-8 border-t border-[#f6f3f2]">
                <p className="text-sm italic">
                  Última atualização: 06 de Maio de 2026. <br />
                  Dúvidas sobre sua privacidade? Entre em contato conosco.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
