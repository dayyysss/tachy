<script setup lang="ts">
import { themes } from '#shared/config/themes'
import { availableLanguages } from '#shared/config/languages'
import type { Settings } from '#shared/schemas/settings'

useSeo('settings')

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { setLocale, locale } = useI18n()
const testStore = useTestStore()
const { setTheme } = useTheme()
const toast = ref('')

watch(() => settings.value.theme, id => setTheme(id), { immediate: true })

function applyAuto() {
  if (!settings.value.themeAuto) return
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setTheme(dark ? settings.value.themeDark : settings.value.themeLight)
}

onMounted(applyAuto)
watch(() => settings.value.themeAuto, applyAuto)
watch([() => settings.value.themeLight, () => settings.value.themeDark], applyAuto)

function patchAppearance(patch: Partial<Settings['appearance']>) {
  settings.value = { ...settings.value, appearance: { ...settings.value.appearance, ...patch } }
}

function patchBehavior(patch: Partial<Settings['behavior']>) {
  settings.value = { ...settings.value, behavior: { ...settings.value.behavior, ...patch } }
}

function patchSound(patch: Partial<Settings['sound']>) {
  settings.value = { ...settings.value, sound: { ...settings.value.sound, ...patch } }
}

async function changeLocale(code: 'en' | 'id') {
  settings.value.language = code
  await setLocale(code)
}

function clearHistory() {
  testStore.clearHistory()
  toast.value = 'Local history cleared.'
}

function reset() {
  settingsStore.reset()
  toast.value = 'Settings reset.'
}

const sessionUser = ref<{ id: string; email: string; name: string; username?: string | null; isPublic?: boolean; timezone?: string } | null>(null)
const profile = ref({ username: '', displayName: '', timezone: 'UTC', isPublic: true })

onMounted(async () => {
  try {
    const session = await $fetch<{ user: typeof sessionUser.value }>('/api/auth/get-session')
    if (!session?.user) return
    sessionUser.value = session.user
    profile.value = {
      username: session.user.username ?? '',
      displayName: session.user.name ?? '',
      timezone: session.user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      isPublic: session.user.isPublic ?? true,
    }
  } catch {
    // guest
  }
})

async function saveProfile() {
  try {
    await $fetch('/api/me/profile', { method: 'PUT', body: profile.value })
    toast.value = 'Profile saved.'
  } catch {
    toast.value = 'Could not save profile. Username may be taken.'
  }
}

function exportData() {
  window.open('/api/me/export', '_blank')
}

