<script setup lang="ts">
import { themes } from '#shared/config/themes'

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
    <button type="button" tabindex="0" class="btn btn-ghost btn-sm gap-2" aria-label="Change theme">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </svg>
      <span class="hidden sm:inline">{{ themeId }}</span>
    </button>
    <div tabindex="0" class="dropdown-content z-50 mt-2 w-72 rounded-box border border-base-300 bg-base-200 p-3 shadow-xl">
      <div class="mb-2 flex gap-1">
        <input
          v-model="query"
          type="search"
          class="input input-bordered input-sm w-full"
          placeholder="Search themes"
          aria-label="Search themes"
        >
        <button type="button" class="btn btn-ghost btn-sm" title="Random theme" @click="randomTheme">↻</button>
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
            class="cursor-pointer text-sm"
            :class="{ 'text-primary': settings.themeFavorites?.includes(theme.id) }"
            role="button"
            :aria-label="`Favorite ${theme.label}`"
            @click.stop="toggleFavorite(theme.id)"
          >{{ settings.themeFavorites?.includes(theme.id) ? '★' : '☆' }}</span>
          <span class="text-xs opacity-50">{{ theme.type }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
