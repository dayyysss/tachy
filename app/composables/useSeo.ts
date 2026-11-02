import { seoRoutes, defaultTitle, defaultDescription, type SeoRoute } from '#shared/config/seo'

export function useSeo(key: keyof typeof seoRoutes, overrides: Partial<SeoRoute> = {}) {
  const base = seoRoutes[key] ?? seoRoutes.home!
  const meta = { ...base, ...overrides }
  const route = useRoute()
  const { t } = useI18n()
  const config = useRuntimeConfig()

  const titleKey = `seo.${key}.title`
  const descriptionKey = `seo.${key}.description`
  const localizedTitle = t(titleKey)
  const localizedDescription = t(descriptionKey)
  if (localizedTitle !== titleKey) meta.title = localizedTitle
  if (localizedDescription !== descriptionKey) meta.description = localizedDescription
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const { brand } = useBrand()
  const ogImageUrl = computed(() => brand.value?.['og-default']?.url || `${siteUrl}/brand/og-default.png`)

  const barePath = route.path.replace(/^\/id(?=\/|$)/, '') || '/'
  const enPath = barePath === '/' ? '/' : barePath
  const idPath = barePath === '/' ? '/id' : `/id${barePath}`
  const canonical = `${siteUrl}${route.path}`

  useSeoMeta({
    title: meta.title,
    description: meta.description,
    robots: meta.robots,
    ogTitle: meta.title,
    ogDescription: meta.description,
    ogType: 'website',
    ogUrl: canonical,
    ogLocale: route.path.startsWith('/id') ? 'id_ID' : 'en_US',
    ogLocaleAlternate: route.path.startsWith('/id') ? 'en_US' : 'id_ID',
    ogImage: () => ogImageUrl.value,
    twitterCard: 'summary_large_image',
    twitterImage: () => ogImageUrl.value,
  })

  useHead({
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hreflang: 'en', href: `${siteUrl}${enPath}` },
      { rel: 'alternate', hreflang: 'id', href: `${siteUrl}${idPath}` },
      { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}${enPath}` },
    ],
  })

  if (key === 'home') {
    useSchemaOrg([
      {
        '@type': 'WebApplication',
        name: 'Tachy',
        url: siteUrl,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ])
  }

  return { meta, canonical }
}

export { seoRoutes, defaultTitle, defaultDescription }
