'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset?: () => void
  unstable_retry?: () => void
}) {
  const retry = unstable_retry ?? reset

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f0e3',
          color: '#151515',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          style={{
            width: 'min(92vw, 34rem)',
            border: '2px solid #151515',
            background: '#fffaf0',
            padding: '1.5rem',
            boxShadow: '6px 6px 0 #151515',
          }}
        >
          <p style={{ margin: 0, color: '#d7335f', fontWeight: 800, textTransform: 'uppercase' }}>
            Error / root boundary
          </p>
          <h1 style={{ margin: '1rem 0', fontSize: 'clamp(2.5rem, 12vw, 5rem)', lineHeight: 0.9 }}>
            Something broke
          </h1>
          <p style={{ margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            An unexpected error stopped the app from rendering.
          </p>
          {error.digest && (
            <p style={{ margin: '0 0 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={retry}
            disabled={!retry}
            style={{
              width: '100%',
              border: '2px solid #151515',
              background: '#151515',
              color: '#fffaf0',
              padding: '0.875rem 1rem',
              fontWeight: 800,
              cursor: retry ? 'pointer' : 'not-allowed',
              opacity: retry ? 1 : 0.6,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
