'use client';

import React from 'react';
import { Navbar } from '@/app/components/Navbar';
import { Scale, CheckCircle, AlertCircle, FileStack, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { LEGAL_VERSION } from '@/lib/legal';

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
                  <CheckCircle className="w-5 h-5 text-[#00628c]" /> 1. Aceitação
                </h2>
                <p>
                  Ao usar o site, você concorda com estes Termos e com a{' '}
                  <Link href="/privacidade" className="font-bold text-[#00628c] underline underline-offset-2">Política de Privacidade</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">2. Natureza da Corrente do Bem</h2>
                <p>
                  A Corrente do Bem é uma plataforma voluntária de conexão social e profissional. Não intermediamos contratos de trabalho, não somos empregadores dos Talentos e não garantimos entrevista, contratação ou resultado de negócio.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <FileStack className="w-5 h-5 text-[#00628c]" /> 3. Cadastro de Talentos
                </h2>
                <p>
                  Quem cadastra currículo declara ser o titular dos dados (ou ter autorização), que as informações são verdadeiras e que assume responsabilidade pelo conteúdo enviado, inclusive anexos.
                </p>
                <p>
                  O cadastro de Talento passa por análise. Se aprovado, o perfil fica público, incluindo contato e currículo para visualização e download, por até 6 meses após a aprovação, conforme a Política de Privacidade. A publicação pode cessar antes desse prazo por moderação, solicitação do titular ou outros motivos previstos nestes Termos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">4. Cadastro de vagas</h2>
                <p>
                  Quem cadastra vaga declara ter autorização para divulgar a oportunidade e os dados da empresa, e que a vaga é lícita e verdadeira. As vagas seguem a própria validade e o período de publicação da plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">5. Cadastro de negócios</h2>
                <p>
                  Quem cadastra um negócio declara que as informações são verdadeiras, que possui autorização e legitimidade para divulgar o negócio, a oportunidade e os materiais enviados, e que possui direito de disponibilizar logo, imagens e anexos, sem infringir direitos de terceiros.
                </p>
                <p>
                  O cadastro passa por análise. Se aprovado, as informações destinadas à divulgação podem ficar públicas por até 6 meses após a aprovação, conforme a Política de Privacidade. A Corrente do Bem poderá solicitar ajustes, recusar, despublicar ou excluir conteúdo que viole estes Termos, a Política de Privacidade ou a legislação aplicável. A publicação pode cessar antes do prazo por esses motivos. A plataforma não se reserva o direito de alterar livremente o conteúdo enviado pelo usuário.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">6. Depoimentos</h2>
                <p>
                  Quem envia depoimento declara que o relato representa sua experiência ou opinião, que possui direito sobre a foto enviada, quando houver, e que autoriza a publicação após aprovação. O conteúdo poderá ser exibido publicamente enquanto estiver ativo na plataforma, sem prazo automático de expiração, podendo ser retirado pela equipe ou mediante solicitação do titular quando aplicável.
                </p>
                <p>
                  Este envio não implica cessão irrestrita de direitos autorais. A Corrente do Bem utiliza o depoimento para divulgação institucional da iniciativa, nos limites desta autorização.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#00628c]" /> 7. Conduta
                </h2>
                <p>É proibido:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>fraude, spam e golpes;</li>
                  <li>assédio e discriminação ilícita;</li>
                  <li>coleta ou uso abusivo dos dados dos Talentos;</li>
                  <li>uso dos currículos para finalidade incompatível com recolocação ou contato profissional legítimo;</li>
                  <li>conteúdo ofensivo ou ilegal.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">8. Moderação</h2>
                <p>
                  A equipe poderá solicitar ajustes, recusar, despublicar ou excluir conteúdos que violem estes Termos, a Política de Privacidade ou a legislação aplicável.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">9. Responsabilidade das partes</h2>
                <p>
                  Candidatos e empresas negociam entre si. A Corrente do Bem não responde por acordos, pagamentos, condutas de terceiros ou cópias de dados feitas por visitantes após a publicação.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">10. Contato</h2>
                <p>
                  Pedidos relacionados a estes Termos: <Link href="/contato" className="font-bold text-[#00628c] underline underline-offset-2">/contato</Link> ou robinho@correntedobembr.com.br.
                </p>
              </section>

              <section className="pt-8 border-t border-[#f6f3f2]">
                <p className="text-sm italic">
                  Versão {LEGAL_VERSION}.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
