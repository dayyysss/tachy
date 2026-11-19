export default defineEventHandler(async event => {
  if (!isAuthConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Accounts are not configured' })
  }

  const response = await getAuth().handler(toWebRequest(event))
  const location = response.headers.get('location')

  if (response.status >= 300 && response.status < 400 && location) {
    const reqUrl = getRequestURL(event)
    let target = location

    if (target.startsWith('http://localhost') || target.startsWith('http://127.0.0.1')) {
      try {
        const parsed = new URL(target)
        target = `${reqUrl.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
      } catch {
        target = `${reqUrl.origin}/dashboard`
      }
    } else if (target.startsWith('/')) {
      target = `${reqUrl.origin}${target}`
    }

    const headers = new Headers(response.headers)
    headers.set('location', target)
    headers.set('content-type', 'text/html; charset=utf-8')

    const escapedTarget = target.replace(/"/g, '&quot;')
    const safeScriptTarget = JSON.stringify(target)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title><meta http-equiv="refresh" content="0;url=${escapedTarget}"><script>window.location.replace(${safeScriptTarget});</script></head><body style="background:#17191C;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p>Redirecting to <a href="${escapedTarget}" style="color:#F4C95D;">dashboard</a>...</p></body></html>`

    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  return response
})

