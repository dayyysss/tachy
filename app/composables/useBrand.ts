import { bundledBrand } from '#shared/config/brand'

export interface BrandAssetData {
  url: string | null
  version: number
  width: number | null
  height: number | null
}

export function useBrand() {
  const { data: brand, refresh } = useFetch<Record<string, BrandAssetData>>('/api/brand', {
    key: 'site-brand-assets',
    default: () => ({
      'logo-on-light': { url: null, version: 1, width: null, height: null },
      'logo-on-dark': { url: null, version: 1, width: null, height: null },
      'logo-mark': { url: null, version: 1, width: null, height: null },
      'favicon': { url: '/favicon.ico', version: 1, width: null, height: null },
      'og-default': { url: null, version: 1, width: null, height: null },
    }),
  })

  return {
    brand,
    refresh,
  }
}
