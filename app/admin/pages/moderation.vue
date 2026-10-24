<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const page = ref(1)
const selected = ref<string[]>([])
const { data, error, refresh, pending } = await useFetch('/api/admin/tests/flagged', { query: { page } })

const allSelected = computed({
  get: () => Boolean(data.value?.rows?.length && selected.value.length === data.value.rows.length),
  set: (val: boolean) => {
    selected.value = val ? (data.value?.rows?.map(r => r.id) ?? []) : []
  },
})

async function review(id: string, action: 'approve' | 'reject' | 'delete') {
  if (action === 'delete' && !window.confirm('Delete this test permanently?')) return
  const note = action === 'reject' ? window.prompt('Reason for rejection') ?? undefined : undefined
  await $fetch(`/api/admin/tests/${id}/review`, { method: 'POST', body: { action, note } })
  selected.value = selected.value.filter(item => item !== id)
  await refresh()
}

async function bulkReview(action: 'approve' | 'reject' | 'delete') {
  if (!selected.value.length) return
  if (action === 'delete' && !window.confirm(`Delete ${selected.value.length} selected tests permanently?`)) return
  const note = action === 'reject' ? window.prompt('Reason for rejection') ?? undefined : undefined

  for (const id of selected.value) {
    try {
      await $fetch(`/api/admin/tests/${id}/review`, { method: 'POST', body: { action, note } })
    } catch {
      // ignore individual failure
    }
  }
  selected.value = []
  await refresh()
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 class="text-xl font-semibold">Moderation</h1>
        <p class="text-sm opacity-60">Flagged tests are excluded from boards and PBs until approved.</p>
      </div>
      <div v-if="selected.length" class="flex items-center gap-2">
        <span class="text-xs opacity-60">{{ selected.length }} selected</span>
        <button type="button" class="btn btn-success btn-xs" @click="bulkReview('approve')">Approve all</button>
        <button type="button" class="btn btn-warning btn-xs" @click="bulkReview('reject')">Reject all</button>
        <button type="button" class="btn btn-error btn-xs" @click="bulkReview('delete')">Delete all</button>
      </div>
    </div>

    <p v-if="error" class="alert alert-warning mt-4 text-sm">Moderation data unavailable (database/auth not configured).</p>

    <div class="mt-4 space-y-2">
      <div v-if="data?.rows?.length" class="flex items-center gap-2 px-2 py-1 text-xs opacity-60">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="allSelected" type="checkbox" class="checkbox checkbox-xs">
          <span>Select all on page</span>
        </label>
      </div>

      <div v-if="pending" class="rounded-box border border-base-300 p-6 text-center text-sm opacity-50">Loading…</div>
      <div v-else-if="!data?.rows?.length" class="rounded-box border border-base-300 p-6 text-center text-sm opacity-50">
        Queue is empty.
      </div>
      <article v-for="row in data?.rows" :key="row.id" class="rounded-box border border-base-300 bg-base-200/40 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <input v-model="selected" type="checkbox" :value="row.id" class="checkbox checkbox-sm mt-1">
            <div>
              <p class="font-medium">
                {{ Math.round(row.wpm) }} WPM · {{ Math.round(row.accuracy) }}% · {{ row.language.toUpperCase() }} · {{ row.mode }}
              </p>
              <p class="text-xs opacity-50">
                user {{ row.userId }} · {{ (row.durationMs / 1000).toFixed(1) }}s · {{ new Date(row.createdAt).toLocaleString() }}
              </p>
              <div class="mt-2 flex flex-wrap gap-1">
                <span v-for="reason in (row.flagReasons as string[] | null) ?? []" :key="reason" class="badge badge-warning badge-sm">{{ reason }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-1">
            <NuxtLink :to="`/replay/${row.id}`" target="_blank" class="btn btn-ghost btn-xs">replay</NuxtLink>
            <button type="button" class="btn btn-success btn-xs" @click="review(row.id, 'approve')">approve</button>
            <button type="button" class="btn btn-warning btn-xs" @click="review(row.id, 'reject')">reject</button>
            <button type="button" class="btn btn-error btn-xs" @click="review(row.id, 'delete')">delete</button>
          </div>
        </div>
        <p class="mt-3 font-mono text-xs opacity-60">test {{ row.id }}</p>
      </article>
    </div>

    <div class="mt-3 flex justify-end gap-2">
      <button type="button" class="btn btn-sm" :disabled="page <= 1" @click="page--">Prev</button>
      <button type="button" class="btn btn-sm" :disabled="!data?.rows?.length" @click="page++">Next</button>
    </div>
  </div>
</template>
