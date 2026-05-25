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
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';

export default function NewTestimonial() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Set canvas size to a fixed size (e.g. 400x400) to optimize storage
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

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleApplyCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setPhotoUrl(croppedImage);
        setImageToCrop(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const testimonialData = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      company: formData.get('company') as string,
      content: formData.get('content') as string,
      photo_url: photoUrl,
      status: 'pending'
    };

    try {
      const { error } = await supabase
        .from('testimonials')
        .insert(testimonialData);

      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 5000);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      alert('Erro ao enviar depoimento. Tente novamente mais tarde.');
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
          <h1 className="text-3xl font-extrabold text-[#1b1c1c] mb-4 font-headline">Depoimento Enviado!</h1>
          <p className="text-[#3e4850] mb-8 leading-relaxed">
            Obrigado por compartilhar sua história! Seu depoimento foi enviado para aprovação e em breve aparecerá em nossa comunidade.
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
            <p className="text-center text-[#3e4850] text-sm mt-4">
              Ao enviar, você autoriza o uso do seu depoimento em nosso site.
            </p>
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
