<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface BrandFile {
  id: string
  name: string
  url: string | null
}

interface BrandVersion {
  version: number
  isActive: boolean
  fileId: string
  name: string | null
  url: string | null
}

interface BrandSlot {
  id: string
  label: string
  purpose: string
  formats: string[]
  active: BrandVersion | null
  versions: BrandVersion[]
}

const { data, refresh } = await useFetch<{ slots: BrandSlot[] }>('/api/admin/brand')
const targetSlot = ref('')
const message = ref('')

function choose(slot: string) {
  targetSlot.value = slot
  document.getElementById('file-picker')?.scrollIntoView({ behavior: 'smooth' })
}

async function useFile(file: BrandFile) {
  if (!targetSlot.value) {
    message.value = 'Pick a slot first.'
    return
  }
  try {
    await $fetch(`/api/admin/brand/${targetSlot.value}`, { method: 'PUT', body: { fileId: file.id } })
    message.value = `Published ${file.name} to ${targetSlot.value}.`
    targetSlot.value = ''
    await refresh()
  } catch {
    message.value = 'Could not publish the file.'
  }
}

async function rollback(slot: string, version: number) {
  await $fetch(`/api/admin/brand/${slot}/rollback`, { method: 'POST', body: { version } })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">Branding</h1>
    <p class="mt-1 text-sm opacity-50">Logo slots render theme-aware; favicon generations come from the uploaded source.</p>
    <p v-if="message" class="mt-2 text-xs text-success">{{ message }}</p>

    <div class="mt-4 grid gap-3 lg:grid-cols-2">
      <article v-for="slot in data?.slots" :key="slot.id" class="rounded-box border border-base-300 bg-base-200/40 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-medium">{{ slot.label }}</h2>
            <p class="text-xs opacity-50">{{ slot.purpose }} · {{ slot.formats.join(', ') }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-xs" @click="choose(slot.id)">Choose file</button>
        </div>

        <div class="mt-3 flex min-h-24 items-center justify-center rounded-box bg-base-100 p-3">
          <img v-if="slot.active?.url" :src="slot.active.url" :alt="slot.label" class="max-h-20 max-w-full object-contain">
          <span v-else class="text-xs opacity-30">No asset published</span>
        </div>

        <div v-if="slot.versions.length" class="mt-2 flex flex-wrap gap-1">
          <button
            v-for="version in slot.versions.slice(0, 5)"
            :key="version.version"
            type="button"
            class="btn btn-ghost btn-xs"
            :class="{ 'text-primary': version.isActive }"
            :disabled="version.isActive"
            @click="rollback(slot.id, version.version)"
          >v{{ version.version }}</button>
        </div>
      </article>
    </div>

    <section id="file-picker" class="mt-8">
      <h2 class="text-sm font-medium uppercase tracking-wide opacity-50">
        File picker
        <span v-if="targetSlot" class="text-primary">→ {{ targetSlot }}</span>
      </h2>
      <div class="mt-3">
        <FileManager mode="select" @select="useFile" />
      </div>
    </section>
  </div>
</template>
