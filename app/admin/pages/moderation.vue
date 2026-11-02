<script setup lang="ts">
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  Play,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })

const page = ref(1)
const selected = ref<string[]>([])
const toast = useToast()
const dialog = useDialog()
const { data, error, refresh, pending } = await useFetch('/api/admin/tests/flagged', { query: { page } })

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
    } catch {
      // ignore individual failure
    }
  }
  toast.success(`Processed ${count} tests as ${action}d.`)
  selected.value = []
  await refresh()
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-5 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <ShieldAlert class="size-4 text-warning" />
          <h1 class="text-xl font-bold tracking-tight">Anti-Cheat Moderation Queue</h1>
          <span v-if="data?.rows?.length" class="badge badge-warning badge-xs font-mono font-bold">
            {{ data.rows.length }} flagged
          </span>
        </div>
        <p class="mt-1 text-xs text-base-content/60">
          Suspicious typing test sessions excluded from global leaderboards pending manual administrator review.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Bulk actions if items selected -->
        <div v-if="selected.length" class="flex items-center gap-1.5 bg-base-300/80 p-1 rounded-xl">
          <span class="text-xs font-mono px-2 font-medium">{{ selected.length }} selected</span>
          <button type="button" class="btn btn-success btn-xs gap-1 font-mono" @click="bulkReview('approve')">
            <CheckCircle2 class="size-3" />
            <span>Approve</span>
          </button>
          <button type="button" class="btn btn-warning btn-xs gap-1 font-mono" @click="bulkReview('reject')">
            <XCircle class="size-3" />
            <span>Reject</span>
          </button>
          <button type="button" class="btn btn-error btn-xs gap-1 font-mono" @click="bulkReview('delete')">
            <Trash2 class="size-3" />
            <span>Delete</span>
          </button>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-ghost gap-1.5 border border-base-300 font-mono text-xs"
          :disabled="pending"
          @click="refresh()"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': pending }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <p v-if="error" class="alert alert-warning text-xs font-mono">
      Moderation data unavailable (database or auth connection error).
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
    <div v-if="pending" class="rounded-2xl border border-base-300 bg-base-200/20 p-12 text-center text-xs font-mono text-base-content/50">
      <span class="loading loading-spinner loading-md text-primary mb-2 block mx-auto" />
      Loading flagged records...
    </div>

    <div
      v-else-if="!data?.rows?.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200/20 p-12 text-center text-xs font-mono text-base-content/50"
    >
      <div class="size-10 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 class="size-5" />
      </div>
      <p class="font-semibold text-sm text-base-content mb-1">Queue is Clear</p>
      <p>No test sessions currently flagged for anti-cheat verification.</p>
    </div>

    <!-- Cards List -->
    <div v-else class="space-y-3">
      <article
        v-for="row in data.rows"
        :key="row.id"
        class="rounded-2xl border border-base-300 bg-base-200/40 p-4 transition-all hover:bg-base-200/70 hover:border-base-300/90 shadow-xs"
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
                <span class="badge badge-sm font-mono border-base-300 bg-base-300/40">{{ Math.round(row.accuracy) }}% ACC</span>
                <span class="badge badge-sm font-mono uppercase bg-base-300/40">{{ row.language }}</span>
                <span class="badge badge-sm font-mono badge-ghost">{{ row.mode }}</span>
              </div>

              <p class="mt-1.5 text-xs text-base-content/60 font-mono truncate">
                User: <code class="text-base-content/80 font-bold">{{ row.userId }}</code> ·
                Duration: {{ (row.durationMs / 1000).toFixed(1) }}s ·
                {{ new Date(row.createdAt).toLocaleString() }}
              </p>

              <!-- Flag Reasons -->
              <div class="mt-2.5 flex flex-wrap gap-1.5">
                <span
                  v-for="reason in (row.flagReasons as string[] | null) ?? []"
                  :key="reason"
                  class="badge badge-warning badge-xs font-mono gap-1 py-1"
                >
                  <AlertTriangle class="size-2.5" />
                  <span>{{ reason }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-1.5 shrink-0">
            <NuxtLink
              :to="`/replay/${row.id}`"
              target="_blank"
              class="btn btn-ghost btn-xs gap-1 font-mono text-xs hover:bg-base-300"
              title="Open keystroke replay viewer"
            >
              <Play class="size-3 text-secondary" />
              <span>Replay</span>
            </NuxtLink>

            <button
              type="button"
              class="btn btn-success btn-outline btn-xs gap-1 font-mono text-xs"
              @click="review(row.id, 'approve')"
            >
              <CheckCircle2 class="size-3" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              class="btn btn-warning btn-outline btn-xs gap-1 font-mono text-xs"
              @click="review(row.id, 'reject')"
            >
              <XCircle class="size-3" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs text-error hover:bg-error/10 font-mono text-xs"
              @click="review(row.id, 'delete')"
            >
              <Trash2 class="size-3" />
              <span>Del</span>
            </button>
          </div>
        </div>

        <div class="mt-3 pt-2 border-t border-base-300/40 flex items-center justify-between text-[10px] font-mono text-base-content/40">
          <span>Session ID: {{ row.id }}</span>
          <span>Status: Quarantined</span>
        </div>
      </article>
    </div>

    <!-- Pagination Footer -->
    <div v-if="data?.rows?.length" class="flex items-center justify-between text-xs text-base-content/60 font-mono pt-2">
      <span>Showing flagged queue</span>
      <div class="flex gap-1">
        <button
          type="button"
          class="btn btn-xs btn-ghost border border-base-300 gap-1"
          :disabled="page <= 1"
          @click="page--"
        >
          <ChevronLeft class="size-3" />
          <span>Prev</span>
        </button>
        <span class="btn btn-xs btn-ghost no-animation">Page {{ page }}</span>
        <button
          type="button"
          class="btn btn-xs btn-ghost border border-base-300 gap-1"
          :disabled="!data?.rows?.length || data.rows.length < 25"
          @click="page++"
        >
          <span>Next</span>
          <ChevronRight class="size-3" />
        </button>
      </div>
    </div>
  </div>
</template>
