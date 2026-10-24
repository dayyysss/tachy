<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const base = computed(() => config.public.adminPanelBase || `/${route.path.split('/').filter(Boolean)[0] ?? 'tachos'}`)

const links = computed(() => [
  { to: `${base.value}/dashboard`, label: 'Dashboard' },
  { to: `${base.value}/users`, label: 'Users' },
  { to: `${base.value}/moderation`, label: 'Moderation' },
  { to: `${base.value}/files`, label: 'Files' },
  { to: `${base.value}/branding`, label: 'Branding' },
  { to: `${base.value}/settings`, label: 'Settings' },
  { to: `${base.value}/audit`, label: 'Audit' },
  { to: `${base.value}/monitoring`, label: 'Monitoring' },
  { to: `${base.value}/profile`, label: 'Profile' },
])

async function signOut() {
  try {
    await $fetch('/api/auth/sign-out', { method: 'POST' })
  } finally {
    await navigateTo(config.public.adminLoginPath || '/tachyPanel')
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <header class="border-b border-base-300 bg-base-200/50">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <BrandLogo />
        <span class="badge badge-primary badge-sm">admin</span>
        <nav class="ml-2 hidden items-center gap-1 text-sm md:flex">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="btn btn-ghost btn-sm font-normal"
            :class="{ 'text-primary': route.path === link.to || (link.to.endsWith('/dashboard') && route.path === base) }"
          >{{ link.label }}</NuxtLink>
        </nav>
        <div class="ml-auto flex items-center gap-1">
          <NuxtLink to="/" class="btn btn-ghost btn-sm">Site</NuxtLink>
          <button type="button" class="btn btn-ghost btn-sm" @click="signOut">Sign out</button>
        </div>
      </div>
      <nav class="flex gap-1 overflow-x-auto px-3 pb-2 text-sm md:hidden">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="btn btn-ghost btn-xs"
          :class="{ 'text-primary': route.path === link.to || (link.to.endsWith('/dashboard') && route.path === base) }"
        >{{ link.label }}</NuxtLink>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
