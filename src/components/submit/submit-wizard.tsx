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

const STEPS = ['Project', 'Media', 'URL & prompt', 'Review'] as const

export function SubmitWizard({ userId }: { userId: string | null }) {
  const router = useRouter()
  const isGuest = !userId
  const folder = userId ?? 'guest'
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  const [guestName, setGuestName] = useState('')
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

  const detailsValid =
    title.trim().length >= 3 && category !== '' && (!isGuest || guestName.trim().length >= 2)
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
        guest_name: isGuest ? guestName.trim() : '',
        media: media.map(({ kind, storage_path, poster_path, width, height }) => ({
          kind,
          storage_path,
          poster_path,
          width,
          height,
        })),
      })
      if (result.ok) {
        // signed-in makers can view their own pending project; guests can't (RLS),
        // so they get an inline confirmation instead of a redirect
        if (isGuest) {
          setSubmitted(true)
        } else {
          router.push(`/c/${result.id}?submitted=1`)
        }
      } else {
        setError(result.error)
      }
    })
  }

  const currentStep = STEPS[step]

  if (submitted) {
    return (
      <section className="border-ink bg-background mt-10 border-2 shadow-[6px_6px_0_0_var(--color-ink)]">
        <div className="border-ink border-b-2 p-6 sm:p-8">
          <p className="label-mono text-accent font-bold">Submission received</p>
          <h2 className="font-display mt-2 text-5xl leading-[0.9] uppercase sm:text-6xl">
            Thanks — it&rsquo;s in the queue.
          </h2>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          <p className="text-muted max-w-xl leading-relaxed">
            <span className="text-ink font-bold">{title.trim()}</span> was sent for review. Once
            it&rsquo;s approved it pins to the public board, credited to{' '}
            <span className="text-ink font-bold">{guestName.trim()}</span>.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => router.push('/')}>
              Back to the board
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSubmitted(false)
                setStep(0)
                setTitle('')
                setCategory('')
                setStory('')
                setMedia([])
                setLiveUrl('')
                setPreview(null)
                setPrompt('')
                setTags([])
                setError(null)
              }}
            >
              Submit another
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-ink bg-background border-2 lg:sticky lg:top-24 lg:self-start">
        <div className="border-ink border-b-2 p-4">
          <p className="label-mono text-muted-foreground">Progress</p>
          <p className="font-display mt-2 text-5xl leading-none">
            {String(step + 1).padStart(2, '0')}/{String(STEPS.length).padStart(2, '0')}
          </p>
        </div>
        <ol className="divide-ink divide-y-2" aria-label="Submission progress">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  i < step && 'text-muted hover:bg-ink hover:text-background cursor-pointer',
                  i === step && 'bg-ink text-background',
                  i > step && 'text-muted-foreground cursor-not-allowed',
                )}
                aria-current={i === step ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'label-mono flex h-8 w-8 shrink-0 items-center justify-center border-2 font-bold',
                    i === step
                      ? 'border-background text-background'
                      : 'border-ink text-ink group-hover:border-background group-hover:text-background',
                  )}
                >
                  {i < step ? <Check className="text-accent h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span className="label-mono font-bold">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <div className="border-ink bg-background border-2 shadow-[6px_6px_0_0_var(--color-ink)]">
        <div className="border-ink grid grid-cols-[1fr_auto] border-b-2">
          <div className="px-4 py-4 sm:px-6">
            <p className="label-mono text-muted-foreground">Step {step + 1}</p>
            <h2 className="font-display mt-1 text-5xl leading-none uppercase sm:text-6xl">
              {currentStep}
            </h2>
          </div>
          <div className="border-ink flex items-center border-l-2 px-4 sm:px-6">
            <span className="bg-accent block h-6 w-6" aria-hidden />
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          {step === 0 && (
            <div className="space-y-6">
              {isGuest && (
                <label className="block">
                  <span className="label-mono mb-2 block font-bold">Your name</span>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="The name to credit on the board"
                    maxLength={60}
                    autoFocus
                    className="h-12 text-base"
                  />
                  <span className="label-mono text-muted-foreground mt-2 block">
                    No account needed — this is just the maker credit shown on your project.
                  </span>
                </label>
              )}

              <label className="block">
                <span className="label-mono mb-2 block font-bold">Project title</span>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you make?"
                  maxLength={120}
                  autoFocus={!isGuest}
                  className="h-12 text-base"
                />
              </label>

              <div>
                <span className="label-mono mb-2 block font-bold">Category</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategory(c.slug)}
                      aria-pressed={category === c.slug}
                      className={cn(
                        'label-mono min-h-11 cursor-pointer border-2 px-3 py-2 text-left font-bold transition-all',
                        category === c.slug
                          ? 'border-ink bg-ink text-background shadow-[3px_3px_0_0_var(--color-accent)]'
                          : 'border-ink text-muted hover:bg-ink hover:text-background hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-ink)]',
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="label-mono mb-2 block font-bold">
                  Description <span className="text-muted-foreground">(optional)</span>
                </span>
                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="What does it do? How did you make it? What should people notice?"
                  maxLength={5000}
                  rows={4}
                />
              </label>

              <div>
                <span className="label-mono mb-2 block font-bold">
                  Tags <span className="text-muted-foreground">(optional, up to 5)</span>
                </span>
                <TagInput tags={tags} onChange={setTags} />
              </div>
            </div>
          )}

          {step === 1 && <MediaUploader folder={folder} items={media} onChange={setMedia} />}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="label-mono mb-2 block font-bold">
                  Project URL <span className="text-muted-foreground">(optional)</span>
                </span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://your-project.example.com"
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={fetchPreview}
                    disabled={!liveUrl || previewLoading}
                    className="h-12 sm:w-auto"
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
                  <div className="border-ink mt-3 grid border-2 sm:grid-cols-[128px_minmax(0,1fr)]">
                    <div className="border-ink bg-surface-raised flex min-h-24 items-center justify-center border-b-2 sm:border-r-2 sm:border-b-0">
                      {preview.imageUrl ? (
                        <img
                          src={preview.imageUrl}
                          alt=""
                          className="h-full min-h-24 w-full object-cover"
                        />
                      ) : (
                        <Globe className="text-muted h-6 w-6" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 p-4">
                      <p className="truncate text-sm font-bold tracking-wide uppercase">
                        {preview.title ?? liveUrl}
                      </p>
                      <p className="label-mono text-muted-foreground mt-2 truncate">{liveUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              <label className="block">
                <span className="label-mono mb-2 block font-bold">
                  Prompt or build notes <span className="text-muted-foreground">(optional)</span>
                </span>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Share the prompt, build notes, or short process behind the project."
                  maxLength={10000}
                  rows={7}
                  className="font-mono text-xs leading-relaxed"
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="border-ink border-2">
              <div className="border-ink border-b-2 px-5 py-4">
                <p className="label-mono text-muted-foreground">Title</p>
                <p className="mt-1 text-lg font-bold tracking-wide uppercase">{title}</p>
              </div>
              <div className="border-ink grid border-b-2 sm:grid-cols-3">
                <div className="border-ink border-b-2 px-5 py-4 sm:border-r-2 sm:border-b-0">
                  <p className="label-mono text-muted-foreground">Category</p>
                  <p className="mt-1 text-sm">
                    {CATEGORIES.find((c) => c.slug === category)?.name}
                  </p>
                </div>
                <div className="border-ink border-b-2 px-5 py-4 sm:border-r-2 sm:border-b-0">
                  <p className="label-mono text-muted-foreground">Media</p>
                  <p className="mt-1 text-sm">
                    {media.filter((m) => m.kind === 'image').length} image(s)
                    {media.some((m) => m.kind === 'video') && ', 1 video'}
                  </p>
                </div>
                <div className="min-w-0 px-5 py-4">
                  <p className="label-mono text-muted-foreground">Project URL</p>
                  <p className="mt-1 truncate text-sm">{liveUrl || 'No link added'}</p>
                </div>
              </div>
              {tags.length > 0 && (
                <div className="border-ink border-b-2 px-5 py-4">
                  <p className="label-mono text-muted-foreground">Tags</p>
                  <p className="mt-1 text-sm">{tags.join(', ')}</p>
                </div>
              )}
              <p className="label-mono text-muted px-5 py-4">
                Your project will enter the review queue. If approved, it pins to the public board
                for everyone to see.
              </p>
            </div>
          )}

          {error && (
            <p className="label-mono border-accent text-accent border-2 px-3 py-2" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="border-ink bg-surface-raised border-t-2 px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <p className="label-mono text-muted-foreground mt-3 text-right">
              Add at least one image, video, or live link to continue.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
