interface EmailMessage {
  to: string
  subject: string
  html: string
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY
  const from = process.env.EMAIL_FROM || 'Tachy <noreply@tachy.app>'
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[email] ${message.subject} -> ${message.to} (EMAIL_API_KEY not set)`)
    }
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from, ...message }),
  })

  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
}

export function emailLayout(title: string, body: string, action: { label: string; url: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#17191c;color:#e7e9ec;font-family:Inter,system-ui,sans-serif;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#22252a;border-radius:12px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#f4c95d">${title}</h1>
      <p style="margin:0 0 20px;line-height:1.6;color:#c9ccd1">${body}</p>
      <a href="${action.url}" style="display:inline-block;background:#f4c95d;color:#17191c;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${action.label}</a>
      <p style="margin:20px 0 0;font-size:12px;color:#7c8188">If the button does not work, copy this link:<br>${action.url}</p>
    </div>
  </body></html>`
}
