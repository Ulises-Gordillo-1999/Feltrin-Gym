import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

/**
 * Procesa un archivo o buffer de imagen, lo comprime a WebP y lo guarda en el almacenamiento persistente.
 * Retorna la URL relativa para servir mediante /api/uploads/...
 */
export async function saveOptimizedWebP(
  input: Buffer | Uint8Array | ArrayBuffer,
  folder: 'avatars' | 'products' | 'receipts',
  options?: { maxWidth?: number; maxHeight?: number; quality?: number },
): Promise<string> {
  const targetDir = path.resolve(UPLOADS_DIR, folder);
  await fs.mkdir(targetDir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.webp`;
  const filePath = path.join(targetDir, filename);

  let buffer: Buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (input instanceof Uint8Array) {
    buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  } else {
    buffer = Buffer.from(input);
  }

  await sharp(buffer)
    .rotate() // Auto-orientación según metadata EXIF
    .resize(options?.maxWidth ?? 1200, options?.maxHeight ?? 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: options?.quality ?? 82 })
    .toFile(filePath);

  return `/api/uploads/${folder}/${filename}`;
}

/**
 * Elimina una imagen del almacenamiento si existe.
 */
export async function deleteUploadedImage(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith('/api/uploads/')) return;
  try {
    const relativePart = url.replace('/api/uploads/', '');
    const cleanPath = path.normalize(relativePart).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(UPLOADS_DIR, cleanPath);
    await fs.unlink(fullPath);
  } catch {
    // Si no existe o falla, continuar en silencio
  }
}
