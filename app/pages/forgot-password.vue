<script setup lang="ts">
const email = ref('')
const sent = ref(false)
const pending = ref(false)

async function submit() {
  pending.value = true
  try {
    await $fetch('/api/auth/forget-password', {
      method: 'POST',
      body: { email: email.value, redirectTo: '/reset-password' },
    })
  } catch {
    // respond the same regardless of account existence
  } finally {
    sent.value = true
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm px-4 py-16">
    <h1 class="text-2xl font-semibold">Reset password</h1>
    <p class="mt-1 text-sm text-base-content/50">We will email a reset link if the account exists.</p>

    <p v-if="sent" class="alert alert-success mt-6 text-sm">Check your inbox for the reset link.</p>

    <form v-else class="mt-6 space-y-3" @submit.prevent="submit">
      <label class="form-control">
        <span class="label-text mb-1">Email</span>
        <input v-model="email" type="email" required autocomplete="email" class="input input-bordered">
      </label>
      <button type="submit" class="btn btn-primary w-full" :disabled="pending">
        {{ pending ? 'Sending…' : 'Send reset link' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm">
      <NuxtLink to="/login" class="link link-primary">Back to sign in</NuxtLink>
    </p>
  </div>
</template>
