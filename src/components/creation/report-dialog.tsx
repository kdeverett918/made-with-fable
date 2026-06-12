'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, X } from 'lucide-react'
import { reportCreation } from '@/app/actions/engagement'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'not_fable', label: 'Not Fable' },
  { value: 'other', label: 'Other' },
] as const

export function ReportDialog({
  creationId,
  signedIn,
  className,
}: {
  creationId: string
  signedIn: boolean
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('spam')
  const [detail, setDetail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openDialog() {
    if (!signedIn) {
      router.push(`/login?redirectTo=/c/${creationId}`)
      return
    }
    setMessage(null)
    setOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await reportCreation({ creationId, reason, detail })
      if (result.ok) {
        setMessage('Report filed. A moderator will review it.')
        setDetail('')
        window.setTimeout(() => setOpen(false), 900)
      } else {
        setMessage(result.error ?? 'Could not file report')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={cn(
          'label-mono text-muted hover:text-accent flex cursor-pointer items-center gap-1.5 font-bold transition-colors',
          className,
        )}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Report
      </button>

      {open && (
        <div className="bg-ink/60 fixed inset-0 z-50 grid place-items-center p-4">
          <form
            onSubmit={submit}
            className="bg-background border-ink animate-scale-in w-full max-w-lg border-2 shadow-[6px_6px_0_0_var(--color-ink)]"
          >
            <header className="border-ink flex items-center justify-between border-b-2 px-4 py-3">
              <div>
                <p className="label-mono text-accent font-bold">Moderation note</p>
                <h2 className="font-display mt-1 text-3xl leading-none tracking-normal uppercase">
                  Report this
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close report dialog"
                className="border-ink hover:bg-ink hover:text-background grid h-9 w-9 cursor-pointer place-items-center border-2 transition-colors"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div className="space-y-4 p-4">
              <fieldset>
                <legend className="label-mono text-ink mb-2 font-bold">Reason</legend>
                <div className="grid grid-cols-2 gap-2">
                  {REASONS.map((item) => (
                    <label
                      key={item.value}
                      className={cn(
                        'label-mono border-ink flex cursor-pointer items-center justify-between border-2 px-3 py-2 font-bold',
                        reason === item.value && 'bg-ink text-background',
                      )}
                    >
                      {item.label}
                      <input
                        type="radio"
                        name="reason"
                        value={item.value}
                        checked={reason === item.value}
                        onChange={() => setReason(item.value)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-detail" className="label-mono text-ink mb-2 block font-bold">
                  Detail
                </label>
                <Textarea
                  id="report-detail"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Optional context for moderators."
                />
              </div>

              {message && (
                <p className="label-mono border-ink border-2 px-3 py-2" aria-live="polite">
                  {message}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={pending}>
                  {pending ? <Spinner className="text-on-accent h-3.5 w-3.5" /> : null}
                  File report
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
