import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PRIMA PTBA - Sistem Pemilihan Mitra',
    short_name: 'PRIMA PTBA',
    description: 'Platform resmi pemilihan mitra PT Bukit Asam Tbk untuk proyek energi baru terbarukan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1B3A5C',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/ptba-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
