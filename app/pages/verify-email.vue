<script setup lang="ts">
const route = useRoute()
const status = ref<'working' | 'ok' | 'error'>('working')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    status.value = 'error'
    return
  }
  try {
    await $fetch('/api/auth/verify-email', { query: { token } })
    status.value = 'ok'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-sm px-4 py-16 text-center">
    <h1 class="text-2xl font-semibold">Email verification</h1>
    <p v-if="status === 'working'" class="mt-4 text-sm opacity-60">Verifying…</p>
    <p v-else-if="status === 'ok'" class="alert alert-success mt-6 text-sm">Email verified. You can close this tab.</p>
    <p v-else class="alert alert-error mt-6 text-sm">This verification link is invalid or expired.</p>
    <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm mt-6">Go to dashboard</NuxtLink>
  </div>
</template>
