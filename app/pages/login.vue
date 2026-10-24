<script setup lang="ts">
useSeo('login')

const email = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')
const router = useRouter()

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await importGuestHistory()
    await router.push('/dashboard')
  } catch (cause: unknown) {
    const status = (cause as { statusCode?: number }).statusCode
    error.value = status === 503
      ? 'Accounts are not configured on this deployment yet. Guest mode still works.'
      : 'Could not sign in. Check your email and password.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm px-4 py-16">
    <h1 class="text-2xl font-semibold">{{ $t('auth.signIn') }}</h1>
    <p class="mt-1 text-sm text-base-content/50">Save your progress, streaks, and leaderboard rank.</p>

    <form class="mt-6 space-y-3" @submit.prevent="submit">
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('auth.email') }}</span>
        <input v-model="email" type="email" required autocomplete="email" class="input input-bordered">
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('auth.password') }}</span>
        <input v-model="password" type="password" required autocomplete="current-password" class="input input-bordered">
      </label>
      <p v-if="error" class="alert alert-warning py-2 text-xs">{{ error }}</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="pending">
        {{ pending ? 'Signing in…' : $t('auth.signIn') }}
      </button>
    </form>

    <p class="mt-2 text-center text-xs">
      <NuxtLink to="/forgot-password" class="link link-hover">Forgot password?</NuxtLink>
    </p>

    <p class="mt-4 text-center text-sm">
      {{ $t('auth.noAccount') }}
      <NuxtLink to="/register" class="link link-primary">{{ $t('auth.signUp') }}</NuxtLink>
    </p>
  </div>
</template>
