'use client'

import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { copyText } from '@/lib/clipboard'

export function PromptBlock({ prompt }: { prompt: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const lineCount = Math.max(1, prompt.split('\n').length)

  async function copy() {
    setCopyState((await copyText(prompt)) ? 'copied' : 'failed')
    setTimeout(() => setCopyState('idle'), 2000)
  }

  return (
    <section className="border-ink bg-surface-raised border-2 shadow-[6px_6px_0_0_var(--color-ink)]">
      <div className="border-ink grid grid-cols-[1fr_auto] items-center border-b-2">
        <div className="px-4 py-3">
          <p className="label-mono text-ink font-bold">&gt;_ Prompt transcript</p>
          <p className="label-mono text-muted mt-1 tabular-nums">
            {lineCount} line{lineCount === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="label-mono border-ink text-ink hover:bg-ink hover:text-background flex h-full cursor-pointer items-center gap-1.5 border-l-2 px-4 font-bold transition-colors"
        >
          {copyState === 'copied' ? (
            <>
              <Check className="text-success h-3.5 w-3.5" aria-hidden /> Copied
            </>
          ) : copyState === 'failed' ? (
            <>
              <X className="text-error h-3.5 w-3.5" aria-hidden /> Failed
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        <div
          className="border-ink text-muted bg-background border-r-2 px-3 py-4 font-mono text-xs leading-relaxed tabular-nums select-none"
          aria-hidden
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <span key={index} className="block">
              {String(index + 1).padStart(2, '0')}
            </span>
          ))}
        </div>
        <pre className="text-ink max-h-[32rem] scrollbar-none overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {prompt}
        </pre>
      </div>
    </section>
  )
}
