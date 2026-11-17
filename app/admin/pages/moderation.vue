<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  Play,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })

const page = ref(1)
const searchInput = ref('')
const debouncedQ = refDebounced(searchInput, 250)
const modeFilter = ref('')
const langFilter = ref('')
const selected = ref<string[]>([])

const toast = useToast()
const dialog = useDialog()

watch([debouncedQ, modeFilter, langFilter], () => {
  page.value = 1
  selected.value = []
})

const { data, error, refresh, pending } = await useFetch('/api/admin/tests/flagged', {
  query: { page, q: debouncedQ, mode: modeFilter, language: langFilter },
})

const allSelected = computed({
  get: () => Boolean(data.value?.rows?.length && selected.value.length === data.value.rows.length),
  set: (val: boolean) => {
    selected.value = val ? (data.value?.rows?.map(r => r.id) ?? []) : []
  },
})

async function review(id: string, action: 'approve' | 'reject' | 'delete') {
  if (action === 'delete') {
    const ok = await dialog.confirm({
      title: 'Delete Flagged Test?',
      message: 'This will permanently delete this typing test record from the database.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
  }
  let note: string | undefined
  if (action === 'reject') {
    const input = await dialog.prompt({
      title: 'Reject Flagged Test',
      message: 'Provide an internal reason for rejecting this test result:',
      placeholder: 'e.g. Impossible speed spike / bot intervals',
      confirmText: 'Reject',
    })
    if (input === null) return
    note = input || undefined
  }

  try {
    await $fetch(`/api/admin/tests/${id}/review`, { method: 'POST', body: { action, note } })
    toast.success(`Test marked as ${action}d.`)
    selected.value = selected.value.filter(item => item !== id)
    await refresh()
  } catch {
    toast.error(`Failed to ${action} test.`)
  }
}

async function bulkReview(action: 'approve' | 'reject' | 'delete') {
  if (!selected.value.length) return
  if (action === 'delete') {
    const ok = await dialog.confirm({
      title: `Delete ${selected.value.length} Flagged Tests?`,
      message: 'This will permanently remove all selected test sessions.',
      confirmText: 'Delete All',
      danger: true,
    })
    if (!ok) return
  }
  let note: string | undefined
  if (action === 'reject') {
    const input = await dialog.prompt({
      title: `Reject ${selected.value.length} Tests`,
      message: 'Provide an internal reason for rejecting these test results:',
      placeholder: 'e.g. Mass review rejection',
      confirmText: 'Reject All',
    })
    if (input === null) return
    note = input || undefined
  }

  let count = 0
  for (const id of selected.value) {
    try {
      await $fetch(`/api/admin/tests/${id}/review`, { method: 'POST', body: { action, note } })
      count++
    } catch {}
  }
  toast.success(`Processed ${count} tests as ${action}d.`)
  selected.value = []
  await refresh()
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Standard Header -->
    <AdminPageHeader
      title="Anti-Cheat Moderation Queue"
      subtitle="Suspicious typing test sessions excluded from global leaderboards pending manual administrator review."
      category="INTEGRITY & FAIR PLAY"
    >
      <template #actions>
        <span v-if="data?.rows?.length" class="badge badge-warning badge-sm font-mono font-bold">
          {{ data.rows.length }} Flagged
        </span>
        <button
          type="button"
          class="btn btn-sm btn-ghost border border-base-300 gap-1.5"
          :disabled="pending"
          @click="refresh()"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': pending }" />
          <span class="text-xs">Refresh</span>
        </button>
      </template>
    </AdminPageHeader>

    <!-- Toolbar: Search on Left, Filter on Right -->
    <div class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xs md:flex-row md:items-center md:justify-between">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
        <input
          v-model="searchInput"
          type="search"
          placeholder="Search by test ID, username, or email…"
          class="input input-bordered input-sm w-full pl-10 text-xs font-mono"
        >
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5 text-xs text-base-content/60 font-medium">
          <Filter class="size-3.5" />
          <span>Filters:</span>
        </div>

        <select v-model="modeFilter" class="select select-bordered select-sm text-xs">
          <option value="">All Modes</option>
          <option value="time">Time</option>
          <option value="words">Words</option>
          <option value="quote">Quote</option>
          <option value="code">Code</option>
        </select>

        <select v-model="langFilter" class="select select-bordered select-sm text-xs">
          <option value="">All Languages</option>
          <option value="en">English (en)</option>
          <option value="id">Indonesian (id)</option>
          <option value="code">Code</option>
        </select>

        <button
          v-if="searchInput || modeFilter || langFilter"
          type="button"
          class="btn btn-xs btn-ghost text-error"
          @click="searchInput = ''; modeFilter = ''; langFilter = ''"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Bulk Actions Floating Bar -->
    <Transition name="fade">
      <div
        v-if="selected.length"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 shadow-md"
      >
        <div class="flex items-center gap-2">
          <span class="badge badge-warning font-mono text-xs font-bold">{{ selected.length }}</span>
          <span class="text-xs font-semibold text-base-content">Session(s) selected for bulk moderation</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-xs btn-success font-semibold gap-1" @click="bulkReview('approve')">
            <CheckCircle2 class="size-3" />
            <span>Approve All</span>
          </button>
          <button type="button" class="btn btn-xs btn-warning font-semibold gap-1" @click="bulkReview('reject')">
            <XCircle class="size-3" />
            <span>Reject All</span>
          </button>
          <button type="button" class="btn btn-xs btn-error font-semibold gap-1" @click="bulkReview('delete')">
            <Trash2 class="size-3" />
            <span>Delete All</span>
          </button>
          <button type="button" class="btn btn-xs btn-ghost border border-base-300" @click="selected = []">
            Deselect
          </button>
        </div>
      </div>
    </Transition>

    <p v-if="error" class="alert alert-warning text-xs font-mono">
      Moderation data unavailable (database connection error).
    </p>

    <!-- Selection Bar -->
    <div v-if="data?.rows?.length" class="flex items-center justify-between px-2 text-xs text-base-content/60 font-mono">
      <label class="flex items-center gap-2 cursor-pointer hover:text-base-content transition-colors">
        <input v-model="allSelected" type="checkbox" class="checkbox checkbox-xs checkbox-primary">
        <span>Select all sessions on this page</span>
      </label>
      <span>Page {{ page }}</span>
    </div>

    <!-- Loading / Empty State -->
    <div v-if="pending" class="rounded-2xl border border-base-300 bg-base-100 p-12 text-center text-xs font-mono text-base-content/50 shadow-xs">
      <span class="loading loading-spinner loading-md text-primary mb-2 block mx-auto" />
      Loading flagged records...
    </div>

    <div
      v-else-if="!data?.rows?.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-12 text-center text-xs font-mono text-base-content/50 shadow-xs"
    >
      <div class="size-10 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 class="size-5" />
      </div>
      <p class="font-semibold text-sm text-base-content mb-1">Queue is Clear</p>
      <p>No test sessions currently flagged matching your filter.</p>
    </div>

    <!-- Cards List -->
    <div v-else class="space-y-3">
      <article
        v-for="row in data.rows"
        :key="row.id"
        class="rounded-2xl border border-base-300 bg-base-100 p-4 transition-all hover:border-primary/40 shadow-xs"
        :class="{ 'border-primary bg-primary/5': selected.includes(row.id) }"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <input
              v-model="selected"
              type="checkbox"
              :value="row.id"
              class="checkbox checkbox-xs checkbox-primary mt-1 shrink-0"
            >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-base font-bold text-primary">{{ Math.round(row.wpm) }} WPM</span>
                <span class="badge badge-sm font-mono border-base-300 bg-base-200/60">{{ Math.round(row.accuracy) }}% ACC</span>
                <span class="badge badge-sm font-mono uppercase bg-base-200/60">{{ row.language }}</span>
                <span class="badge badge-sm font-mono badge-ghost">{{ row.mode }}</span>
              </div>

              <div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-base-content/60 font-mono">
                <span v-if="row.username" class="font-semibold text-base-content">@{{ row.username }}</span>
                <span v-if="row.userEmail" class="opacity-60 truncate">({{ row.userEmail }})</span>
                <span class="opacity-40">·</span>
                <span>ID: {{ row.id.slice(0, 10) }}…</span>
                <span class="opacity-40">·</span>
                <span>{{ new Date(row.createdAt).toLocaleString() }}</span>
              </div>

              <!-- Flag Reasons -->
              <div v-if="row.flagReasons?.length" class="mt-2.5 flex flex-wrap gap-1.5">
                <span
                  v-for="reason in row.flagReasons"
                  :key="reason"
                  class="badge badge-xs font-mono border-warning/40 bg-warning/10 text-warning font-semibold py-1 px-2"
                >
                  <AlertTriangle class="size-2.5 mr-1" />
                  {{ reason }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 font-mono text-xs">
            <NuxtLink
              :to="`/replay/${row.id}`"
              target="_blank"
              class="btn btn-xs btn-ghost border border-base-300 gap-1"
            >
              <Play class="size-3" />
              <span>Replay</span>
            </NuxtLink>

            <button
              type="button"
              class="btn btn-xs btn-success gap-1 text-success-content"
              @click="review(row.id, 'approve')"
            >
              <CheckCircle2 class="size-3" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              class="btn btn-xs btn-warning gap-1 text-warning-content"
              @click="review(row.id, 'reject')"
            >
              <XCircle class="size-3" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              class="btn btn-xs btn-ghost text-error"
              title="Delete test record"
              @click="review(row.id, 'delete')"
            >
              <Trash2 class="size-3" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="data?.rows?.length" class="flex items-center justify-between text-xs text-base-content/60 font-mono">
      <span>Showing flagged tests</span>
      <div class="join">
        <button
          type="button"
          class="join-item btn btn-xs btn-ghost border border-base-300"
          :disabled="page <= 1"
          @click="page--"
        >
          Previous
        </button>
        <button
          type="button"
          class="join-item btn btn-xs btn-ghost border border-base-300"
          :disabled="!data?.rows?.length || data.rows.length < (data?.perPage || 25)"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
