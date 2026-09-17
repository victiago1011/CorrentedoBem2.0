'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Quote, 
  Camera,
  CheckCircle2,
  Briefcase,
  Building2,
  X,
  Plus,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { LEGAL_VERSION } from '@/lib/legal';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { canvasToOptimizedFile } from '@/lib/optimize-image';
import {
  IMAGE_MIME_TYPES,
  UPLOAD_CATEGORY_IDS,
  UPLOAD_LIMITS,
} from '@/lib/storage-config';
import { removeUploaded, uploadPublicImage, type StorageObjectRef } from '@/lib/storage-upload';

export default function NewTestimonial() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentError, setConsentError] = useState('');
  
  // Cropper states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<File> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível recortar a imagem.');
    }

    canvas.width = 400;
    canvas.height = 400;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      400,
      400
    );

    return canvasToOptimizedFile(canvas, 'depoimento.webp', 0.82);
  };

  const handleApplyCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (photoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photoUrl);
        }
        setPhotoFile(croppedImage);
        setPhotoUrl(URL.createObjectURL(croppedImage));
        setImageToCrop(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = (file.type || '').toLowerCase();
    if (!IMAGE_MIME_TYPES.includes(mime as (typeof IMAGE_MIME_TYPES)[number])) {
      alert('Envie uma imagem em JPEG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > UPLOAD_LIMITS.testimonialImageBytes) {
      alert('A foto deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!termsAccepted) {
      setConsentError('Para enviar, é necessário marcar a confirmação abaixo.');
      return;
    }

    setConsentError('');
    setIsSubmitting(true);
    const uploaded: StorageObjectRef[] = [];

    const formData = new FormData(e.currentTarget);
    const acceptedAt = new Date().toISOString();

    try {
      let storedPhoto = '';
      if (photoFile) {
        const photoRef = await uploadPublicImage({
          category: UPLOAD_CATEGORY_IDS.testimonialPhoto,
          file: photoFile,
          originalName: photoFile.name,
        });
        uploaded.push(photoRef);
        storedPhoto = photoRef.publicUrl || photoRef.path;
      }

      const testimonialData = {
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        company: formData.get('company') as string,
        email: formData.get('email') as string || null,
        content: formData.get('content') as string,
        photo_url: storedPhoto,
        status: 'pending',
        terms_accepted: true,
        terms_accepted_at: acceptedAt,
        terms_version: LEGAL_VERSION,
        privacy_consent: true,
        privacy_consent_at: acceptedAt,
        privacy_policy_version: LEGAL_VERSION,
      };

      const { error } = await supabase
        .from('testimonials')
        .insert(testimonialData);

      if (error) throw error;

      // Enviar notificação de e-mail ao administrador
      try {
        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_testimonial',
            fields: {
              name: testimonialData.name,
              role: testimonialData.role,
              company: testimonialData.company,
              email: testimonialData.email,
              content: testimonialData.content,
            },
          }),
        });
      } catch (err) {
        console.error('Erro ao enviar e-mail de notificação de depoimento:', err);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 5000);
    } catch (error: unknown) {
      await removeUploaded(uploaded);
      const supabaseError = error as {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
      };

      console.error('Erro detalhado do Supabase (Depoimentos):', {
        message: supabaseError?.message ?? null,
        code: supabaseError?.code ?? null,
        details: supabaseError?.details ?? null,
        hint: supabaseError?.hint ?? null,
      });

      const errorCode =
        typeof supabaseError?.code === 'string' && supabaseError.code.trim()
          ? supabaseError.code.trim()
          : null;

      alert(
        errorCode
          ? `Não foi possível enviar o depoimento. Tente novamente. Código: ${errorCode}`
          : 'Não foi possível enviar o depoimento. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f3f2] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1b1c1c] mb-4 font-headline">Depoimento enviado com sucesso</h1>
          <p className="text-[#3e4850] mb-8 leading-relaxed">
            Recebemos seu depoimento. Ele passará por uma moderação para publicação e, quando estiver disponível no site, você receberá uma notificação por e-mail.
          </p>
          <Link href="/" className="inline-block bg-[#00628c] text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
            Voltar para o Início
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3f2]">
      {/* Header */}
      <header className="bg-white border-b border-[#bec8d1]/20 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/depoimentos" className="flex items-center gap-2 text-[#00628c] font-bold hover:underline">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Quote className="w-6 h-6 text-[#fc820c]" />
            <h1 className="text-xl font-bold font-headline">Escrever Depoimento</h1>
          </div>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 lg:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1b1c1c] mb-4 font-headline">Sua voz é importante</h2>
          <p className="text-[#3e4850] text-lg lg:max-w-xl mx-auto leading-relaxed">
            Compartilhe como a Corrente do Bem impactou sua vida ou empresa. Sua história inspira outros a fazerem parte dessa rede.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-xl border border-[#bec8d1]/10 space-y-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#f6f3f2] border-4 border-[#00628c]/10 flex items-center justify-center relative">
                {photoUrl ? (
                  <Image src={photoUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <User className="w-16 h-16 text-[#bec8d1]" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-[#bec8d1]/20">
                <Camera className="w-5 h-5 text-[#00628c]" />
              </div>
            </div>
            <p className="text-sm font-semibold text-[#00628c]">Adicionar sua foto (opcional)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
                <User className="w-4 h-4 text-[#00628c]" />
                Nome e Sobrenome
              </label>
              <input 
                name="name" 
                required 
                className="w-full px-6 py-4 rounded-2xl bg-[#f6f3f2] border-none focus:ring-2 focus:ring-[#00628c]/40 outline-none transition-all font-medium" 
                placeholder="Como quer ser chamado?" 
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-[#00628c]" />
                Cargo <span className="text-[#bec8d1] font-normal normal-case ml-1">(Opcional)</span>
              </label>
              <input 
                name="role" 
                className="w-full px-6 py-4 rounded-2xl bg-[#f6f3f2] border-none focus:ring-2 focus:ring-[#00628c]/40 outline-none transition-all font-medium" 
                placeholder="Ex: Supervisor, Designer..." 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#00628c]" />
                Empresa <span className="text-[#bec8d1] font-normal normal-case ml-1">(Opcional)</span>
              </label>
              <input 
                name="company" 
                className="w-full px-6 py-4 rounded-2xl bg-[#f6f3f2] border-none focus:ring-2 focus:ring-[#00628c]/40 outline-none transition-all font-medium" 
                placeholder="Nome da sua empresa" 
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
                <span className="text-[#00628c] font-black mr-0.5">@</span>
                E-mail de Contato <span className="text-[#bec8d1] font-normal normal-case ml-1">(Opcional)</span>
              </label>
              <input 
                name="email" 
                type="email"
                className="w-full px-6 py-4 rounded-2xl bg-[#f6f3f2] border-none focus:ring-2 focus:ring-[#00628c]/40 outline-none transition-all font-medium" 
                placeholder="Ex: seu@email.com" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
              <Quote className="w-4 h-4 text-[#00628c]" />
              Seu Depoimento
            </label>
            <textarea 
              name="content" 
              required 
              rows={6} 
              className="w-full px-6 py-6 rounded-3xl bg-[#f6f3f2] border-none focus:ring-2 focus:ring-[#00628c]/40 outline-none transition-all font-medium resize-none" 
              placeholder="Conte sua experiência com a plataforma..."
            />
          </div>

          <div className="rounded-2xl border border-[#00628c]/15 bg-[#00628c]/5 p-5 space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#00628c]">Seu depoimento poderá aparecer publicamente</h2>
            <p className="text-sm text-[#3e4850] leading-relaxed">
              Após aprovação, seu nome, foto (se enviada), cargo, empresa e o texto do depoimento poderão ser publicados na Corrente do Bem. O e-mail, se informado, é usado internamente para contato e não é exibido na página pública.
            </p>
          </div>

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
              e com a{' '}
              <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-bold text-[#00628c] underline underline-offset-2">
                Política de Privacidade
              </Link>{' '}
              e autorizo a publicação do meu nome, foto, informações profissionais e depoimento na Corrente do Bem.
            </span>
          </label>

          {consentError && (
            <p className="text-sm font-bold text-red-600">{consentError}</p>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-gradient-to-r from-[#00628c] to-[#007cb0] text-white rounded-2xl font-bold shadow-xl shadow-[#00628c]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Enviando...' : (
                <>
                  <Send className="w-6 h-6" />
                  Enviar Depoimento
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Cropper Modal */}
      <AnimatePresence>
        {imageToCrop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900">Ajustar Foto</h3>
                <button 
                  onClick={() => setImageToCrop(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="relative h-[400px] w-full bg-gray-900">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <Minus className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#00628c]"
                  />
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setImageToCrop(null)}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleApplyCrop}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold bg-[#00628c] text-white hover:scale-[1.02] transition-all shadow-lg shadow-[#00628c]/20"
                  >
                    Aplicar Foto
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
