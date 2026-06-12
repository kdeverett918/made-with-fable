'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const MAX_TAGS = 5

export function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const name = draft
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    setDraft('')
    if (name.length < 2 || name.length > 30) return
    if (tags.includes(name) || tags.length >= MAX_TAGS) return
    onChange([...tags, name])
  }

  return (
    <div className="border-ink bg-surface-raised border-2 p-3">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {tags.length === 0 ? (
          <p className="label-mono text-muted-foreground">No tags pinned yet</p>
        ) : (
          tags.map((tag) => (
            <Badge key={tag} variant="accent" className="bg-background">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="cursor-pointer p-0.5"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </Badge>
          ))
        )}
      </div>
      {tags.length < MAX_TAGS && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commit()
            }
          }}
          onBlur={() => draft && commit()}
          placeholder="Add a tag and press Enter (e.g. threejs, pixel-art)"
          className="bg-background mt-3"
        />
      )}
      <p className="label-mono text-muted-foreground mt-2">
        {MAX_TAGS - tags.length} slot{MAX_TAGS - tags.length === 1 ? '' : 's'} left
      </p>
    </div>
  )
}
