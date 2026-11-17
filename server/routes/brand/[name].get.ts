import { getBrandBuffer } from '../../utils/brand'

const slotMap: Record<string, string> = {
  'logo-on-light': 'logo-on-light',
  'logo-on-light.png': 'logo-on-light',
  'logo-on-dark': 'logo-on-dark',
  'logo-on-dark.png': 'logo-on-dark',
  'logo-mark': 'logo-mark',
  'logo-mark.png': 'logo-mark',
  'og-default': 'og-default',
  'og-default.png': 'og-default',
}

export default defineEventHandler(async event => {
  const name = String(getRouterParam(event, 'name') ?? '')
  const slot = slotMap[name] || slotMap[`${name}.png`] || name

  const brand = await getBrandBuffer(slot)
  if (!brand) {
    throw createError({ statusCode: 404, statusMessage: 'Brand asset not found' })
  }

  setHeader(event, 'content-type', brand.mime)
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'etag', `"brand-${slot}-v${brand.version}"`)
  return brand.buffer
})
