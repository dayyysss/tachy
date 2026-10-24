<script setup lang="ts">
const route = useRoute()
const password = ref('')
const confirm = ref('')
const pending = ref(false)
const error = ref('')
const done = ref(false)

async function submit() {
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { newPassword: password.value, token: route.query.token },
    })
    done.value = true
  } catch {
    error.value = 'This reset link is invalid or expired.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm px-4 py-16">
    <h1 class="text-2xl font-semibold">Choose a new password</h1>

    <p v-if="done" class="alert alert-success mt-6 text-sm">
      Password updated. <NuxtLink to="/login" class="link">Sign in</NuxtLink>
    </p>

    <form v-else class="mt-6 space-y-3" @submit.prevent="submit">
      <label class="form-control">
        <span class="label-text mb-1">New password</span>
        <input v-model="password" type="password" required minlength="8" autocomplete="new-password" class="input input-bordered">
      </label>
      <label class="form-control">
        <span class="label-text mb-1">Confirm password</span>
        <input v-model="confirm" type="password" required minlength="8" autocomplete="new-password" class="input input-bordered">
      </label>
      <p v-if="error" class="alert alert-warning py-2 text-xs">{{ error }}</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="pending">
        {{ pending ? 'Saving…' : 'Update password' }}
      </button>
    </form>
  </div>
</template>
