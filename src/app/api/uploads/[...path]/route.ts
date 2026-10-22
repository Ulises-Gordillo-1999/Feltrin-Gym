import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Prevenir Directory Traversal
    const safePath = pathSegments
      .map((seg) => seg.replace(/[^a-zA-Z0-9_.-]/g, ''))
      .filter(Boolean);

    const fullPath = path.resolve(/*turbopackIgnore: true*/ UPLOADS_DIR, ...safePath);

    // Asegurarse de que el archivo resuelto esté dentro de UPLOADS_DIR
    const uploadsRoot = path.resolve(/*turbopackIgnore: true*/ UPLOADS_DIR);
    if (!fullPath.startsWith(uploadsRoot)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fileBuffer = await fs.readFile(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
