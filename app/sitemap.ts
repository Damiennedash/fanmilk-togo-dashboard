import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://dashboard.fanmilk.tg',
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://dashboard.fanmilk.tg/connexion',
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
}
