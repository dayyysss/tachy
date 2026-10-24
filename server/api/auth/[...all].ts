import { toNodeHandler } from 'better-auth/node'

export default defineEventHandler(event => {
  if (!isAuthConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Accounts are not configured' })
  }
  const handler = toNodeHandler(getAuth())
  return handler(event.node.req, event.node.res)
})
