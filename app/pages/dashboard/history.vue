<script setup lang="ts">
definePageMeta({ middleware: 'member' })

useSeo('dashboard')
const store = useTestStore()
const { user } = useAuth()

interface ServerTestItem {
  id: string
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  language: string
  contentType: string
  mode: string
  amount: number | null
  durationMs: number
  wordsTyped: number
  status: string
  createdAt: string
}

const page = ref(1)
const serverRows = ref<ServerTestItem[]>([])
const hasNext = ref(false)
const isAuthenticated = computed(() => Boolean(user.value))
const pending = ref(false)
const toast = useToast()

async function loadHistory() {
  pending.value = true
  try {
    const res = await $fetch<{ rows: ServerTestItem[]; next: number | null }>('/api/me/history', {
      query: { page: page.value },
    })
    serverRows.value = res.rows
    hasNext.value = Boolean(res.next)
    isAuthenticated.value = true
  } catch {
    isAuthenticated.value = false
  } finally {
    pending.value = false
  }
}

onMounted(loadHistory)
watch(page, loadHistory)

function clearLocal() {
  store.clearHistory()
  toast.success('Local test history cleared.')
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/dashboard" class="text-xs text-primary font-mono hover:underline">← Dashboard</NuxtLink>
        </div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight">
          {{ isAuthenticated ? 'Account Test History' : 'Local Test History' }}
        </h1>
        <p class="text-xs text-base-content/60">
          {{ isAuthenticated ? 'All verified tests recorded in your account database with replay archives.' : 'Tests stored in your browser session (capped at last 50).' }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="!isAuthenticated && store.history.length"
          type="button"
          class="btn btn-ghost btn-xs text-error"
          @click="clearLocal"
        >
          Clear local history
        </button>
        <NuxtLink v-if="!isAuthenticated" to="/login" class="btn btn-primary btn-sm">
          Sign in to sync permanently
        </NuxtLink>
      </div>
    </div>

    <!-- Authenticated Server History -->
    <div v-if="isAuthenticated" class="space-y-4">
      <div class="overflow-x-auto rounded-box border border-base-300 bg-base-200/30">
        <table class="table table-sm">
          <thead class="bg-base-200/60 font-mono text-[11px] uppercase tracking-wider text-base-content/50">
            <tr>
              <th>WPM</th>
              <th>Raw</th>
              <th>Accuracy</th>
              <th>Consistency</th>
              <th>Mode</th>
              <th>Lang</th>
              <th>Date</th>
              <th class="text-right">Replay</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pending"><td colspan="8" class="py-8 text-center opacity-50 font-sans text-xs">Loading history…</td></tr>
            <tr v-else-if="!serverRows.length"><td colspan="8" class="py-8 text-center opacity-50 font-sans text-xs">No tests found in your account. <NuxtLink to="/" class="link link-primary">Take a test</NuxtLink>.</td></tr>
            <tr v-for="entry in serverRows" :key="entry.id" class="hover:bg-base-200/50 transition-colors font-mono text-xs">
              <td class="font-bold text-primary tabular-nums">{{ Math.round(entry.wpm) }}</td>
              <td class="tabular-nums opacity-60">{{ Math.round(entry.rawWpm) }}</td>
              <td class="tabular-nums">{{ Math.round(entry.accuracy) }}%</td>
              <td class="tabular-nums opacity-60">{{ Math.round(entry.consistency) }}%</td>
              <td>
                <span class="badge badge-xs border border-base-300 bg-base-100 font-mono">
                  {{ entry.mode }}<span v-if="entry.amount">·{{ entry.amount }}</span>
                </span>
              </td>
              <td class="uppercase text-[11px] opacity-75">{{ entry.language }}</td>
              <td class="text-xs opacity-50">{{ new Date(entry.createdAt).toLocaleDateString() }}</td>
              <td class="text-right">
                <NuxtLink :to="`/replay/${entry.id}`" class="btn btn-ghost btn-xs text-primary font-mono">
                  view →
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between font-mono text-xs text-base-content/60">
        <span>Page {{ page }}</span>
        <div class="flex gap-1">
          <button type="button" class="btn btn-xs btn-ghost border border-base-300" :disabled="page <= 1" @click="page--">Prev</button>
          <button type="button" class="btn btn-xs btn-ghost border border-base-300" :disabled="!hasNext" @click="page++">Next</button>
        </div>
      </div>
    </div>

    <!-- Guest Local History Fallback -->
    <div v-else class="space-y-4">
      <div class="overflow-x-auto rounded-box border border-base-300 bg-base-200/30">
        <table class="table table-sm">
          <thead class="bg-base-200/60 font-mono text-[11px] uppercase tracking-wider text-base-content/50">
            <tr>
              <th>WPM</th><th>Raw</th><th>Accuracy</th><th>Mode</th><th>Amount</th><th>Lang</th><th>Words</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!store.history.length">
              <td colspan="8" class="py-8 text-center text-sm opacity-50 font-sans">No local tests yet. <NuxtLink to="/" class="link link-primary">Take a test</NuxtLink>.</td>
            </tr>
            <tr v-for="entry in store.history" :key="entry.id" class="hover:bg-base-200/50 font-mono text-xs">
              <td class="font-bold text-primary tabular-nums">{{ Math.round(entry.wpm) }}</td>
              <td class="tabular-nums opacity-60">{{ Math.round(entry.rawWpm) }}</td>
              <td class="tabular-nums">{{ Math.round(entry.accuracy) }}%</td>
              <td>{{ entry.mode }}</td>
              <td>{{ entry.amount || '—' }}</td>
              <td class="uppercase">{{ entry.language }}</td>
              <td class="tabular-nums opacity-60">{{ entry.wordsTyped }}</td>
              <td class="text-xs opacity-50">{{ new Date(entry.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
