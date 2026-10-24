export interface BrandSlot {
  id: string
  label: string
  purpose: string
  formats: string[]
  square?: boolean
  minWidth?: number
  minHeight?: number
}

export const brandSlots: BrandSlot[] = [
  { id: 'logo-on-light', label: 'Logo on light', purpose: 'Logo shown on light backgrounds', formats: ['svg', 'png'] },
  { id: 'logo-on-dark', label: 'Logo on dark', purpose: 'Logo shown on dark backgrounds', formats: ['svg', 'png'] },
  { id: 'logo-mark', label: 'Logo mark', purpose: 'Square icon for compact navbar/mobile', formats: ['svg', 'png'], square: true },
  { id: 'favicon', label: 'Favicon', purpose: 'Source for generated favicon sizes', formats: ['svg', 'png'], square: true, minWidth: 512, minHeight: 512 },
  { id: 'og-default', label: 'Default share image', purpose: 'Fallback Open Graph image', formats: ['png', 'jpg'], minWidth: 1200, minHeight: 630 },
]

export const bundledBrand: Record<string, string> = {
  'logo-on-light': '/brand/logo-on-light.png',
  'logo-on-dark': '/brand/logo-on-dark.png',
  'favicon': '/favicon.png',
  'og-default': '/brand/og-default.png',
}
