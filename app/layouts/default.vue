<script setup lang="ts">
import {
  Search,
  Settings,
  LayoutDashboard,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-vue-next'

const { locale, locales } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const config = useRuntimeConfig()
const adminPanelBase = computed(() => config.public.adminPanelBase || '/tachos')
const { user, signOut: memberSignOut } = useAuth()

const otherLocale = computed(() => locales.value.find(item => item.code !== locale.value))
const switchPath = useSwitchLocalePath()

function openPalette() {
  if (import.meta.client) window.dispatchEvent(new CustomEvent('open-palette'))
}

const links = computed(() => {
  const list = [
    { to: localePath('/leaderboard'), label: 'Leaderboard', key: 'leaderboard' },
    { to: localePath('/daily'), label: 'Daily', key: 'daily' },
    { to: localePath('/about'), label: 'About', key: 'about' },
  ]
  if (user.value) {
    if (user.value.role === 'admin') {
      list.push({ to: `${adminPanelBase.value}/dashboard`, label: 'Admin Panel', key: 'admin' })
    } else {
      list.push({ to: localePath('/dashboard'), label: 'Dashboard', key: 'dashboard' })
    }
  }
  return list
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-base-100">
    <AnnouncementBanner />
    <header class="chrome sticky top-0 z-40 border-b border-base-300/80 bg-base-100/90 backdrop-blur-md">
      <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <!-- Left Section: Brand Logo & Main Navigation -->
        <div class="flex items-center gap-6 lg:gap-8">
          <BrandLogo />
          <nav class="hidden items-center gap-1.5 text-sm md:flex" aria-label="Main">
            <NuxtLink
              v-for="link in links"
              :key="link.key"
              :to="link.to"
              class="rounded-xl px-3 py-1.5 text-xs font-mono font-medium text-base-content/70 hover:text-base-content hover:bg-base-200/70 transition-colors"
              :class="{ 'text-primary bg-primary/10 font-semibold hover:bg-primary/15': route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to)) }"
            >{{ link.label }}</NuxtLink>
          </nav>
        </div>

        <!-- Right Section: Expanded Search & Utility Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Expanded Search Trigger Bar -->
          <button
            type="button"
            class="hidden sm:flex w-44 md:w-60 lg:w-72 items-center justify-between gap-2 h-9 rounded-xl border border-base-300/80 bg-base-200/50 hover:bg-base-200/90 hover:border-primary/40 px-3 text-xs font-mono text-base-content/50 hover:text-base-content transition-all cursor-pointer shadow-xs"
            title="Open command palette (Ctrl+K or ⌘K)"
            @click="openPalette"
          >
            <div class="flex items-center gap-2 truncate">
              <Search class="size-3.5 text-base-content/40 shrink-0" />
              <span class="truncate">Search commands, modes…</span>
            </div>
            <kbd class="kbd kbd-xs bg-base-300/80 text-base-content/70 border-none text-[10px] px-1.5 py-0.5 font-semibold rounded-md shrink-0">⌘K</kbd>
          </button>

          <!-- Mobile icon-only search button -->
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square sm:hidden text-base-content/70"
            title="Open command palette"
            @click="openPalette"
          >
            <Search class="size-4" />
          </button>

          <div class="h-4 w-px bg-base-300/80 mx-0.5 hidden sm:block" />

          <!-- Language Selector -->
          <NuxtLink
            v-if="otherLocale"
            :to="switchPath(otherLocale.code)"
            class="btn btn-ghost btn-sm px-2 font-mono text-xs uppercase text-base-content/70 hover:text-base-content"
            :aria-label="`Switch to ${otherLocale.name}`"
          >
            <span class="opacity-60 text-[10px] mr-0.5">lang:</span>
            <span class="font-bold text-primary">{{ otherLocale.code }}</span>
          </NuxtLink>

          <!-- Theme Picker -->
          <ThemePicker />

          <!-- Settings Button -->
          <NuxtLink
            :to="localePath('/settings')"
            class="btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-base-content"
            :class="{ 'text-primary bg-primary/10': route.path.startsWith('/settings') }"
            aria-label="Settings"
          >
            <Settings class="size-4" />
          </NuxtLink>

          <!-- User / Auth CTA -->
          <template v-if="user">
            <div class="dropdown dropdown-end">
              <button
                tabindex="0"
                type="button"
                class="btn btn-ghost btn-sm gap-2 pl-1.5 pr-2.5 font-mono text-xs border border-base-300/80 hover:border-primary/40 rounded-xl transition-all"
              >
                <div class="size-6 rounded-full overflow-hidden bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/30">
                  <img v-if="user.image" :src="user.image" :alt="user.username || user.name" class="size-full object-cover">
                  <span v-else>{{ (user.username || user.name || 'U').charAt(0).toUpperCase() }}</span>
                </div>
                <span class="max-w-20 sm:max-w-32 truncate font-medium text-base-content">{{ user.username || user.name }}</span>
                <ChevronDown class="size-3 opacity-40 shrink-0" />
              </button>
              <ul tabindex="0" class="dropdown-content menu menu-sm z-50 mt-2 w-56 rounded-2xl border border-base-300 bg-base-200 p-2 shadow-2xl font-mono text-xs backdrop-blur-md">
                <li class="menu-title px-2 py-1.5 border-b border-base-300/60 mb-1">
                  <div class="flex items-center gap-2">
                    <div class="size-7 rounded-full overflow-hidden bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/30">
                      <img v-if="user.image" :src="user.image" :alt="user.username || user.name" class="size-full object-cover">
                      <span v-else>{{ (user.username || user.name || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-semibold text-base-content text-xs">{{ user.username || user.name }}</p>
                      <p class="truncate text-[10px] text-base-content/40 font-mono">{{ user.email }}</p>
                    </div>
                  </div>
                </li>
                <li v-if="user.role === 'admin'">
                  <NuxtLink :to="`${adminPanelBase}/dashboard`" class="flex items-center gap-2 py-2 font-semibold text-primary">
                    <ShieldCheck class="size-3.5 text-primary" />
                    <span>Admin Panel</span>
                  </NuxtLink>
                </li>
                <template v-else>
                  <li v-if="user.username">
                    <NuxtLink :to="localePath(`/u/${user.username}`)" class="flex items-center gap-2 py-2">
                      <UserIcon class="size-3.5 text-primary" />
                      <span>Profile</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink :to="localePath('/dashboard')" class="flex items-center gap-2 py-2">
                      <LayoutDashboard class="size-3.5 text-primary" />
                      <span>Dashboard</span>
                    </NuxtLink>
                  </li>
                </template>
                <li>
                  <NuxtLink :to="localePath('/settings')" class="flex items-center gap-2 py-2">
                    <SlidersHorizontal class="size-3.5 text-primary" />
                    <span>Settings</span>
                  </NuxtLink>
                </li>
                <div class="divider my-1 border-base-300/60" />
                <li>
                  <button type="button" class="flex items-center gap-2 py-2 text-error hover:bg-error/10" @click="memberSignOut">
                    <LogOut class="size-3.5" />
                    <span>Sign out</span>
                  </button>
                </li>
              </ul>
            </div>
          </template>
          <NuxtLink
            v-else
            :to="localePath('/login')"
            class="btn btn-sm btn-primary px-4 font-mono text-xs font-semibold shadow-xs"
          >{{ $t('nav.signIn') }}</NuxtLink>
        </div>
      </div>

      <nav class="flex gap-1 overflow-x-auto px-4 pb-2 text-sm md:hidden border-t border-base-300/50 pt-1" aria-label="Main mobile">
        <NuxtLink
          v-for="link in links"
          :key="link.key"
          :to="link.to"
          class="btn btn-ghost btn-xs font-normal"
        >{{ link.label }}</NuxtLink>
      </nav>
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <CommandPalette />

    <footer class="chrome border-t border-base-300/70 py-6 text-xs text-base-content/50">
      <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 sm:px-8 lg:px-12">
        <span>Tachy · {{ $t('footer.tagline') }}</span>
        <NuxtLink :to="localePath('/about')" class="hover:text-primary">About</NuxtLink>
        <NuxtLink :to="localePath('/typing-test')" class="hover:text-primary">Typing test</NuxtLink>
        <span class="ml-auto">WPM = correct characters ÷ 5 ÷ minutes</span>
      </div>
    </footer>
  </div>
</template>
