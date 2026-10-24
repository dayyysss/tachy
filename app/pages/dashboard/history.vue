<script setup lang="ts">
useSeo('dashboard')
const store = useTestStore()
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-8">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Local history</h1>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="!store.history.length" @click="store.clearHistory()">Clear</button>
    </div>
    <div class="rounded-box border border-base-300">
      <table class="table table-sm">
        <thead>
          <tr>
            <th>WPM</th><th>Raw</th><th>Accuracy</th><th>Mode</th><th>Amount</th><th>Lang</th><th>Words</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!store.history.length">
            <td colspan="8" class="py-8 text-center text-sm opacity-50">No local tests yet.</td>
          </tr>
          <tr v-for="entry in store.history" :key="entry.id">
            <td class="font-semibold tabular-nums">{{ Math.round(entry.wpm) }}</td>
            <td class="tabular-nums">{{ Math.round(entry.rawWpm) }}</td>
            <td class="tabular-nums">{{ Math.round(entry.accuracy) }}%</td>
            <td>{{ entry.mode }}</td>
            <td>{{ entry.amount || '—' }}</td>
            <td class="uppercase">{{ entry.language }}</td>
            <td class="tabular-nums">{{ entry.wordsTyped }}</td>
            <td class="text-xs opacity-60">{{ new Date(entry.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
