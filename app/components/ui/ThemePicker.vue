<script setup lang="ts">
import { themes } from '#shared/config/themes'
import { Star, Palette, Shuffle, Search } from 'lucide-vue-next'

const { themeId, setTheme, randomTheme } = useTheme()
const { settings } = storeToRefs(useSettingsStore())
const query = ref('')

function toggleFavorite(id: string) {
  const favorites = settings.value.themeFavorites ?? []
  settings.value = {
    ...settings.value,
    themeFavorites: favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id],
  }
}

const filtered = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return themes
  return themes.filter(theme => theme.label.toLowerCase().includes(value) || theme.id.includes(value))
})
</script>

<template>
  <div class="dropdown dropdown-end">
    <button
      type="button"
      tabindex="0"
      class="btn btn-ghost btn-sm gap-1.5 px-2.5 font-mono text-xs text-base-content/70 hover:text-base-content"
      aria-label="Change theme"
    >
      <Palette class="size-4 text-base-content/60" />
      <span class="hidden sm:inline font-mono text-xs">{{ themeId }}</span>
    </button>
    <div tabindex="0" class="dropdown-content z-50 mt-2 w-72 rounded-2xl border border-base-300 bg-base-200 p-3 shadow-2xl backdrop-blur-md">
      <div class="mb-2 flex items-center gap-1.5">
        <div class="relative flex-1">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
          <input
            v-model="query"
            type="search"
            class="input input-bordered input-sm w-full pl-8 font-mono text-xs"
            placeholder="Search themes…"
            aria-label="Search themes"
          >
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square border border-base-300/80"
          title="Random theme"
          @click="randomTheme"
        >
          <Shuffle class="size-3.5 text-base-content/70" />
        </button>
      </div>
      <div class="max-h-72 space-y-1 overflow-y-auto pr-1">
        <button
          v-for="theme in filtered"
          :key="theme.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm hover:bg-base-300"
          :class="{ 'bg-base-300': themeId === theme.id }"
          @click="setTheme(theme.id); settings.theme = theme.id"
        >
          <span class="flex gap-0.5">
            <span class="size-3 rounded-full" :style="{ background: theme.colors.primary }" />
            <span class="size-3 rounded-full" :style="{ background: theme.colors.secondary }" />
            <span class="size-3 rounded-full" :style="{ background: theme.colors.accent }" />
            <span class="size-3 rounded-full border border-base-content/20" :style="{ background: theme.colors.base }" />
          </span>
          <span class="flex-1 truncate">{{ theme.label }}</span>
          <span v-if="theme.recommended" class="badge badge-primary badge-xs">default</span>
          <span v-else-if="theme.contrastWarning" class="badge badge-warning badge-xs">low contrast</span>
          <span
            class="cursor-pointer transition-colors p-0.5"
            :class="settings.themeFavorites?.includes(theme.id) ? 'text-primary' : 'text-base-content/30 hover:text-base-content/60'"
            role="button"
            :aria-label="`Favorite ${theme.label}`"
            @click.stop="toggleFavorite(theme.id)"
          >
            <Star class="size-3.5" :class="settings.themeFavorites?.includes(theme.id) ? 'fill-primary' : ''" />
          </span>
          <span class="text-xs opacity-50">{{ theme.type }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
