<script setup lang="ts">
import { HardDrive } from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })
const { data: usage } = await useFetch('/api/admin/files/usage')
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="File & Storage Manager"
      subtitle="Organize directories, manage assets with full CRUD, upload media with automatic MIME validation and SVG sanitization."
      category="ASSETS & STORAGE"
    >
      <template #actions>
        <div v-if="usage" class="font-mono text-xs rounded-xl border border-base-300 bg-base-100 px-3 py-1.5 shadow-xs flex items-center gap-2">
          <HardDrive class="size-3.5 text-primary" />
          <span><strong class="text-primary">{{ usage.files }}</strong> files</span>
          <span class="opacity-40">·</span>
          <span>{{ (usage.bytes / 1024 / 1024).toFixed(1) }} MB used</span>
        </div>
      </template>
    </AdminPageHeader>

    <div>
      <FileManager />
    </div>
  </div>
</template>
