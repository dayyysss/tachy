<script setup lang="ts">
import { getTheme } from '#shared/config/themes'

interface Command {
  id: string
  label: string
  hint?: string
  run: () => void
}

const open = ref(false)
const query = ref('')
const active = ref(0)
const router = useRouter()
const { setTheme, themes } = useTheme()
const store = useTestStore()

const commands = computed<Command[]>(() => {
  const list: Command[] = [
    { id: 'home', label: 'Go to typing test', hint: 'page', run: () => router.push('/') },
    { id: 'leaderboard', label: 'Go to leaderboard', hint: 'page', run: () => router.push('/leaderboard') },
    { id: 'daily', label: 'Go to daily challenge', hint: 'page', run: () => router.push('/daily') },
    { id: 'dashboard', label: 'Go to dashboard', hint: 'page', run: () => router.push('/dashboard') },
    { id: 'settings', label: 'Go to settings', hint: 'page', run: () => router.push('/settings') },
    { id: 'about', label: 'Go to about', hint: 'page', run: () => router.push('/about') },
    { id: 'lang-en', label: 'Language: English', hint: 'language', run: () => { store.setConfig({ language: 'en' }); router.push('/') } },
    { id: 'lang-id', label: 'Language: Bahasa Indonesia', hint: 'language', run: () => { store.setConfig({ language: 'id' }); router.push('/') } },
    { id: 'mode-time', label: 'Mode: time 30s', hint: 'mode', run: () => { store.setConfig({ mode: 'time', contentType: 'words', amount: 30 }); router.push('/') } },
    { id: 'mode-words', label: 'Mode: 25 words', hint: 'mode', run: () => { store.setConfig({ mode: 'words', contentType: 'words', amount: 25 }); router.push('/') } },
    { id: 'mode-quote', label: 'Mode: quote', hint: 'mode', run: () => { store.setConfig({ mode: 'quote', contentType: 'quotes', amount: 0 }); router.push('/') } },
    { id: 'mode-zen', label: 'Mode: zen', hint: 'mode', run: () => { store.setConfig({ mode: 'zen', contentType: 'zen', amount: 0 }); router.push('/') } },
  ]

  for (const id of themes) {
    const theme = getTheme(id)
    list.push({ id: `theme-${id}`, label: `Theme: ${theme.label}`, hint: theme.type, run: () => setTheme(id) })
  }

  return list
})

const filtered = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return commands.value.slice(0, 12)
  return commands.value.filter(command => `${command.label} ${command.hint ?? ''}`.toLowerCase().includes(value)).slice(0, 12)
})

function close() {
  open.value = false
  query.value = ''
  active.value = 0
}

function execute(command: Command | undefined) {
  if (!command) return
  command.run()
  close()
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
    return
  }
  if (!open.value) return
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowDown') {
    event.preventDefault()
    active.value = (active.value + 1) % filtered.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = (active.value - 1 + filtered.value.length) % filtered.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    execute(filtered.value[active.value])
  }
}

function onOpenPalette() {
  open.value = true
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('open-palette', onOpenPalette)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('open-palette', onOpenPalette)
})

watch(filtered, () => { active.value = 0 })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]" @click.self="close">
    <div class="w-full max-w-lg overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-xl">
      <input
        v-model="query"
        autofocus
        placeholder="Type a command…"
        class="w-full border-b border-base-300 bg-transparent px-4 py-3 text-sm outline-none"
        aria-label="Command palette"
      >
      <ul class="max-h-80 overflow-y-auto p-1">
        <li v-for="(command, index) in filtered" :key="command.id">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-btn px-3 py-2 text-left text-sm"
            :class="{ 'bg-base-200 text-primary': index === active }"
            @mouseenter="active = index"
            @click="execute(command)"
          >
            <span>{{ command.label }}</span>
            <span class="text-xs uppercase opacity-40">{{ command.hint }}</span>
          </button>
        </li>
        <li v-if="!filtered.length" class="px-3 py-6 text-center text-sm opacity-50">No matches.</li>
      </ul>
      <p class="border-t border-base-300 px-4 py-2 text-xs opacity-40">↑↓ navigate · Enter run · Esc close</p>
    </div>
  </div>
</template>
