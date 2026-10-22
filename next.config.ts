import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /** Build mínimo autocontenido para la imagen Docker de Coolify. */
  output: 'standalone',
  /**
   * Panel 100% autenticado: cada página lee la sesión por request, así que
   * Cache Components no aporta prerender útil y obligaría a envolver todo en
   * <Suspense>. Se deja el renderizado dinámico clásico.
   */
  cacheComponents: false,
  /** sharp usa binarios nativos: no debe empaquetarse. */
  serverExternalPackages: ['sharp'],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      /** Fotos de perfil/productos (se recomprimen a WebP en el servidor). */
      bodySizeLimit: '6mb',
    },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
