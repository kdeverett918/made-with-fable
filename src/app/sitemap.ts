import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: 'hourly', priority: 1 },
    { url: `${siteConfig.url}/makers`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteConfig.url}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const supabase = await createSupabaseServerClient()
  const [creationsRes, profilesRes] = await Promise.all([
    supabase
      .from('creations')
      .select('id, approved_at')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(5000),
    supabase.from('profiles').select('username, updated_at').limit(5000),
  ])

  const creationEntries: MetadataRoute.Sitemap = (creationsRes.data ?? []).map((c) => ({
    url: `${siteConfig.url}/c/${c.id}`,
    lastModified: c.approved_at ? new Date(c.approved_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const profileEntries: MetadataRoute.Sitemap = (profilesRes.data ?? []).map((p) => ({
    url: `${siteConfig.url}/u/${p.username}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticEntries, ...creationEntries, ...profileEntries]
}
