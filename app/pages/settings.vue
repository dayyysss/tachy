<script setup lang="ts">
import { themes } from '#shared/config/themes'
import { availableLanguages } from '#shared/config/languages'
import type { Settings } from '#shared/schemas/settings'
import {
  Palette,
  Keyboard,
  Settings2,
  Volume2,
  Target,
  User,
  Star,
  AlertTriangle,
  Download,
  LogOut,
  Trash2,
  Save,
  ArrowRight,
  Camera,
} from 'lucide-vue-next'

useSeo('settings')

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { setLocale, locale } = useI18n()
const testStore = useTestStore()
const { setTheme } = useTheme()
const toast = useToast()
const dialog = useDialog()

const themeFilter = ref<'all' | 'dark' | 'light' | 'fav'>('all')

const filteredThemes = computed(() => {
  if (themeFilter.value === 'dark') return themes.filter(t => t.type === 'dark')
  if (themeFilter.value === 'light') return themes.filter(t => t.type === 'light')
  if (themeFilter.value === 'fav') {
    const favs = settings.value.themeFavorites ?? []
    return themes.filter(t => favs.includes(t.id))
  }
  return themes
})

watch(() => settings.value.theme, id => setTheme(id), { immediate: true })

function applyAuto() {
  if (!settings.value.themeAuto) return
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setTheme(dark ? settings.value.themeDark : settings.value.themeLight)
}

onMounted(applyAuto)
watch(() => settings.value.themeAuto, applyAuto)
watch([() => settings.value.themeLight, () => settings.value.themeDark], applyAuto)

function toggleFavorite(id: string) {
  const favorites = settings.value.themeFavorites ?? []
  settings.value.themeFavorites = favorites.includes(id)
    ? favorites.filter(item => item !== id)
    : [...favorites, id]
}

async function changeLocale(code: 'en' | 'id') {
  settings.value.language = code
  await setLocale(code)
}

function clearHistory() {
  testStore.clearHistory()
  toast.success('Local test history cleared.')
}

function reset() {
  settingsStore.reset()
  toast.info('Settings restored to defaults.')
}

const { user: sessionUser, signOut: authSignOut, fetchSession } = useAuth()
const profile = ref({ username: '', displayName: '', timezone: 'UTC', isPublic: true })

watch(sessionUser, (u) => {
  if (u) {
    profile.value = {
      username: u.username ?? '',
      displayName: u.name ?? '',
      timezone: u.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      isPublic: u.isPublic ?? true,
    }
  }
}, { immediate: true })

onMounted(async () => {
  if (!sessionUser.value) {
    await fetchSession()
  }
})

const avatarUploading = ref(false)
const fileInputEl = ref<HTMLInputElement | null>(null)

function triggerAvatarSelect() {
  fileInputEl.value?.click()
}

async function handleAvatarChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image exceeds 5MB limit.')
    target.value = ''
    return
  }

  avatarUploading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    await $fetch<{ ok: boolean; image: string }>('/api/me/avatar', {
      method: 'POST',
      body: formData,
    })
    await fetchSession()
    toast.success('Profile photo updated successfully!')
  } catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message
    toast.error(message || 'Failed to upload profile photo.')
  } finally {
    avatarUploading.value = false
    target.value = ''
  }
}

async function removeAvatar() {
  const confirmed = await dialog.confirm({
    title: 'Remove Profile Photo?',
    message: 'Your profile picture will be reset to your initial letter badge.',
    confirmText: 'Remove Photo',
    danger: true,
  })
  if (!confirmed) return

  avatarUploading.value = true
  try {
    await $fetch('/api/me/avatar', { method: 'DELETE' })
    await fetchSession()
    toast.success('Profile photo removed.')
  } catch {
    toast.error('Failed to remove photo.')
  } finally {
    avatarUploading.value = false
  }
}

async function saveProfile() {
  try {
    await $fetch('/api/me/profile', { method: 'PUT', body: profile.value })
    await fetchSession()
    toast.success('Profile saved.')
  } catch {
    toast.error('Could not save profile. Username may be taken.')
  }
}

