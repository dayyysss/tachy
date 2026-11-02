<script setup lang="ts">
useSeo('login')

const localePath = useLocalePath()
const email = ref('')
const sent = ref(false)
const pending = ref(false)
const toast = useToast()

async function submit() {
  if (!email.value) return
  pending.value = true
  try {
    await $fetch('/api/auth/forget-password', {
      method: 'POST',
      body: { email: email.value, redirectTo: '/reset-password' },
    })
    toast.success('Reset link dispatched if account exists.')
  } catch {
    // respond the same regardless of account existence
  } finally {
    sent.value = true
    pending.value = false
  }
}
</script>

<template>
  <AuthShell
    title="Reset Password"
    subtitle="Enter your registered email address to receive recovery instructions."
    :hide-tabs="true"
  >
    <div v-if="sent" class="space-y-4">
      <div class="rounded-xl border border-success/30 bg-success/10 p-4 text-center text-xs text-success font-medium">
        <p class="font-semibold text-sm">Check your inbox</p>
        <p class="mt-1 text-base-content/70">
          If an account is associated with <span class="font-mono text-base-content">{{ email }}</span>, a reset link has been dispatched.
        </p>
      </div>
      <NuxtLink :to="localePath('/login')" class="btn btn-primary btn-sm w-full font-semibold">
        Return to Sign in
      </NuxtLink>
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div class="space-y-1.5">
        <label class="block font-mono text-xs font-medium text-base-content/70">
          Registered Email
        </label>
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@domain.com"
          class="input input-bordered input-sm w-full bg-base-100/90 font-mono text-xs focus:border-primary focus:outline-none transition-colors"
        >
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-sm w-full font-semibold text-primary-content shadow-xs"
        :disabled="pending"
      >
        <span v-if="pending" class="loading loading-spinner loading-xs" />
        <span>{{ pending ? 'Sending instructions…' : 'Send Reset Link' }}</span>
      </button>

      <div class="pt-3 text-center text-xs text-base-content/60">
        <NuxtLink :to="localePath('/login')" class="font-medium text-primary hover:underline">
          ← Back to sign in
        </NuxtLink>
      </div>
    </form>
  </AuthShell>
</template>