async function deleteAccount() {
  if (!window.confirm('Delete your account and all tests permanently?')) return
  await $fetch('/api/me/account', { method: 'DELETE' })
  await navigateTo('/')
}
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-8">
    <div class="mb-6 flex items-end justify-between">
      <h1 class="text-2xl font-semibold">{{ $t('settings.title') }}</h1>
      <span v-if="toast" class="text-xs text-success">{{ toast }}</span>
    </div>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-base-content/50">{{ $t('settings.theme') }}</h2>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        <button
          v-for="theme in themes"
          :key="theme.id"
          type="button"
          class="rounded-box border p-3 text-left transition hover:border-primary"
          :class="settings.theme === theme.id ? 'border-primary' : 'border-base-300'"
          @click="settings.theme = theme.id"
        >
          <span class="mb-2 flex gap-1">
            <span class="size-4 rounded-full" :style="{ background: theme.colors.primary }" />
            <span class="size-4 rounded-full" :style="{ background: theme.colors.secondary }" />
            <span class="size-4 rounded-full" :style="{ background: theme.colors.accent }" />
          </span>
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs truncate">{{ theme.label }}</span>
            <span v-if="theme.contrastWarning" class="badge badge-warning badge-xs shrink-0" title="Low contrast">!</span>
          </div>
        </button>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label class="label cursor-pointer justify-start gap-2">
          <input v-model="settings.themeAuto" type="checkbox" class="toggle toggle-primary toggle-sm">
          <span class="label-text">Follow system theme</span>
        </label>
        <select v-model="settings.themeLight" class="select select-bordered select-xs">
          <option v-for="theme in themes.filter(item => item.type === 'light')" :key="theme.id" :value="theme.id">{{ theme.label }}</option>
        </select>
        <select v-model="settings.themeDark" class="select select-bordered select-xs">
          <option v-for="theme in themes.filter(item => item.type === 'dark')" :key="theme.id" :value="theme.id">{{ theme.label }}</option>
        </select>
      </div>
    </section>

    <section class="mb-8 grid gap-4 sm:grid-cols-2">
      <h2 class="col-span-full text-sm font-medium uppercase tracking-wide text-base-content/50">{{ $t('settings.appearance') }}</h2>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.fontFamily') }}</span>
        <select v-model="settings.appearance.fontFamily" class="select select-bordered select-sm">
          <option value="mono">Mono</option>
          <option value="sans">Sans</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.fontSize') }}</span>
        <input v-model.number="settings.appearance.fontSize" type="range" min="1" max="2.5" step="0.1" class="range range-primary range-sm">
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.textWidth') }}</span>
        <select v-model="settings.appearance.textWidth" class="select select-bordered select-sm">
          <option value="narrow">Narrow</option>
          <option value="medium">Medium</option>
          <option value="wide">Wide</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.quickRestart') }}</span>
        <select v-model="settings.behavior.quickRestart" class="select select-bordered select-sm">
          <option value="tab">Tab</option>
          <option value="esc">Esc</option>
          <option value="both">Both</option>
        </select>
      </label>
      <label class="label cursor-pointer justify-start gap-3">
        <input v-model="settings.appearance.showLiveWpm" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">{{ $t('settings.showLiveWpm') }}</span>
      </label>
      <label class="label cursor-pointer justify-start gap-3">
        <input v-model="settings.appearance.showLiveAccuracy" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">{{ $t('settings.showLiveAccuracy') }}</span>
      </label>
      <label class="label cursor-pointer justify-start gap-3">
        <input v-model="settings.appearance.showTimer" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">{{ $t('settings.showTimer') }}</span>
      </label>
      <label class="label cursor-pointer justify-start gap-3">
        <input v-model="settings.appearance.focusMode" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">{{ $t('settings.focusMode') }}</span>
      </label>
      <label class="label cursor-pointer justify-start gap-3">
        <input v-model="settings.appearance.reduceMotion" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">{{ $t('settings.reduceMotion') }}</span>
      </label>
    </section>

    <section class="mb-8 grid gap-4 sm:grid-cols-2">
      <h2 class="col-span-full text-sm font-medium uppercase tracking-wide text-base-content/50">{{ $t('settings.behavior') }}</h2>
      <label class="form-control">
        <span class="label-text mb-1">Stop on error</span>
        <select v-model="settings.behavior.stopOnError" class="select select-bordered select-sm">
          <option value="off">Off</option>
          <option value="letter">Letter</option>
          <option value="word">Word</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text mb-1">Backspace behavior</span>
        <select v-model="settings.behavior.backspaceRule" class="select select-bordered select-sm">
          <option value="normal">Allow previous words</option>
          <option value="stop_at_word_start">Stop at start of word</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.defaultLanguage') }}</span>
        <select v-model="settings.behavior.defaultLanguage" class="select select-bordered select-sm">
          <option v-for="language in availableLanguages" :key="language.code" :value="language.code">{{ language.label }}</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.language') }}</span>
        <select :value="locale" class="select select-bordered select-sm" @change="changeLocale(($event.target as HTMLSelectElement).value as 'en' | 'id')">
          <option value="en">English</option>
          <option value="id">Bahasa Indonesia</option>
        </select>
      </label>
      <label class="label cursor-pointer justify-start gap-3 sm:col-span-2">
        <input v-model="settings.behavior.blindMode" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">Blind mode (no error coloring)</span>
      </label>
    </section>

    <section class="mb-8 grid gap-4 sm:grid-cols-2">
      <h2 class="col-span-full text-sm font-medium uppercase tracking-wide text-base-content/50">{{ $t('settings.sound') }}</h2>
      <label class="label cursor-pointer justify-start gap-3">
        <input v-model="settings.sound.enabled" type="checkbox" class="toggle toggle-primary toggle-sm">
        <span class="label-text">{{ $t('settings.soundEnabled') }}</span>
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('settings.volume') }}</span>
        <input v-model.number="settings.sound.volume" type="range" min="0" max="1" step="0.05" class="range range-primary range-sm">
      </label>
    </section>

    <section class="mb-8 grid gap-4 sm:grid-cols-2">
      <h2 class="col-span-full text-sm font-medium uppercase tracking-wide text-base-content/50">Goals</h2>
      <label class="form-control">
        <span class="label-text mb-1">Daily tests</span>
        <input v-model.number="settings.goals.dailyTests" type="number" min="1" max="100" class="input input-bordered input-sm">
      </label>
      <label class="form-control">
        <span class="label-text mb-1">Target WPM</span>
        <input v-model.number="settings.goals.targetWpm" type="number" min="10" max="300" class="input input-bordered input-sm">
      </label>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-base-content/50">{{ $t('settings.account') }}</h2>

      <div v-if="sessionUser" class="grid gap-3 sm:grid-cols-2">
        <label class="form-control">
          <span class="label-text mb-1">Username</span>
          <input v-model="profile.username" class="input input-bordered input-sm" maxlength="24">
        </label>
        <label class="form-control">
          <span class="label-text mb-1">Display name</span>
          <input v-model="profile.displayName" class="input input-bordered input-sm" maxlength="48">
        </label>
        <label class="form-control">
          <span class="label-text mb-1">Timezone</span>
          <input v-model="profile.timezone" class="input input-bordered input-sm" maxlength="64">
        </label>
        <label class="label cursor-pointer justify-start gap-3 self-end">
          <input v-model="profile.isPublic" type="checkbox" class="toggle toggle-primary toggle-sm">
          <span class="label-text">Public profile</span>
        </label>
        <p class="text-xs opacity-50 sm:col-span-2">{{ sessionUser.email }}</p>
        <div class="flex flex-wrap gap-2 sm:col-span-2">
          <button type="button" class="btn btn-primary btn-sm" @click="saveProfile">Save profile</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="exportData">Export data</button>
          <button type="button" class="btn btn-error btn-outline btn-sm" @click="deleteAccount">Delete account</button>
        </div>
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <NuxtLink to="/login" class="btn btn-primary btn-sm">Sign in</NuxtLink>
        <button type="button" class="btn btn-ghost btn-sm" @click="clearHistory">{{ $t('settings.clearHistory') }}</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="reset">{{ $t('settings.reset') }}</button>
      </div>
    </section>
  </div>
</template>

