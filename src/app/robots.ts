import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/mitra/', '/api/', '/activate', '/verify-email', '/reset-password'],
      },
    ],
    sitemap: 'https://prima.bukitasam.co.id/sitemap.xml',
  };
}
