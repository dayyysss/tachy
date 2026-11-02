<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
const { data: usage } = await useFetch('/api/admin/files/usage')
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-5 shadow-xs">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Storage & Asset Browser</h1>
        <p class="mt-0.5 text-xs text-base-content/60">
          Cloud storage file manager with automatic MIME validation and SVG sanitization.
        </p>
      </div>

      <div v-if="usage" class="font-mono text-xs text-base-content/60">
        <span class="font-semibold text-primary">{{ usage.files }}</span> files ·
        <span>{{ (usage.bytes / 1024 / 1024).toFixed(1) }} MB</span> /
        <span class="opacity-50">{{ (usage.limitBytes / 1024 / 1024).toFixed(0) }} MB capacity</span>
      </div>
    </div>

    <div>
      <FileManager />
    </div>
  </div>
</template>
