<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { data, error, refresh, pending } = await useFetch('/api/admin/health')
const { data: metrics, refresh: refreshMetrics } = await useFetch<{
  summary: { requests: number; e4xx: number; e5xx: number }
  days: { date: string; requests: number; e4xx: number; e5xx: number }[]
}>('/api/admin/metrics', { query: { range: 7 } })

const rebuilding = ref(false)
const rebuildMessage = ref('')

async function rebuild() {
  if (!window.confirm('Rebuild all leaderboards from Postgres? Redis leaderboard keys will be recreated.')) return
  const code = window.prompt('Enter your 2FA TOTP code to confirm:')
  if (code === null) return
  rebuilding.value = true
  rebuildMessage.value = ''
  try {
    const result = await $fetch<{ tests: number }>('/api/admin/leaderboards/rebuild', {
      method: 'POST',
      headers: code ? { 'x-admin-reauth': code } : {},
    })
    rebuildMessage.value = `Rebuilt from ${result.tests} tests.`
  } catch {
    rebuildMessage.value = 'Rebuild failed. Check database and Redis.'
  } finally {
    rebuilding.value = false
  }
}

function reload() {
  refresh()
  refreshMetrics()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Monitoring</h1>
      <button type="button" class="btn btn-sm" :disabled="pending" @click="reload">Re-check</button>
    </div>

    <p v-if="error" class="alert alert-warning mt-4 text-sm">Health data unavailable (database/auth not configured).</p>

    <div v-if="data" class="mt-4 grid gap-3 sm:grid-cols-2">
      <div v-for="(check, name) in data.checks" :key="name" class="rounded-box border border-base-300 bg-base-200/40 p-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium capitalize">{{ name }}</p>
          <span class="badge badge-sm" :class="check.ok ? 'badge-success' : 'badge-error'">{{ check.ok ? 'ok' : 'down' }}</span>
        </div>
        <p class="mt-1 text-xs opacity-50">
          <span v-if="check.latencyMs !== undefined">{{ check.latencyMs }} ms</span>
          <span v-if="check.detail"> · {{ check.detail }}</span>
        </p>
      </div>
    </div>

    <section v-if="metrics" class="mt-6">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-medium uppercase tracking-wide opacity-50">Last 7 days</h2>
        <span class="text-xs opacity-50">
          {{ metrics.summary.requests }} requests · {{ metrics.summary.e4xx }} 4xx · {{ metrics.summary.e5xx }} 5xx
        </span>
      </div>
      <div class=" mt-3 overflow-x-auto rounded-box border border-base-300">
        <table class="table table-xs">
          <thead>
            <tr><th>Date</th><th>Requests</th><th>4xx</th><th>5xx</th></tr>
          </thead>
          <tbody>
            <tr v-for="day in metrics.days" :key="day.date">
              <td>{{ day.date }}</td>
              <td>{{ day.requests }}</td>
              <td>{{ day.e4xx }}</td>
              <td>{{ day.e5xx }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!metrics.summary.requests" class="mt-2 text-xs opacity-50">Metrics appear once Redis is configured and API traffic arrives.</p>
    </section>

    <section class="mt-6 rounded-box border border-base-300 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-medium">Maintenance</h2>
          <p class="text-xs opacity-50">Rebuild Redis leaderboards and XP boards from Postgres.</p>
        </div>
        <button type="button" class="btn btn-warning btn-sm" :disabled="rebuilding" @click="rebuild">
          {{ rebuilding ? 'Rebuilding…' : 'Rebuild leaderboards' }}
        </button>
      </div>
      <p v-if="rebuildMessage" class="mt-2 text-xs">{{ rebuildMessage }}</p>
    </section>

    <div v-if="data" class="mt-4 rounded-box border border-base-300 p-4 text-xs opacity-60">
      <p>Version: {{ data.version }}</p>
      <p>Region: {{ data.region }}</p>
      <p>Node: {{ data.node }}</p>
    </div>
  </div>
</template>
