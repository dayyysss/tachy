<script setup lang="ts">
useSeo('register')

const email = ref('')
const password = ref('')
const username = ref('')
const pending = ref(false)
const error = ref('')
const router = useRouter()

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/sign-up/email', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        name: username.value,
        username: username.value,
      },
    })
    await importGuestHistory()
    await router.push('/dashboard')
  } catch (cause: unknown) {
    const status = (cause as { statusCode?: number }).statusCode
    error.value = status === 503
      ? 'Accounts are not configured on this deployment yet. Guest mode still works.'
      : 'Could not create the account. Try another username or email.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm px-4 py-16">
    <h1 class="text-2xl font-semibold">{{ $t('auth.signUp') }}</h1>
    <p class="mt-1 text-sm text-base-content/50">Free, no ads. Guest progress can be imported later.</p>

    <form class="mt-6 space-y-3" @submit.prevent="submit">
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('auth.username') }}</span>
        <input v-model="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_-]+" class="input input-bordered">
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('auth.email') }}</span>
        <input v-model="email" type="email" required autocomplete="email" class="input input-bordered">
      </label>
      <label class="form-control">
        <span class="label-text mb-1">{{ $t('auth.password') }}</span>
        <input v-model="password" type="password" required minlength="8" autocomplete="new-password" class="input input-bordered">
      </label>
      <p v-if="error" class="alert alert-warning py-2 text-xs">{{ error }}</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="pending">
        {{ pending ? 'Creating…' : $t('auth.signUp') }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm">
      {{ $t('auth.haveAccount') }}
      <NuxtLink to="/login" class="link link-primary">{{ $t('auth.signIn') }}</NuxtLink>
    </p>
  </div>
</template>
