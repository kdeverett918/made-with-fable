'use client'

import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

export function PromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-muted flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          <Terminal className="text-accent h-3.5 w-3.5" aria-hidden /> The prompt
        </span>
        <button
          onClick={copy}
          className="text-muted hover:text-foreground flex cursor-pointer items-center gap-1.5 text-xs transition-colors"
        >
          {copied ? (
            <>
              <Check className="text-success h-3.5 w-3.5" aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="max-h-96 scrollbar-none overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  )
}
