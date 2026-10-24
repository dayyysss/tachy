<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const page = ref(1)
const { data, error, pending } = await useFetch('/api/admin/audit', { query: { page } })
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">Audit log</h1>
    <p v-if="error" class="alert alert-warning mt-4 text-sm">Audit data unavailable (database/auth not configured).</p>

    <div class="mt-4 overflow-x-auto rounded-box border border-base-300">
      <table class="table table-sm">
        <thead>
          <tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th><th>Changes</th></tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="6" class="py-6 text-center opacity-50">Loading…</td></tr>
          <tr v-else-if="!data?.rows?.length"><td colspan="6" class="py-6 text-center opacity-50">No entries.</td></tr>
          <tr v-for="entry in data?.rows" :key="entry.id">
            <td class="whitespace-nowrap text-xs opacity-60">{{ new Date(entry.createdAt).toLocaleString() }}</td>
            <td class="font-mono text-xs">{{ entry.actorId }}</td>
            <td>{{ entry.action }}</td>
            <td class="text-xs">{{ entry.targetType }}<span v-if="entry.targetId" class="opacity-50"> · {{ entry.targetId }}</span></td>
            <td class="text-xs">{{ entry.ip }}</td>
            <td>
              <details class="text-xs">
                <summary class="cursor-pointer opacity-50">view</summary>
                <pre class="mt-1 max-w-xs overflow-auto whitespace-pre-wrap opacity-70">{{ { before: entry.before, after: entry.after } }}</pre>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex justify-end gap-2">
      <button type="button" class="btn btn-sm" :disabled="page <= 1" @click="page--">Prev</button>
      <button type="button" class="btn btn-sm" :disabled="!data?.rows?.length" @click="page++">Next</button>
    </div>
  </div>
</template>
