<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { data, error } = await useFetch('/api/admin/overview')

const cards = computed(() => [
  { label: 'Users', value: data.value?.users ?? 0 },
  { label: 'Tests today', value: data.value?.testsToday ?? 0 },
  { label: 'Tests all-time', value: data.value?.testsTotal ?? 0 },
  { label: 'Flagged', value: data.value?.flagged ?? 0 },
  { label: 'Words typed', value: data.value?.words ?? 0 },
  { label: 'Time typed (h)', value: Math.round((data.value?.timeMs ?? 0) / 3600000) },
])
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">Overview</h1>
    <p v-if="error" class="alert alert-warning mt-4 text-sm">
      Admin data is unavailable. Check `DATABASE_URL` and sign in as an admin with 2FA enabled.
    </p>

    <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="card in cards" :key="card.label" class="rounded-box border border-base-300 bg-base-200/40 p-4">
        <p class="text-xs uppercase tracking-wide opacity-50">{{ card.label }}</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums">{{ card.value.toLocaleString() }}</p>
      </div>
    </div>

    <section class="mt-6">
      <h2 class="text-sm font-medium uppercase tracking-wide opacity-50">Latest admin actions</h2>
      <div class="mt-2 rounded-box border border-base-300">
        <table class="table table-sm">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            <tr v-if="!data?.audit?.length"><td colspan="4" class="py-6 text-center text-sm opacity-50">No audit entries yet.</td></tr>
            <tr v-for="entry in data?.audit" :key="entry.id">
              <td class="text-xs opacity-60">{{ new Date(entry.createdAt).toLocaleString() }}</td>
              <td class="font-mono text-xs">{{ entry.actorId }}</td>
              <td>{{ entry.action }}</td>
              <td class="text-xs">{{ entry.targetType }} {{ entry.targetId }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
