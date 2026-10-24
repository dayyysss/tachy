import { defaultTheme, getTheme, themeIds } from '#shared/config/themes'

export function useTheme() {
  const cookie = useCookie<string>('tachy-theme', {
    default: () => defaultTheme,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const themeId = useState<string>('theme-id', () => (themeIds.includes(cookie.value) ? cookie.value : defaultTheme))
  const current = computed(() => getTheme(themeId.value))
  const type = computed(() => current.value.type)

  function setTheme(id: string) {
    if (themeIds.includes(id)) {
      themeId.value = id
      cookie.value = id
    }
  }

  function randomTheme() {
    const next = themeIds[Math.floor(Math.random() * themeIds.length)]
    if (next) setTheme(next)
  }

  return {
    themeId,
    current,
    type,
    themes: themeIds,
    setTheme,
    randomTheme,
  }
}
