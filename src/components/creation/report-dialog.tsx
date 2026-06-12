'use client'

import { useState, useTransition } from 'react'
import { Flag, X } from 'lucide-react'
import { reportCreation } from '@/app/actions/engagement'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const REASONS = [
  { value: 'spam', label: 'Spam or self-promotion' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'not_fable', label: 'Not made with Fable' },
  { value: 'other', label: 'Something else' },
] as const

export function ReportDialog({ creationId, signedIn }: { creationId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('spam')
  const [detail, setDetail] = useState('')
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!signedIn) return null

  function submit() {
    startTransition(async () => {
      const result = await reportCreation({ creationId, reason, detail })
      if (result.ok) setDone(true)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-error flex cursor-pointer items-center gap-1.5 text-xs transition-colors"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden /> Report
      </button>

      {open && (
        <div
          className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Report this creation"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="border-border bg-surface animate-scale-in w-full max-w-sm rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Report this creation</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {done ? (
              <p className="text-muted mt-4 text-sm">
                Thanks — we&apos;ll take a look. You can close this now.
              </p>
            ) : (
              <>
                <div className="mt-4 space-y-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={cn(
                        'block w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        reason === r.value
                          ? 'border-accent/50 bg-accent/10 text-foreground'
                          : 'border-border text-muted hover:border-border-strong',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Anything else we should know? (optional)"
                  maxLength={500}
                  rows={2}
                  className="mt-3"
                />
                <Button onClick={submit} disabled={pending} className="mt-4 w-full" size="sm">
                  Submit report
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
