export type CreationStatus = 'pending' | 'approved' | 'rejected'
export type MediaKind = 'image' | 'video'
export type ReportReason = 'spam' | 'inappropriate' | 'not_fable' | 'other'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  slug: string
  name: string
  sort_order: number
}

export interface Creation {
  id: string
  author_id: string
  title: string
  story: string | null
  prompt: string | null
  live_url: string | null
  og_image_path: string | null
  og_title: string | null
  og_image_width: number | null
  og_image_height: number | null
  category_id: number
  status: CreationStatus
  rejection_reason: string | null
  like_count: number
  comment_count: number
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface CreationMedia {
  id: string
  creation_id: string
  kind: MediaKind
  storage_path: string
  poster_path: string | null
  width: number
  height: number
  position: number
  created_at: string
}

export interface Comment {
  id: string
  creation_id: string
  author_id: string
  body: string
  created_at: string
}

export interface Report {
  id: string
  creation_id: string
  reporter_id: string | null
  reason: ReportReason
  detail: string | null
  status: 'open' | 'resolved'
  created_at: string
}

/** Row shape returned by the feed_page RPC. */
export interface FeedItem {
  id: string
  title: string
  live_url: string | null
  og_image_path: string | null
  og_title: string | null
  og_image_width: number | null
  og_image_height: number | null
  prompt_excerpt: string | null
  category_slug: string
  like_count: number
  comment_count: number
  approved_at: string
  author_username: string
  author_display_name: string | null
  author_avatar_url: string | null
  media_kind: MediaKind | null
  media_path: string | null
  media_poster_path: string | null
  media_width: number | null
  media_height: number | null
}

export const CATEGORIES = [
  { slug: 'websites', name: 'Websites' },
  { slug: 'games', name: 'Games' },
  { slug: 'art', name: 'Art' },
  { slug: 'tools', name: 'Tools' },
  { slug: 'agents', name: 'Agents' },
  { slug: 'writing', name: 'Writing' },
  { slug: 'music', name: 'Music' },
  { slug: 'other', name: 'Other' },
] as const
