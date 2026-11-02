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
  <div class="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 md:py-24 text-center">
    <div class="rounded-2xl border border-base-300 bg-base-200/50 p-6 md:p-8 shadow-xl backdrop-blur-xs space-y-5">
      <!-- Status Icon -->
      <div v-if="status === 'working'" class="mx-auto size-12 flex items-center justify-center">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>
      <div v-else-if="status === 'ok'" class="mx-auto size-12 rounded-full bg-success/15 text-success flex items-center justify-center">
        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div v-else class="mx-auto size-12 rounded-full bg-error/15 text-error flex items-center justify-center">
        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>

      <!-- Title & Explanation -->
      <div>
        <h1 class="text-xl font-bold tracking-tight">Email Verification</h1>
        <p v-if="status === 'working'" class="mt-1 text-xs text-base-content/60">
          Confirming your email address with Tachy server…
        </p>
        <p v-else-if="status === 'ok'" class="mt-1 text-xs text-success">
          Your email has been verified successfully. Your progress is now permanently synced.
        </p>
        <p v-else class="mt-1 text-xs text-error">
          This verification link is invalid or has expired. You can request a new one from settings.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink to="/dashboard" class="btn btn-primary btn-sm px-6 font-semibold">
          {{ status === 'ok' ? 'Go to Dashboard →' : 'Return to Home' }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
