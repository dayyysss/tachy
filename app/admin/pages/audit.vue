<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Shield,
  FileText,
  Code,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })

const page = ref(1)
const searchInput = ref('')
const debouncedQ = refDebounced(searchInput, 250)
const actionFilter = ref('')

watch([debouncedQ, actionFilter], () => {
  page.value = 1
})

const { data, error, pending, refresh } = await useFetch('/api/admin/audit', {
  query: { page, q: debouncedQ, action: actionFilter },
})

const selectedEntry = ref<any | null>(null)
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Standard Header -->
    <AdminPageHeader
      title="Administrative Audit Logs"
      subtitle="Append-only immutable audit trail tracking security mutations, role modifications, anti-cheat reviews, and configuration changes."
      category="SECURITY AUDIT TRAIL"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-sm btn-ghost border border-base-300 gap-1.5"
          :disabled="pending"
          @click="refresh"
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
          placeholder="Search audit action, target, actor, or IP…"
          class="input input-bordered input-sm w-full pl-10 text-xs font-mono"
        >
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5 text-xs text-base-content/60 font-medium">
          <Filter class="size-3.5" />
          <span>Action:</span>
        </div>

        <select v-model="actionFilter" class="select select-bordered select-sm text-xs font-mono">
          <option value="">All Actions</option>
          <option value="user.create">user.create</option>
          <option value="user.update">user.update</option>
          <option value="user.ban">user.ban</option>
          <option value="user.unban">user.unban</option>
          <option value="user.reset_stats">user.reset_stats</option>
          <option value="user.delete">user.delete</option>
          <option value="brand.publish">brand.publish</option>
          <option value="file.upload">file.upload</option>
          <option value="file.delete">file.delete</option>
          <option value="settings.update">settings.update</option>
        </select>

        <button
          v-if="searchInput || actionFilter"
          type="button"
          class="btn btn-xs btn-ghost text-error"
          @click="searchInput = ''; actionFilter = ''"
        >
          Reset
        </button>
      </div>
    </div>

    <p v-if="error" class="alert alert-warning text-sm font-sans">
      Audit data unavailable. Please verify database connection.
    </p>

    <!-- Table Container -->
    <div class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-xs">
      <table class="table table-sm">
        <thead class="bg-base-200/70 font-mono text-[11px] uppercase tracking-wider text-base-content/60">
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target Type & ID</th>
            <th>IP Origin</th>
            <th class="text-right">Payload Delta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending">
            <td colspan="6" class="py-12 text-center text-xs opacity-50 font-sans">
              <span class="loading loading-spinner loading-sm text-primary inline-block mr-2" />
              Loading audit entries…
            </td>
          </tr>
          <tr v-else-if="!data?.rows?.length">
            <td colspan="6" class="py-12 text-center text-xs opacity-50 font-sans">
              No audit log entries matching filters.
            </td>
          </tr>
          <tr
            v-for="entry in data?.rows"
            :key="entry.id"
            class="hover:bg-base-200/50 transition-colors font-mono text-xs"
          >
            <td class="whitespace-nowrap opacity-70 text-[11px]">
              {{ new Date(entry.createdAt).toLocaleString() }}
            </td>
            <td>
              <span class="font-semibold text-primary text-[11px]">
                {{ (entry.actorId || 'system').slice(0, 14) }}
              </span>
            </td>
            <td>
              <span class="badge badge-xs border border-primary/30 bg-primary/10 text-primary font-semibold">
                {{ entry.action }}
              </span>
            </td>
            <td class="text-[11px] text-base-content/80">
              <span class="font-semibold">{{ entry.targetType }}</span>
              <span v-if="entry.targetId" class="opacity-50 text-[10px]"> ({{ (entry.targetId || '').slice(0, 8) }}…)</span>
            </td>
            <td class="text-[11px] opacity-60">
              {{ entry.ip || '127.0.0.1' }}
            </td>
            <td class="text-right">
              <button
                type="button"
                class="btn btn-ghost btn-xs text-primary underline underline-offset-2 font-mono text-[11px]"
                @click="selectedEntry = entry"
              >
                Inspect
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-base-content/60 font-mono">
      <span>Event log is append-only · Page {{ page }} (Total {{ data?.total ?? 0 }} events)</span>
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
          :disabled="!data?.rows?.length || data.rows.length < (data?.perPage || 50)"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>

    <!-- INSPECT MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="selectedEntry"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="selectedEntry = null"
        >
          <div class="relative z-10 w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-300 pb-3">
              <div class="flex items-center gap-2">
                <Code class="size-5 text-primary" />
                <h3 class="text-base font-bold text-base-content font-mono">
                  Audit: {{ selectedEntry.action }}
                </h3>
              </div>
              <button type="button" class="btn btn-ghost btn-xs btn-square" @click="selectedEntry = null">✕</button>
            </div>

            <dl class="grid grid-cols-2 gap-2 text-xs font-mono bg-base-200/50 p-3 rounded-xl border border-base-300">
              <div><dt class="opacity-50">Actor</dt><dd class="font-semibold text-primary">{{ selectedEntry.actorId }}</dd></div>
              <div><dt class="opacity-50">Target</dt><dd>{{ selectedEntry.targetType }}: {{ selectedEntry.targetId || 'N/A' }}</dd></div>
              <div><dt class="opacity-50">Time</dt><dd>{{ new Date(selectedEntry.createdAt).toLocaleString() }}</dd></div>
              <div><dt class="opacity-50">IP Address</dt><dd>{{ selectedEntry.ip || '127.0.0.1' }}</dd></div>
            </dl>

            <div class="space-y-1">
              <p class="text-xs font-semibold text-base-content font-mono">Payload Delta (Before / After):</p>
              <pre class="max-h-60 rounded-xl bg-base-200/90 p-3 overflow-auto text-[11px] font-mono leading-relaxed border border-base-300 text-base-content/90">{{ JSON.stringify({ before: selectedEntry.before, after: selectedEntry.after }, null, 2) }}</pre>
            </div>

            <div class="flex justify-end pt-2 border-t border-base-300">
              <button type="button" class="btn btn-sm btn-primary font-semibold" @click="selectedEntry = null">
                Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
