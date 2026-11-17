<script setup lang="ts">
useSeo('login')

const localePath = useLocalePath()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const pending = ref(false)
const error = ref('')
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { fetchSession, user } = useAuth()

const isTwoFactorStep = ref(false)
const totpCode = ref('')
const useBackup = ref(false)

async function submit() {
  if (!email.value || !password.value) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ twoFactorRedirect?: boolean }>('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    if (res?.twoFactorRedirect) {
      isTwoFactorStep.value = true
      totpCode.value = ''
      error.value = ''
      return
    }

    await finalizeLogin()
  } catch (cause: unknown) {
    const status = (cause as { statusCode?: number }).statusCode
    error.value = status === 503
      ? 'Accounts service is currently unavailable. Guest mode continues to work offline.'
      : 'Could not sign in. Please verify your email and password.'
  } finally {
    pending.value = false
  }
}

async function signInWith(provider: 'google' | 'github') {
  pending.value = true
  error.value = ''
  try {
    const callbackURL = route.query.redirect ? String(route.query.redirect) : '/dashboard'
    const res = await $fetch<{ url?: string; redirect?: boolean }>('/api/auth/sign-in/social', {
      method: 'POST',
      body: { provider, callbackURL },
    })
    if (res?.url) {
      window.location.href = res.url
    }
  } catch (cause: unknown) {
    const err = cause as { data?: { message?: string } }
    if (err.data?.message?.includes('Provider not found') || err.data?.message?.includes('not found')) {
      error.value = `${provider === 'google' ? 'Google' : 'GitHub'} OAuth is not configured in .env yet.`
    } else {
      error.value = `Failed to connect with ${provider}.`
    }
  } finally {
    pending.value = false
  }
}

async function verifyTwoFactor() {
  if (!totpCode.value.trim()) return
  pending.value = true
  error.value = ''
  try {
    const endpoint = useBackup.value
      ? '/api/auth/two-factor/verify-backup-code'
      : '/api/auth/two-factor/verify-totp'

    await $fetch(endpoint, {
      method: 'POST',
      body: { code: totpCode.value.trim() },
    })

    await finalizeLogin()
  } catch {
    error.value = useBackup.value
      ? 'Invalid backup code. Please try another code.'
      : 'Invalid 6-digit code. Check your authenticator app.'
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  if (user.value?.role === 'admin') {
    const config = useRuntimeConfig()
    navigateTo(`${config.public.adminPanelBase || '/tachos'}/dashboard`)
  } else if (user.value) {
    const target = route.query.redirect ? String(route.query.redirect) : '/dashboard'
    navigateTo(target)
  }
})

async function finalizeLogin() {
  await fetchSession()
  if (user.value?.role === 'admin') {
    await $fetch('/api/auth/sign-out', { method: 'POST', body: {} }).catch(() => {})
    user.value = null
    error.value = 'Akun Administrator tidak dapat masuk ke area member. Silakan login melalui portal Admin.'
    return
  }
  toast.success(`Welcome back, ${user.value?.username || user.value?.name || 'typist'}!`)
  await syncPendingTestResult()
  await importGuestHistory()
  const target = route.query.redirect ? String(route.query.redirect) : '/dashboard'
  await navigateTo(target)
}

function backToPassword() {
  isTwoFactorStep.value = false
  totpCode.value = ''
  error.value = ''
}
</script>

