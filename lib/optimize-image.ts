export type ImageOptimizePreset = 'profile' | 'logo' | 'testimonial' | 'news';

type OptimizeOptions = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  preserveAlpha: boolean;
};

const PRESET_OPTIONS: Record<ImageOptimizePreset, OptimizeOptions> = {
  profile: { maxWidth: 1200, maxHeight: 1200, quality: 0.82, preserveAlpha: false },
  logo: { maxWidth: 1200, maxHeight: 1200, quality: 0.82, preserveAlpha: true },
  testimonial: { maxWidth: 400, maxHeight: 400, quality: 0.82, preserveAlpha: false },
  news: { maxWidth: 1600, maxHeight: 1600, quality: 0.82, preserveAlpha: false },
};

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Não foi possível ler a imagem.')));
    image.src = src;
  });
}

function canvasHasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const sample = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < sample.length; i += 4) {
    if (sample[i] < 250) return true;
  }
  return false;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Não foi possível compactar a imagem.'));
      },
      type,
      quality
    );
  });
}

export async function optimizeImageFile(
  file: File | Blob,
  preset: ImageOptimizePreset,
  originalName = 'image'
): Promise<File> {
  const options = PRESET_OPTIONS[preset];
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadHtmlImage(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error('Imagem inválida.');
    }

    const scale = Math.min(
      1,
      options.maxWidth / sourceWidth,
      options.maxHeight / sourceHeight
    );
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível processar a imagem.');

    if (!options.preserveAlpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const keepAlpha = options.preserveAlpha && canvasHasTransparency(ctx, targetWidth, targetHeight);
    const webpBlob = await canvasToBlob(canvas, 'image/webp', options.quality);

    if (keepAlpha) {
      const pngBlob = await canvasToBlob(canvas, 'image/png', 1);
      const chosen = pngBlob.size < webpBlob.size ? pngBlob : webpBlob;
      const ext = chosen.type === 'image/png' ? 'png' : 'webp';
      return new File([chosen], replaceExtension(originalName, ext), { type: chosen.type });
    }

    return new File([webpBlob], replaceExtension(originalName, 'webp'), { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function canvasToOptimizedFile(
  canvas: HTMLCanvasElement,
  originalName: string,
  quality = 0.82
): Promise<File> {
  const webpBlob = await canvasToBlob(canvas, 'image/webp', quality);
  return new File([webpBlob], replaceExtension(originalName, 'webp'), { type: 'image/webp' });
}

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${ext}`;
}
