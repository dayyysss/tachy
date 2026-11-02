<script setup lang="ts">
useSeo('login')

const localePath = useLocalePath()
const route = useRoute()
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const pending = ref(false)
const error = ref('')
const done = ref(false)
const toast = useToast()

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
    toast.success('Password updated successfully.')
  } catch {
    error.value = 'This reset link is invalid or has expired.'
    toast.error('Password reset failed.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell
    title="Choose New Password"
    subtitle="Set a secure password of at least 8 characters to resume typing."
    :hide-tabs="true"
  >
    <div v-if="done" class="space-y-4">
      <div class="rounded-xl border border-success/30 bg-success/10 p-4 text-center text-xs text-success font-medium">
        <p class="font-semibold text-sm">Password updated</p>
        <p class="mt-1 text-base-content/70">Your new credentials are now active.</p>
      </div>
      <NuxtLink :to="localePath('/login')" class="btn btn-primary btn-sm w-full font-semibold">
        Proceed to Sign in →
      </NuxtLink>
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div class="space-y-1.5">
        <label class="block font-mono text-xs font-medium text-base-content/70">
          New Password
        </label>
        <div class="relative flex items-center">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="••••••••••••"
            class="input input-bordered input-sm w-full bg-base-100/90 pr-9 font-mono text-xs focus:border-primary focus:outline-none transition-colors"
          >
          <button
            type="button"
            class="absolute right-2.5 text-base-content/40 hover:text-base-content"
            tabindex="-1"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg v-else class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          </button>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block font-mono text-xs font-medium text-base-content/70">
          Confirm Password
        </label>
        <input
          v-model="confirm"
          :type="showPassword ? 'text' : 'password'"
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="••••••••••••"
          class="input input-bordered input-sm w-full bg-base-100/90 font-mono text-xs focus:border-primary focus:outline-none transition-colors"
        >
      </div>

      <div v-if="error" class="rounded-xl border border-error/30 bg-error/10 p-2.5 text-xs text-error font-medium">
        {{ error }}
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-sm w-full font-semibold text-primary-content shadow-xs"
        :disabled="pending"
      >
        <span v-if="pending" class="loading loading-spinner loading-xs" />
        <span>{{ pending ? 'Saving password…' : 'Update Password' }}</span>
      </button>
    </form>
  </AuthShell>
</template>
