<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
const { data: usage } = await useFetch('/api/admin/files/usage')
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-semibold">Files</h1>
      <p v-if="usage" class="text-xs opacity-50">
        {{ usage.files }} files · {{ (usage.bytes / 1024 / 1024).toFixed(1) }} MB
        of {{ (usage.limitBytes / 1024 / 1024).toFixed(0) }} MB
      </p>
    </div>
    <p class="mt-1 text-sm opacity-50">Public bucket. Uploads are validated server-side (mime sniffing, SVG sanitization).</p>
    <div class="mt-4">
      <FileManager />
    </div>
  </div>
</template>
