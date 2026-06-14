import 'server-only'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { siteConfig } from '@/config/site'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

/**
 * Sends via Resend. Never throws — notifications must not break the main flow.
 * Without RESEND_API_KEY this is a logged no-op so the app works before email
 * is configured. Note: Resend's shared onboarding sender can only deliver to
 * the account owner's own address — set EMAIL_FROM to a verified domain to
 * email other people (e.g. approval notices to authors).
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`)
    return false
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'Made with Fable <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error(`[email] resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] send failed:', err instanceof Error ? err.message : err)
    return false
  }
}

function shell(body: string) {
  return `<div style="font-family:ui-monospace,Menlo,monospace;max-width:540px;margin:0 auto;border:2px solid #141310;background:#f0eee8;color:#141310">
  <div style="border-bottom:2px solid #141310;padding:14px 18px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase">Made with <span style="color:#d1232a">Fable</span></div>
  <div style="padding:18px;font-size:14px;line-height:1.6">${body}</div>
  <div style="border-top:2px solid #141310;padding:10px 18px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7d7869">${siteConfig.url.replace('https://', '')}</div>
</div>`
}

export async function notifyAdminOfSubmission(input: {
  title: string
  username: string
  creationId: string
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? 'kdeverett918@gmail.com'
  await sendEmail({
    to,
    subject: `[Made with Fable] New submission: ${input.title}`,
    html: shell(
      `<p><strong style="text-transform:uppercase">${escapeHtml(input.title)}</strong> by @${escapeHtml(input.username)} is waiting for review.</p>
       <p style="margin-top:16px"><a href="${siteConfig.url}/admin" style="display:inline-block;border:2px solid #141310;background:#d1232a;color:#f0eee8;padding:10px 16px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:.08em">Review it →</a></p>`,
    ),
  })
}

export async function notifyAuthorOfDecision(input: {
  authorId: string | null
  title: string
  creationId: string
  approved: boolean
  reason?: string | null
}) {
  // anonymous (guest) submissions have no account to email
  if (!input.authorId) return

  let email: string | null = null
  try {
    const admin = createSupabaseAdminClient()
    const { data } = await admin.auth.admin.getUserById(input.authorId)
    email = data.user?.email ?? null
  } catch {
    console.warn('[email] no service role key — cannot look up author email')
  }
  if (!email) return

  if (input.approved) {
    await sendEmail({
      to: email,
      subject: `Your project is live on Made with Fable`,
      html: shell(
        `<p><strong style="text-transform:uppercase">${escapeHtml(input.title)}</strong> was approved and is now on the board.</p>
         <p style="margin-top:16px"><a href="${siteConfig.url}/c/${input.creationId}" style="display:inline-block;border:2px solid #141310;background:#d1232a;color:#f0eee8;padding:10px 16px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:.08em">See it live →</a></p>`,
      ),
    })
  } else {
    await sendEmail({
      to: email,
      subject: `About your Made with Fable submission`,
      html: shell(
        `<p><strong style="text-transform:uppercase">${escapeHtml(input.title)}</strong> wasn't approved this time.</p>
         ${input.reason ? `<p style="border:2px solid #141310;padding:10px 14px;margin-top:12px">${escapeHtml(input.reason)}</p>` : ''}
         <p style="margin-top:12px">You can edit and resubmit any time.</p>`,
      ),
    })
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
