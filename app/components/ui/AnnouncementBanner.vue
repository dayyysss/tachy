<script setup lang="ts">
const { data } = await useFetch<{ announcement: { text: string; type: 'info' | 'warning'; expiresAt?: string | null; dismissible?: boolean } | null }>('/api/site-config')
const dismissed = useLocalStorage('tachy-announcement-dismissed', '')

const visible = computed(() => {
  const announcement = data.value?.announcement
  if (!announcement?.text) return false
  if (announcement.expiresAt && new Date(announcement.expiresAt).getTime() < Date.now()) return false
  return dismissed.value !== announcement.text
})

function dismiss() {
  if (data.value?.announcement) dismissed.value = data.value.announcement.text
}
</script>

<template>
  <div
    v-if="visible"
    class="px-4 py-1.5 text-center text-xs font-medium"
    :class="data?.announcement?.type === 'warning' ? 'bg-primary text-primary-content' : 'bg-base-200 border-b border-base-300 text-base-content'"
  >
    <span>{{ data?.announcement?.text }}</span>
    <button v-if="data?.announcement?.dismissible !== false" type="button" class="ml-3 underline underline-offset-2 opacity-75 hover:opacity-100" @click="dismiss">Dismiss</button>
  </div>
</template>
