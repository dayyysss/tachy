export default defineEventHandler(async event => {
  if (!event.path.startsWith('/api/admin')) return

  const allowlist = (process.env.ADMIN_IP_ALLOWLIST ?? '').split(',').map(value => value.trim()).filter(Boolean)
  if (allowlist.length) {
    const ip = (event.headers.get('x-forwarded-for') ?? event.node.req.socket.remoteAddress ?? '').split(',')[0]?.trim()
    if (!ip || !allowlist.includes(ip)) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const user = await requireRole(event, 'admin')
  if (process.env.ADMIN_REQUIRE_2FA !== 'false' && !user.twoFactorEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
