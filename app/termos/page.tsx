'use client';

import React from 'react';
import { Navbar } from '@/app/components/Navbar';
import { Scale, CheckCircle, AlertCircle, FileStack, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function TermosPage() {
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
                <Scale className="w-6 h-6 text-[#141f00]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1b1c1c] font-headline">Termos de Uso</h1>
            </div>

            <div className="prose prose-slate max-w-none space-y-6 text-[#3e4850] leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00628c]" /> 1. Aceitação dos Termos
                </h2>
                <p>
                  Ao acessar e utilizar a plataforma Corrente do Bem, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Esta é uma rede baseada na fé no próximo e na ajuda mútua.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <FileStack className="w-5 h-5 text-[#00628c]" /> 2. Uso da Plataforma
                </h2>
                <p>
                  A plataforma destina-se a facilitar a recolocação profissional através da rede de contatos. Os usuários comprometem-se a fornecer informações verídicas e atualizadas em seus currículos e anúncios de vagas.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#00628c]" /> 3. Responsabilidade
                </h2>
                <p>
                  A Corrente do Bem atua como uma ponte de conexão. Não garantimos a contratação nem nos responsabilizamos por acordos diretos feitos entre candidatos e empresas.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00628c]" /> 4. Conduta do Usuário
                </h2>
                <p>
                  É proibido o uso da plataforma para fins comerciais não autorizados, spam, ou compartilhamento de conteúdo que infrinja os direitos de terceiros ou seja ofensivo à nossa comunidade.
                </p>
              </section>

              <section className="pt-8 border-t border-[#f6f3f2]">
                <p className="text-sm italic">
                  Última atualização: 06 de Maio de 2026. <br />
                  Ao continuar usando nosso site, você aceita integralmente estes termos.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