<template>
  <AuthShell
    :title="isTwoFactorStep ? 'Security Challenge' : $t('auth.signIn')"
    :subtitle="isTwoFactorStep ? 'Enter the code from your authenticator app to complete sign-in.' : 'Sync your personal bests, daily streaks, and leaderboard rank across devices.'"
    active-tab="login"
    :hide-tabs="isTwoFactorStep"
  >
    <!-- STEP 1: PASSWORD FORM & SOCIAL BUTTONS -->
    <div v-if="!isTwoFactorStep" class="space-y-4">
      <!-- Social OAuth Buttons -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          class="btn btn-outline btn-sm font-normal text-xs gap-2 border-base-300 bg-base-100/90 hover:bg-base-200 hover:border-base-content/20 transition-all"
          :disabled="pending"
          @click="signInWith('google')"
        >
          <svg class="size-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z" />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          class="btn btn-outline btn-sm font-normal text-xs gap-2 border-base-300 bg-base-100/90 hover:bg-base-200 hover:border-base-content/20 transition-all"
          :disabled="pending"
          @click="signInWith('github')"
        >
          <svg class="size-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>GitHub</span>
        </button>
      </div>

      <div class="relative flex items-center justify-center my-4">
        <div class="border-t border-base-300 w-full" />
        <span class="bg-base-100 px-3 font-mono text-[10px] uppercase tracking-wider text-base-content/40 absolute rounded">or email</span>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-1.5">
          <label class="block font-mono text-xs font-medium text-base-content/70">
            {{ $t('auth.email') }}
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

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block font-mono text-xs font-medium text-base-content/70">
              {{ $t('auth.password') }}
            </label>
            <NuxtLink :to="localePath('/forgot-password')" class="text-[11px] text-primary hover:underline">
              Forgot password?
            </NuxtLink>
          </div>
          <div class="relative flex items-center">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
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

        <div v-if="error" class="rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-sm w-full font-semibold text-primary-content shadow-xs"
          :disabled="pending"
        >
          <span v-if="pending" class="loading loading-spinner loading-xs" />
          <span>{{ pending ? 'Signing in…' : $t('auth.signIn') }}</span>
        </button>
      </form>

      <div class="pt-2 text-center text-xs text-base-content/60">
        <span>{{ $t('auth.noAccount') }}</span>
        <NuxtLink :to="route.query.redirect ? `${localePath('/register')}?redirect=${encodeURIComponent(String(route.query.redirect))}` : localePath('/register')" class="font-medium text-primary hover:underline ml-1">
          {{ $t('auth.signUp') }}
        </NuxtLink>
      </div>
    </div>

    <!-- STEP 2: 2FA CODE FORM -->
    <form v-else class="space-y-4" @submit.prevent="verifyTwoFactor">
      <div class="space-y-1.5 text-center">
        <label class="block font-mono text-xs font-semibold text-base-content">
          {{ useBackup ? 'Enter Backup Code' : 'Enter 6-Digit Authenticator Code' }}
        </label>
        <input
          v-if="!useBackup"
          v-model="totpCode"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          required
          autofocus
          placeholder="000000"
          class="input input-bordered mx-auto w-48 text-center font-mono text-xl font-bold tracking-[0.4em] bg-base-100 focus:border-primary focus:outline-none"
        >
        <input
          v-else
          v-model="totpCode"
          type="text"
          required
          autofocus
          placeholder="Enter backup code"
          class="input input-bordered w-full text-center font-mono text-sm bg-base-100 focus:border-primary focus:outline-none"
        >
      </div>

      <div v-if="error" class="rounded-xl border border-error/30 bg-error/10 p-2.5 text-xs font-medium text-error text-center font-mono">
        {{ error }}
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-sm w-full font-semibold text-primary-content shadow-xs"
        :disabled="pending || !totpCode.trim()"
      >
        <span v-if="pending" class="loading loading-spinner loading-xs" />
        <span>{{ pending ? 'Verifying Code…' : 'Verify & Continue →' }}</span>
      </button>

      <div class="flex items-center justify-between text-[11px] font-mono text-base-content/60 pt-1">
        <button
          type="button"
          class="hover:text-primary transition"
          @click="useBackup = !useBackup; totpCode = ''; error = ''"
        >
          {{ useBackup ? '← Use Authenticator app' : 'Use a backup code' }}
        </button>
        <button
          type="button"
          class="hover:text-base-content transition"
          @click="backToPassword"
        >
          Back to login
        </button>
      </div>
    </form>
  </AuthShell>
</template>
