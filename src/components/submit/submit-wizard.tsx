'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Globe, Loader2 } from 'lucide-react'
import { createCreation } from '@/app/actions/creations'
import { MediaUploader } from '@/components/submit/media-uploader'
import { TagInput } from '@/components/submit/tag-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { CATEGORIES } from '@/types/database'
import type { UploadedMedia } from '@/lib/upload'
import { cn } from '@/lib/utils'

const STEPS = ['Details', 'Media', 'Link & prompt', 'Review'] as const

export function SubmitWizard({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [story, setStory] = useState('')
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [liveUrl, setLiveUrl] = useState('')
  const [preview, setPreview] = useState<{ title: string | null; imageUrl: string | null } | null>(
    null,
  )
  const [previewLoading, setPreviewLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const detailsValid = title.trim().length >= 3 && category !== ''
  const hasContent = media.length > 0 || liveUrl.trim() !== ''

  async function fetchPreview() {
    if (!liveUrl) return
    setPreviewLoading(true)
    setPreview(null)
    try {
      const res = await fetch('/api/og-preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: liveUrl }),
      })
      if (res.ok) setPreview(await res.json())
    } finally {
      setPreviewLoading(false)
    }
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createCreation({
        title: title.trim(),
        story: story.trim(),
        prompt: prompt.trim(),
        live_url: liveUrl.trim(),
        category_slug: category,
        tags,
        media: media.map(({ kind, storage_path, poster_path, width, height }) => ({
          kind,
          storage_path,
          poster_path,
          width,
          height,
        })),
      })
      if (result.ok) {
        router.push(`/c/${result.id}?submitted=1`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="mt-8">
      <ol className="flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < step && 'bg-accent text-on-accent cursor-pointer',
                i === step && 'bg-accent/20 text-accent border-accent border',
                i > step && 'bg-surface-raised text-muted-foreground',
              )}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </button>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                i === step ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="bg-border h-px w-4 sm:w-8" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6">
        {step === 0 && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Title</span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you make?"
                maxLength={120}
                autoFocus
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium">Category</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategory(c.slug)}
                    className={cn(
                      'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                      category === c.slug
                        ? 'bg-accent text-on-accent border-accent font-medium'
                        : 'border-border text-muted hover:border-border-strong hover:text-foreground',
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                The story <span className="text-muted-foreground font-normal">(optional)</span>
              </span>
              <Textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="How did you make it? What surprised you?"
                maxLength={5000}
                rows={4}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium">
                Tags <span className="text-muted-foreground font-normal">(optional, up to 5)</span>
              </span>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </>
        )}

        {step === 1 && <MediaUploader userId={userId} items={media} onChange={setMedia} />}

        {step === 2 && (
          <>
            <div>
              <span className="mb-1.5 block text-sm font-medium">
                Live link <span className="text-muted-foreground font-normal">(optional)</span>
              </span>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://your-creation.example.com"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchPreview}
                  disabled={!liveUrl || previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Globe className="h-4 w-4" aria-hidden />
                  )}
                  Preview
                </Button>
              </div>
              {preview && (
                <div className="border-border mt-3 flex items-center gap-3 rounded-lg border p-3">
                  {preview.imageUrl ? (
                    <img src={preview.imageUrl} alt="" className="h-14 w-24 rounded object-cover" />
                  ) : (
                    <Globe className="text-muted h-6 w-6" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{preview.title ?? liveUrl}</p>
                    <p className="text-muted-foreground truncate text-xs">{liveUrl}</p>
                  </div>
                </div>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                The prompt <span className="text-muted-foreground font-normal">(optional)</span>
              </span>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Share the prompt you gave Fable — others can learn from it."
                maxLength={10000}
                rows={6}
                className="font-mono text-xs leading-relaxed"
              />
            </label>
          </>
        )}

        {step === 3 && (
          <div className="border-border space-y-4 rounded-lg border p-5">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Title</p>
              <p className="font-medium">{title}</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Category</p>
                <p className="text-sm">{CATEGORIES.find((c) => c.slug === category)?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Media</p>
                <p className="text-sm">
                  {media.filter((m) => m.kind === 'image').length} image(s)
                  {media.some((m) => m.kind === 'video') && ', 1 video'}
                </p>
              </div>
              {liveUrl && (
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs uppercase">Live link</p>
                  <p className="truncate text-sm">{liveUrl}</p>
                </div>
              )}
            </div>
            {tags.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs uppercase">Tags</p>
                <p className="text-sm">{tags.join(', ')}</p>
              </div>
            )}
            <p className="text-muted border-border border-t pt-4 text-sm">
              Your creation will appear in the gallery once it&apos;s approved — usually within a
              day.
            </p>
          </div>
        )}

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={cn(step === 0 && 'invisible')}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 0 && !detailsValid) || (step === 2 && !hasContent)}
            >
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? <Spinner className="text-on-accent h-4 w-4" /> : null}
              Submit for review
            </Button>
          )}
        </div>
        {step === 2 && !hasContent && (
          <p className="text-muted-foreground text-right text-xs">
            Add at least one image, video, or live link to continue.
          </p>
        )}
      </div>
    </div>
  )
}