function exportData() {
  window.open('/api/me/export', '_blank')
}

async function signOut() {
  await authSignOut()
}

async function deleteAccount() {
  const confirmed = await dialog.confirm({
    title: 'Delete your account?',
    message: 'This will permanently delete your account, saved settings, and all test history. This action cannot be undone.',
    confirmText: 'Delete Permanently',
    danger: true,
  })
  if (!confirmed) return
  await $fetch('/api/me/account', { method: 'DELETE' })
  sessionUser.value = null
  await navigateTo('/')
}
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-10 space-y-10">
    <!-- Header -->
    <div class="rounded-2xl border border-base-300 bg-base-200/50 p-6 sm:p-8 shadow-xs">
      <span class="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
        Configuration
      </span>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        {{ $t('settings.title') }}
      </h1>
      <p class="mt-1 text-xs text-base-content/60 font-mono">
        Configure visual palettes, typing ergonomics, audio feedback, and cloud profile sync.
      </p>
    </div>

    <!-- 1. ACCOUNT & PROFILE -->
    <section class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-5">
      <div class="border-b border-base-300/60 pb-3">
        <h2 class="text-base font-bold text-base-content flex items-center gap-2">
          <User class="size-4 text-primary" />
          <span>Account & Sync</span>
        </h2>
        <p class="text-xs text-base-content/50 font-mono">Sync personal bests, badges, and streaks to the cloud.</p>
      </div>

      <!-- Logged-in profile form -->
      <div v-if="sessionUser" class="space-y-5">
        <!-- Avatar Photo Picker Card -->
        <div class="rounded-2xl border border-base-300/80 bg-base-100/60 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div class="relative group size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-primary/25 to-base-300 border-2 border-primary/40 flex items-center justify-center text-primary font-mono font-bold text-3xl shadow-md shrink-0 overflow-hidden">
            <img v-if="sessionUser.image" :src="sessionUser.image" alt="Profile photo" class="h-full w-full object-cover">
            <span v-else>{{ (sessionUser.username || sessionUser.name || 'T')[0]?.toUpperCase() }}</span>
            <div
              v-if="avatarUploading"
              class="absolute inset-0 bg-black/60 flex items-center justify-center text-white"
            >
              <span class="loading loading-spinner loading-sm" />
            </div>
          </div>

          <div class="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div>
              <h3 class="text-sm font-bold text-base-content">Profile Picture</h3>
              <p class="text-xs text-base-content/50 font-mono mt-0.5">
                Upload a custom photo for your public typist profile and header badge. Max 5MB (PNG, JPG, WebP).
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <input
                ref="fileInputEl"
                type="file"
                class="hidden"
                accept="image/png,image/jpeg,image/webp,image/gif"
                @change="handleAvatarChange"
              >
              <button
                type="button"
                class="btn btn-primary btn-sm font-semibold shadow-xs flex items-center gap-1.5"
                :disabled="avatarUploading"
                @click="triggerAvatarSelect"
              >
                <Camera class="size-3.5" />
                <span>{{ sessionUser.image ? 'Change Photo' : 'Upload Photo' }}</span>
              </button>

              <button
                v-if="sessionUser.image"
                type="button"
                class="btn btn-ghost btn-sm text-error hover:bg-error/10 border border-base-300 text-xs flex items-center gap-1"
                :disabled="avatarUploading"
                @click="removeAvatar"
              >
                <Trash2 class="size-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1">
            <label class="block text-xs font-semibold text-base-content">Username</label>
            <input v-model="profile.username" class="input input-bordered input-sm w-full font-mono text-sm" maxlength="24">
            <p class="text-[10px] text-base-content/40 font-mono">Public leaderboard handle</p>
          </div>

          <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1">
            <label class="block text-xs font-semibold text-base-content">Display Name</label>
            <input v-model="profile.displayName" class="input input-bordered input-sm w-full text-sm" maxlength="48">
            <p class="text-[10px] text-base-content/40 font-mono">Visible on public profile page</p>
          </div>

          <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1">
            <label class="block text-xs font-semibold text-base-content">Timezone</label>
            <input v-model="profile.timezone" class="input input-bordered input-sm w-full font-mono text-sm" maxlength="64">
            <p class="text-[10px] text-base-content/40 font-mono">For daily streak & heatmap cutoff</p>
          </div>

          <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-xs font-semibold">Public Profile</p>
              <p class="text-[10px] text-base-content/50 font-mono">Allow visitors to view /u/{{ profile.username || 'user' }}</p>
            </div>
            <input v-model="profile.isPublic" type="checkbox" class="toggle toggle-primary toggle-sm">
          </label>
        </div>

        <div class="flex items-center justify-between border-t border-base-300/60 pt-4">
          <span class="font-mono text-xs text-base-content/50">{{ sessionUser.email }}</span>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-primary btn-sm font-semibold shadow-xs flex items-center gap-1.5" @click="saveProfile">
              <Save class="size-3.5" />
              <span>Save Profile</span>
            </button>
            <button type="button" class="btn btn-ghost btn-sm border border-base-300 flex items-center gap-1.5" @click="exportData">
              <Download class="size-3.5" />
              <span>Export JSON</span>
            </button>
            <button type="button" class="btn btn-ghost btn-sm text-base-content/60 flex items-center gap-1.5" @click="signOut">
              <LogOut class="size-3.5" />
              <span>Sign Out</span>
            </button>
            <button type="button" class="btn btn-error btn-outline btn-sm flex items-center gap-1.5" @click="deleteAccount">
              <Trash2 class="size-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Guest CTA -->
      <div v-else class="rounded-xl border border-primary/25 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-bold text-sm text-base-content">You are currently typing in Guest Mode</h3>
          <p class="text-xs text-base-content/60 mt-0.5">
            Your scores and preferences are cached locally. Create a free account to back them up securely to the cloud.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink to="/login" class="btn btn-primary btn-sm px-5 font-semibold flex items-center gap-1.5">
            <span>Sign In / Register</span>
            <ArrowRight class="size-3.5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 2. THEME & COLORS -->
    <section class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/60 pb-4">
        <div>
          <h2 class="text-base font-bold text-base-content flex items-center gap-2">
            <Palette class="size-4 text-primary" />
            <span>Theme & Palette</span>
          </h2>
          <p class="text-xs text-base-content/50 font-mono">Select from high-contrast presets or follow OS system scheme.</p>
        </div>

        <div class="join border border-base-300">
          <button
            type="button"
            class="btn btn-xs join-item font-mono"
            :class="themeFilter === 'all' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/60'"
            @click="themeFilter = 'all'"
          >All</button>
          <button
            type="button"
            class="btn btn-xs join-item font-mono"
            :class="themeFilter === 'dark' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/60'"
            @click="themeFilter = 'dark'"
          >Dark</button>
          <button
            type="button"
            class="btn btn-xs join-item font-mono"
            :class="themeFilter === 'light' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/60'"
            @click="themeFilter = 'light'"
          >Light</button>
          <button
            type="button"
            class="btn btn-xs join-item font-mono flex items-center gap-1.5"
            :class="themeFilter === 'fav' ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/60'"
            @click="themeFilter = 'fav'"
          >
            <Star class="size-3" :class="themeFilter === 'fav' ? 'fill-current' : ''" />
            <span>Starred</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 max-h-96 overflow-y-auto pr-1">
        <button
          v-for="theme in filteredThemes"
          :key="theme.id"
          type="button"
          class="rounded-xl border p-3 text-left transition-all hover:border-primary/60 group relative"
          :class="settings.theme === theme.id ? 'border-primary bg-primary/10 shadow-xs' : 'border-base-300 bg-base-100/70'"
          @click="settings.theme = theme.id"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="flex gap-1">
              <span class="size-3.5 rounded-full" :style="{ background: theme.colors.primary }" />
              <span class="size-3.5 rounded-full" :style="{ background: theme.colors.secondary }" />
              <span class="size-3.5 rounded-full border border-base-content/20" :style="{ background: theme.colors.base }" />
            </span>
            <span
              class="cursor-pointer transition-colors"
              :class="settings.themeFavorites?.includes(theme.id) ? 'text-primary' : 'text-base-content/30 hover:text-base-content/60'"
              role="button"
              :title="settings.themeFavorites?.includes(theme.id) ? 'Remove favorite' : 'Add to favorites'"
              @click.stop="toggleFavorite(theme.id)"
            >
              <Star class="size-3.5" :class="settings.themeFavorites?.includes(theme.id) ? 'fill-primary' : ''" />
            </span>
          </div>

          <div class="flex items-center justify-between gap-1">
            <span class="text-xs font-semibold truncate">{{ theme.label }}</span>
            <span v-if="theme.contrastWarning" class="badge badge-warning badge-xs shrink-0" title="Low contrast">!</span>
          </div>
        </button>
      </div>

      <!-- Follow system toggle -->
      <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <label class="flex items-center gap-3 cursor-pointer">
          <input v-model="settings.themeAuto" type="checkbox" class="toggle toggle-primary toggle-sm">
          <div>
            <p class="font-semibold text-base-content">Follow OS System Mode</p>
            <p class="text-[11px] text-base-content/50 font-mono">Auto-switch themes based on prefers-color-scheme</p>
          </div>
        </label>

        <div v-if="settings.themeAuto" class="flex items-center gap-2 font-mono">
          <label class="text-[11px] opacity-60">Light:</label>
          <select v-model="settings.themeLight" class="select select-bordered select-xs">
            <option v-for="t in themes.filter(item => item.type === 'light')" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
          <label class="text-[11px] opacity-60 ml-2">Dark:</label>
          <select v-model="settings.themeDark" class="select select-bordered select-xs">
            <option v-for="t in themes.filter(item => item.type === 'dark')" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 3. APPEARANCE & ERGONOMICS -->
    <section class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-5">
      <div class="border-b border-base-300/60 pb-3">
        <h2 class="text-base font-bold text-base-content flex items-center gap-2">
          <Keyboard class="size-4 text-primary" />
          <span>Appearance & Caret</span>
        </h2>
        <p class="text-xs text-base-content/50 font-mono">Text size, width, font family, and caret style.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Font Family</label>
          <p class="text-[11px] text-base-content/50 font-mono">JetBrains Mono is tuned for coding & typing accuracy.</p>
          <select v-model="settings.appearance.fontFamily" class="select select-bordered select-sm w-full font-mono text-sm">
            <option value="mono">JetBrains Mono (Monospace)</option>
            <option value="sans">Inter (Sans-serif)</option>
          </select>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-base-content">Font Size</label>
            <span class="badge badge-primary badge-xs font-mono">{{ settings.appearance.fontSize }}rem</span>
          </div>
          <p class="text-[11px] text-base-content/50 font-mono">Adjust scale of text during typing sessions.</p>
          <input v-model.number="settings.appearance.fontSize" type="range" min="1" max="2.5" step="0.1" class="range range-primary range-sm">
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Text Viewport Width</label>
          <p class="text-[11px] text-base-content/50 font-mono">Controls horizontal line wrap width.</p>
          <select v-model="settings.appearance.textWidth" class="select select-bordered select-sm w-full font-mono text-sm">
            <option value="narrow">Narrow (Compact)</option>
            <option value="medium">Medium (Standard)</option>
            <option value="wide">Wide (Expansive)</option>
          </select>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Caret Style</label>
          <p class="text-[11px] text-base-content/50 font-mono">Visual representation of your typing cursor.</p>
          <select v-model="settings.appearance.caretStyle" class="select select-bordered select-sm w-full font-mono text-sm capitalize">
            <option value="line">Line (Vertical |)</option>
            <option value="block">Block (Filled rectangle)</option>
            <option value="underline">Underline (Bottom line _)</option>
            <option value="outline">Outline (Framed box)</option>
          </select>
        </div>
      </div>

      <!-- Toggles Grid -->
      <div class="grid gap-3 sm:grid-cols-2 pt-2">
        <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-xs font-semibold">Active Keyboard Animation</p>
            <p class="text-[11px] text-base-content/50 font-mono">Show animated on-screen keyboard highlighting pressed keys in real-time</p>
          </div>
          <input v-model="settings.appearance.showKeyboard" type="checkbox" class="toggle toggle-primary toggle-sm">
        </label>

        <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-xs font-semibold">Focus Mode</p>
            <p class="text-[11px] text-base-content/50 font-mono">Auto-fade surrounding navbar & footer while typing</p>
          </div>
          <input v-model="settings.appearance.focusMode" type="checkbox" class="toggle toggle-primary toggle-sm">
        </label>

        <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-xs font-semibold">Smooth Caret</p>
            <p class="text-[11px] text-base-content/50 font-mono">Smooth sliding animation as caret moves between letters</p>
          </div>
          <input v-model="settings.appearance.smoothCaret" type="checkbox" class="toggle toggle-primary toggle-sm">
        </label>

        <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-xs font-semibold">Live Countdown / Timer</p>
            <p class="text-[11px] text-base-content/50 font-mono">Show remaining seconds counter while test is active</p>
          </div>
          <input v-model="settings.appearance.showTimer" type="checkbox" class="toggle toggle-primary toggle-sm">
        </label>

        <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-xs font-semibold">Live WPM</p>
            <p class="text-[11px] text-base-content/50 font-mono">Show real-time speed calculation during typing</p>
          </div>
          <input v-model="settings.appearance.showLiveWpm" type="checkbox" class="toggle toggle-primary toggle-sm">
        </label>

        <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-xs font-semibold">Reduce Motion</p>
            <p class="text-[11px] text-base-content/50 font-mono">Disable confetti, blinks, and screen transitions</p>
          </div>
          <input v-model="settings.appearance.reduceMotion" type="checkbox" class="toggle toggle-primary toggle-sm">
        </label>
      </div>
    </section>

    <!-- 4. TYPING BEHAVIOR -->
    <section class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-5">
      <div class="border-b border-base-300/60 pb-3">
        <h2 class="text-base font-bold text-base-content flex items-center gap-2">
          <Settings2 class="size-4 text-primary" />
          <span>Typing Behavior & Rules</span>
        </h2>
        <p class="text-xs text-base-content/50 font-mono">Error handling, backspace limits, and keyboard restart binds.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Stop on Error</label>
          <p class="text-[11px] text-base-content/50 font-mono">Blocks forward typing progression until mistake is fixed.</p>
          <select v-model="settings.behavior.stopOnError" class="select select-bordered select-sm w-full font-mono text-sm">
            <option value="off">Off (Free typing)</option>
            <option value="letter">Letter (Must type correct letter)</option>
            <option value="word">Word (Must fix word before space)</option>
          </select>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Backspace Scope</label>
          <p class="text-[11px] text-base-content/50 font-mono">Determine if you can backspace into completed words.</p>
          <select v-model="settings.behavior.backspaceRule" class="select select-bordered select-sm w-full font-mono text-sm">
            <option value="normal">Normal (Allow modifying previous words)</option>
            <option value="stop_at_word_start">Locked (Stop at start of current word)</option>
          </select>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Quick Restart Key</label>
          <p class="text-[11px] text-base-content/50 font-mono">Hotkeys to instantly restart the current typing test.</p>
          <select v-model="settings.behavior.quickRestart" class="select select-bordered select-sm w-full font-mono text-sm">
            <option value="both">Tab or Escape</option>
            <option value="tab">Tab only</option>
            <option value="esc">Escape only</option>
          </select>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Interface Language</label>
          <p class="text-[11px] text-base-content/50 font-mono">UI display locale and localization keys.</p>
          <select :value="locale" class="select select-bordered select-sm w-full font-mono text-sm" @change="changeLocale(($event.target as HTMLSelectElement).value as 'en' | 'id')">
            <option value="en">English (US)</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>
      </div>

      <label class="rounded-xl border border-base-300/70 bg-base-100/60 p-3.5 flex items-center justify-between cursor-pointer">
        <div>
          <p class="text-xs font-semibold">Blind Mode</p>
          <p class="text-[11px] text-base-content/50 font-mono">Hide red error highlights during session; evaluate accuracy only at completion</p>
        </div>
        <input v-model="settings.behavior.blindMode" type="checkbox" class="toggle toggle-primary toggle-sm">
      </label>
    </section>

    <!-- 5. SOUND EFFECTS -->
    <section class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-5">
      <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
        <div>
          <h2 class="text-base font-bold text-base-content flex items-center gap-2">
            <Volume2 class="size-4 text-primary" />
            <span>Keyboard Sound Effects</span>
          </h2>
          <p class="text-xs text-base-content/50 font-mono">Synthesized click feedback generated via WebAudio API.</p>
        </div>
        <input v-model="settings.sound.enabled" type="checkbox" class="toggle toggle-primary toggle-sm">
      </div>

      <div v-if="settings.sound.enabled" class="grid gap-4 sm:grid-cols-2 pt-1">
        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Sound Pack</label>
          <select v-model="settings.sound.pack" class="select select-bordered select-sm w-full font-mono text-sm capitalize">
            <option value="soft">Soft Click (Sine wave)</option>
            <option value="mechanical">Mechanical Switch (Square wave)</option>
            <option value="typewriter">Typewriter (Sawtooth)</option>
          </select>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-base-content">Audio Volume</label>
            <span class="badge badge-primary badge-xs font-mono">{{ Math.round((settings.sound.volume ?? 0.4) * 100) }}%</span>
          </div>
          <input v-model.number="settings.sound.volume" type="range" min="0" max="1" step="0.05" class="range range-primary range-sm">
        </div>
      </div>
    </section>

    <!-- 6. TRAINING GOALS -->
    <section class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-5">
      <div class="border-b border-base-300/60 pb-3">
        <h2 class="text-base font-bold text-base-content flex items-center gap-2">
          <Target class="size-4 text-primary" />
          <span>Training Goals</span>
        </h2>
        <p class="text-xs text-base-content/50 font-mono">Daily target benchmarks tracked on your dashboard.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Daily Test Count Target</label>
          <input v-model.number="settings.goals.dailyTests" type="number" min="1" max="100" class="input input-bordered input-sm w-full font-mono text-sm">
          <p class="text-[10px] text-base-content/50 font-mono">Recommended: 10–25 tests per day</p>
        </div>

        <div class="rounded-xl border border-base-300/70 bg-base-100/60 p-4 space-y-1.5">
          <label class="block text-xs font-semibold text-base-content">Target Speed (WPM)</label>
          <input v-model.number="settings.goals.targetWpm" type="number" min="10" max="300" class="input input-bordered input-sm w-full font-mono text-sm">
          <p class="text-[10px] text-base-content/50 font-mono">Benchmark speed shown in progress rings</p>
        </div>
      </div>
    </section>

    <!-- 7. DANGER ZONE & RESET -->
    <section class="rounded-2xl border border-error/25 bg-error/5 p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-error uppercase font-mono tracking-wider flex items-center gap-1.5">
            <AlertTriangle class="size-4 text-error" />
            <span>Danger Zone</span>
          </h2>
          <p class="text-xs text-base-content/60">Reset preferences or purge offline session results.</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-1">
        <button type="button" class="btn btn-ghost btn-sm border border-base-300 text-xs" @click="clearHistory">
          Purge Local Test History
        </button>
        <button type="button" class="btn btn-error btn-outline btn-sm text-xs" @click="reset">
          Restore All Settings to Defaults
        </button>
      </div>
    </section>
  </div>
</template>
