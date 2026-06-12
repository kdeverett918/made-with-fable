import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, changeFrequency: 'hourly', priority: 1 },
    { url: `${siteConfig.url}/about`, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
