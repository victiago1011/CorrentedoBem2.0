import { NextRequest, NextResponse } from 'next/server';
import {
  insertPublicContent,
  isPublicContentType,
  PublicContentError,
} from '@/lib/public-content';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { type?: unknown; data?: unknown } | null;
    if (!body || !isPublicContentType(body.type)) {
      return jsonError('Tipo de cadastro inválido.', 400);
    }

    await insertPublicContent(body.type, body.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PublicContentError) {
      return jsonError(error.message, error.status);
    }
    console.error('Public content route error:', error);
    return jsonError('Não foi possível enviar o cadastro. Tente novamente.', 500);
  }
}
