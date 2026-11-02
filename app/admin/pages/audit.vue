<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const page = ref(1)
const { data, error, pending } = await useFetch('/api/admin/audit', { query: { page } })
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-5 shadow-xs">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Administrative Audit Logs</h1>
        <p class="mt-0.5 text-xs text-base-content/60">
          Append-only audit trail tracking security mutations, role changes, reviews, and asset management.
        </p>
      </div>

      <div class="flex items-center gap-2 text-xs font-mono">
        <span class="rounded bg-base-300 px-2 py-1">Page {{ page }}</span>
      </div>
    </div>

    <p v-if="error" class="alert alert-warning text-sm">Audit data unavailable (database/auth not configured).</p>

    <div class="overflow-x-auto rounded-box border border-base-300 bg-base-200/30">
      <table class="table table-sm">
        <thead class="bg-base-200/60 font-mono text-[11px] uppercase tracking-wider text-base-content/50">
          <tr><th>Timestamp</th><th>Actor ID</th><th>Action</th><th>Target</th><th>IP Origin</th><th>Payload Delta</th></tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="6" class="py-8 text-center opacity-50 font-sans text-xs">Loading audit entries…</td></tr>
          <tr v-else-if="!data?.rows?.length"><td colspan="6" class="py-8 text-center opacity-50 font-sans text-xs">No audit events recorded yet.</td></tr>
          <tr v-for="entry in data?.rows" :key="entry.id" class="hover:bg-base-200/50 font-mono text-xs">
            <td class="whitespace-nowrap opacity-60 text-[11px]">{{ new Date(entry.createdAt).toLocaleString() }}</td>
            <td class="font-medium text-primary text-[11px]">{{ (entry.actorId || 'system').slice(0, 14) }}</td>
            <td>
              <span class="badge badge-xs border border-primary/30 bg-primary/10 text-primary font-medium">
                {{ entry.action }}
              </span>
            </td>
            <td class="text-[11px] text-base-content/80">{{ entry.targetType }}<span v-if="entry.targetId" class="opacity-40"> : {{ (entry.targetId || '').slice(0, 8) }}</span></td>
            <td class="text-[11px] opacity-40">{{ entry.ip || '127.0.0.1' }}</td>
            <td>
              <details class="text-[11px]">
                <summary class="cursor-pointer text-primary underline underline-offset-2">Inspect JSON</summary>
                <pre class="mt-2 max-w-sm rounded bg-base-300/80 p-2 overflow-auto whitespace-pre-wrap text-[10px] leading-tight text-base-content/80">{{ JSON.stringify({ before: entry.before, after: entry.after }, null, 2) }}</pre>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-xs text-base-content/60 font-mono">
      <span>Event log is append-only</span>
      <div class="flex gap-1">
        <button type="button" class="btn btn-xs btn-ghost border border-base-300" :disabled="page <= 1" @click="page--">Prev</button>
        <button type="button" class="btn btn-xs btn-ghost border border-base-300" :disabled="!data?.rows?.length || data.rows.length < (data?.perPage || 50)" @click="page++">Next</button>
      </div>
    </div>
  </div>
</template>
