export default defineEventHandler(event => {
  if (!isAuthConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Accounts are not configured' })
  }
  return getAuth().handler(toWebRequest(event))
})
