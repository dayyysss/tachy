import { getSiteFlags } from '../utils/siteFlags'

export default defineEventHandler(async () => {
  const flags = await getSiteFlags()
  return {
    status: 'ok',
    maintenance: Boolean(flags.maintenance),
    timestamp: new Date().toISOString(),
  }
})
