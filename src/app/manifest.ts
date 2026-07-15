import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Astro AI — Vedic Astrology',
    short_name: 'Astro AI',
    description: 'Personalised Vedic astrology readings powered by AI. Chat or speak with your birth chart.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#d4893c',
    orientation: 'portrait',
    categories: ['lifestyle', 'health', 'education'],
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    screenshots: [
      { src: '/og.png', sizes: '1200x630', type: 'image/png', label: 'Astro AI home screen' },
    ],
  };
}
