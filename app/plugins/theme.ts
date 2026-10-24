export default defineNuxtPlugin(() => {
  const { themeId, type } = useTheme()

  useHead({
    htmlAttrs: {
      'data-theme': themeId,
      'data-theme-type': type,
    },
  })
})
