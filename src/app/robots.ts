import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/privacy', '/terms', '/cancellation'],
        disallow: ['/chat', '/voice', '/profile', '/chart', '/sign-in', '/sign-up', '/api/'],
      },
    ],
    sitemap: 'https://astro.daranchoudhary.dev/sitemap.xml',
    host: 'https://astro.daranchoudhary.dev',
  };
}
