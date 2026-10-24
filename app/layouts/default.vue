<script setup lang="ts">
const { locale, locales } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const otherLocale = computed(() => locales.value.find(item => item.code !== locale.value))
const switchPath = useSwitchLocalePath()

function openPalette() {
  if (import.meta.client) window.dispatchEvent(new CustomEvent('open-palette'))
}

const links = computed(() => [
  { to: localePath('/leaderboard'), label: 'Leaderboard', key: 'leaderboard' },
  { to: localePath('/daily'), label: 'Daily', key: 'daily' },
  { to: localePath('/about'), label: 'About', key: 'about' },
  { to: localePath('/dashboard'), label: 'Dashboard', key: 'dashboard' },
])
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AnnouncementBanner />
    <header class="chrome sticky top-0 z-40 border-b border-base-300/80 bg-base-100/85 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <BrandLogo />
        <nav class="ml-2 hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          <NuxtLink
            v-for="link in links"
            :key="link.key"
            :to="link.to"
            class="btn btn-ghost btn-sm font-normal"
            :class="{ 'text-primary': route.path === link.to }"
          >{{ link.label }}</NuxtLink>
        </nav>
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-box border border-base-300 bg-base-200/50 text-[11px] font-mono text-base-content/50 hover:text-base-content hover:border-base-content/30 transition-all cursor-pointer"
          title="Open command palette (Ctrl+K or ⌘K)"
          @click="openPalette"
        >
          <span>Search</span>
          <kbd class="kbd kbd-xs bg-base-300 border-none text-[9px] px-1 font-semibold">⌘K</kbd>
        </button>
        <div class="ml-auto flex items-center gap-1">
          <NuxtLink
            v-if="otherLocale"
            :to="switchPath(otherLocale.code)"
            class="btn btn-ghost btn-sm text-xs uppercase"
            :aria-label="`Switch to ${otherLocale.name}`"
          >{{ otherLocale.code }}</NuxtLink>
          <ThemePicker />
          <NuxtLink :to="localePath('/settings')" class="btn btn-ghost btn-sm btn-square" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z" />
            </svg>
          </NuxtLink>
          <NuxtLink :to="localePath('/login')" class="btn btn-ghost btn-sm">{{ $t('nav.signIn') }}</NuxtLink>
        </div>
      </div>
      <nav class="flex gap-1 overflow-x-auto px-3 pb-2 text-sm md:hidden" aria-label="Main mobile">
        <NuxtLink
          v-for="link in links"
          :key="link.key"
          :to="link.to"
          class="btn btn-ghost btn-xs font-normal"
        >{{ link.label }}</NuxtLink>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <CommandPalette />

    <footer class="chrome border-t border-base-300/70 py-6 text-xs text-base-content/50">
      <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4">
        <span>Tachy · {{ $t('footer.tagline') }}</span>
        <NuxtLink :to="localePath('/about')" class="hover:text-primary">About</NuxtLink>
        <NuxtLink :to="localePath('/typing-test')" class="hover:text-primary">Typing test</NuxtLink>
        <span class="ml-auto">WPM = correct characters ÷ 5 ÷ minutes</span>
      </div>
    </footer>
  </div>
</template>
