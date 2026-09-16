'use client';

import React from 'react';
import { Navbar } from '@/app/components/Navbar';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { LEGAL_VERSION } from '@/lib/legal';

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
              <p>
                Esta Política descreve como a Corrente do Bem trata dados pessoais no site correntedobembr.com.br.
              </p>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#00628c]" /> 1. Quem somos
                </h2>
                <p>
                  A Corrente do Bem é uma iniciativa de impacto social que conecta pessoas, vagas, talentos e negócios com propósito. Não somos uma agência de emprego nem garantimos contratação. Atuamos como ponte, com moderação humana.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#00628c]" /> 2. Dados tratados
                </h2>
                <p>Conforme o uso da plataforma, podemos tratar:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>identificação e contato (nome, e-mail, telefone);</li>
                  <li>dados profissionais (área, cargo, resumo, habilidades, currículo);</li>
                  <li>localização informada;</li>
                  <li>dados de vagas e negócios (empresa, descrição, anexos, logo);</li>
                  <li>depoimentos (nome, foto, cargo, empresa e texto; e-mail, quando informado, para uso interno);</li>
                  <li>e-mails de comunicações/newsletter, quando a pessoa é inscrita pela operação da equipe;</li>
                  <li>mensagens enviadas pelo formulário de contato, processadas para atendimento;</li>
                  <li>dados técnicos básicos de visita (analytics de páginas), quando aplicável.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">3. Talentos</h2>
                <p>
                  O cadastro é voluntário. Após análise da equipe, o perfil pode ser publicado na Galeria. Ficam públicos, se aprovados: nome; foto (se enviada); cidade/localização; área; cargo/função; resumo; habilidades; e-mail; telefone; currículo/PDF completo para visualização e download.
                </p>
                <p>
                  Perfis aprovados podem permanecer publicados por até 6 meses após a aprovação. A Corrente do Bem pode despublicar antes desse prazo por moderação, por solicitação do titular ou por outros motivos previstos nos Termos de Uso. Não há garantia de que o perfil permanecerá visível durante todo o período.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">4. Vagas</h2>
                <p>
                  Empresas e pessoas autorizadas podem cadastrar oportunidades. Após aprovação, a vaga e os contatos informados podem ficar públicos. As vagas seguem a própria validade e o período de publicação da plataforma, e não se aplica a elas o prazo de 6 meses previsto para Talentos e Negócios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">5. Negócios</h2>
                <p>
                  O cadastro é voluntário e passa por moderação humana. Não há publicação automática. Quem cadastra declara que as informações são verdadeiras e que possui legitimidade e autorização para divulgar o negócio, a oportunidade e os materiais enviados.
                </p>
                <p>
                  Se aprovado, o negócio pode ser exibido publicamente por até 6 meses após a aprovação. Podem ficar públicos, quando informados: título da oportunidade; nome do negócio/empresa; localização; tipo; área; descrição; site/redes; logo; e-mail; telefone/WhatsApp; e arquivos enviados para divulgação. O nome do responsável é tratado internamente pela equipe e não é exibido na página pública.
                </p>
                <p>
                  A Corrente do Bem pode despublicar antes desse prazo por moderação, por solicitação do titular ou por outros motivos previstos nos Termos de Uso. Não há garantia de que o conteúdo permanecerá visível durante todo o período.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">6. Depoimentos</h2>
                <p>
                  O envio de depoimento é voluntário e passa por moderação. Se aprovado, podem ficar públicos: nome, foto (quando enviada), cargo, empresa e o texto do depoimento. O e-mail, quando coletado, é utilizado internamente para contato e notificações e não é publicado.
                </p>
                <p>
                  Depoimentos não possuem prazo automático de expiração e podem permanecer publicados enquanto estiverem ativos na plataforma, sem prejuízo da possibilidade de retirada pela equipe ou mediante solicitação do titular, pelos canais indicados nesta Política.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">7. Newsletter</h2>
                <p>
                  A lista de comunicações é operada pela equipe da Corrente do Bem. Quando alguém é inscrito, o e-mail e, se informado, o nome são usados para envio de campanhas e novidades. Campanhas podem registrar métricas de clique quando o link da mensagem utiliza rastreamento. O descadastro pode ser feito pelo link disponível na própria mensagem.
                </p>
                <p>
                  Hoje não há formulário público de inscrição no site. A inscrição ocorre pelos fluxos operacionais da equipe.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">8. Formulário de contato</h2>
                <p>
                  As informações enviadas pelo formulário de contato (nome, e-mail, assunto e mensagem) são utilizadas para receber, analisar e responder à solicitação. No fluxo atual do site, a mensagem é encaminhada por e-mail à equipe, usando o endereço informado para resposta.
                </p>
                <p>
                  Dependendo do fluxo operacional utilizado ao longo do tempo, essas informações podem ser processadas pelos serviços de e-mail e/ou mantidas nos sistemas da Corrente do Bem pelo período necessário ao atendimento. Há registros históricos de contatos em sistemas internos; o formulário público vigente não alimenta uma caixa de entrada de mensagens no painel administrativo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">9. Finalidades</h2>
                <p>Utilizamos os dados para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>viabilizar a conexão entre talentos, empresas e a comunidade;</li>
                  <li>moderar conteúdo;</li>
                  <li>operar o site;</li>
                  <li>enviar comunicações solicitadas;</li>
                  <li>cumprir deveres legais quando existirem.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00628c]" /> 10. Publicação pública dos Talentos
                </h2>
                <p>
                  Ao autorizar no cadastro de Talento, a pessoa concorda que, após aprovação, nome, foto, localização, e-mail, telefone, informações profissionais e o currículo completo ficam acessíveis na internet. Terceiros podem visualizar, baixar, armazenar, compartilhar e manter cópias. A Corrente do Bem pode remover as informações dos seus próprios sistemas quando cabível, mas não consegue garantir a exclusão de cópias feitas por terceiros nem de conteúdos já indexados ou em cache fora do seu controle.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">11. Moderação</h2>
                <p>
                  Cadastros entram como pendentes e só são publicados após análise. A equipe poderá recusar, despublicar ou excluir conteúdos que violem os Termos, esta Política ou a legislação aplicável.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">12. Permanência da publicação</h2>
                <p>
                  Talentos e Negócios aprovados podem permanecer públicos por até 6 meses após a aprovação, podendo ser despublicados antes por moderação, solicitação do titular ou outros motivos previstos nos Termos. Vagas seguem a própria validade da plataforma. Depoimentos aprovados podem permanecer publicados enquanto estiverem ativos, sem prazo automático de expiração, também sujeitos a retirada pela equipe ou mediante solicitação do titular quando aplicável.
                </p>
                <p>
                  Pedidos de retirada são feitos pelos canais abaixo. A remoção nos sistemas da Corrente do Bem não garante a exclusão de cópias já obtidas por terceiros nem de conteúdos indexados ou em cache fora do seu controle.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">13. Direitos do titular</h2>
                <p>
                  O titular pode solicitar confirmação de tratamento, correção, atualização, despublicação ou exclusão, e revogar o consentimento para tratamentos futuros baseados nesse fundamento, na medida aplicável.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">14. Correção, exclusão e revogação</h2>
                <p>
                  Pedidos: formulário em <Link href="/contato" className="font-bold text-[#00628c] underline underline-offset-2">/contato</Link> ou e-mail robinho@correntedobembr.com.br, identificando-se e descrevendo o pedido. A revogação não apaga cópias já obtidas por terceiros enquanto o conteúdo esteve público.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">15. Prestadores tecnológicos</h2>
                <p>
                  Hospedagem e banco (Supabase/PostgreSQL); hospedagem do site (Vercel); e-mails (Resend); DNS (Cloudflare), conforme a operação atual.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#00628c]" /> 16. Segurança
                </h2>
                <p>
                  Adotamos medidas compatíveis com o porte da iniciativa (acesso administrativo autenticado, HTTPS, moderação). Nenhum sistema é isento de risco.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#1b1c1c]">17. Atualizações</h2>
                <p>
                  Esta Política pode ser alterada. A versão vigente será a publicada nesta página, com a data de atualização.
                </p>
              </section>

              <section className="pt-8 border-t border-[#f6f3f2]">
                <p className="text-sm italic">
                  Versão {LEGAL_VERSION}. <br />
                  Dúvidas: <Link href="/contato" className="font-bold text-[#00628c] not-italic">formulário de contato</Link> ou robinho@correntedobembr.com.br.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
