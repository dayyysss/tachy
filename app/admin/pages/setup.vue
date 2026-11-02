<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const route = useRoute()
const base = computed(() => config.public.adminPanelBase || `/${route.path.split('/').filter(Boolean)[0] ?? 'tachos'}`)

const password = ref('')
const error = ref('')
const pending = ref(false)
const totpURI = ref('')
const backupCodes = ref<string[]>([])
const code = ref('')
const verified = ref(false)
const copiedSecret = ref(false)
const copiedBackup = ref(false)

const secret = computed(() => {
  try {
    return new URL(totpURI.value).searchParams.get('secret') ?? ''
  } catch {
    return ''
  }
})

async function enable() {
  if (!password.value) return
  pending.value = true
  error.value = ''
  try {
    const result = await $fetch<{ totpURI?: string; backupCodes?: string[] }>('/api/auth/two-factor/enable', {
      method: 'POST',
      body: { password: password.value },
    })
    totpURI.value = result.totpURI ?? ''
    backupCodes.value = result.backupCodes ?? []
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    error.value = status === 400 || status === 401
      ? 'Incorrect account password. Please try again.'
      : 'Could not initialize 2FA. Ensure auth is properly configured.'
  } finally {
    pending.value = false
  }
}

async function verify() {
  if (!code.value || code.value.length < 6) return
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/two-factor/verify-totp', {
      method: 'POST',
      body: { code: code.value.trim() },
    })
    verified.value = true
  } catch {
    error.value = 'Invalid 6-digit verification code. Please check your authenticator app.'
  } finally {
    pending.value = false
  }
}

async function copySecret() {
  if (!secret.value) return
  await navigator.clipboard.writeText(secret.value)
  copiedSecret.value = true
  setTimeout(() => { copiedSecret.value = false }, 2500)
}

async function copyAllBackupCodes() {
  if (!backupCodes.value.length) return
  await navigator.clipboard.writeText(backupCodes.value.join('\n'))
  copiedBackup.value = true
  setTimeout(() => { copiedBackup.value = false }, 2500)
}

function finish() {
  navigateTo(`${base.value}/dashboard`)
}
</script>

<template>
  <div class="mx-auto max-w-xl py-6 md:py-10">
    <div class="rounded-box border border-base-300 bg-base-200/50 p-6 md:p-8 shadow-xl backdrop-blur-md">
      <!-- Header with Shield Icon -->
      <div class="flex items-start gap-4 border-b border-base-300 pb-5">
        <div class="rounded-xl bg-primary/15 p-3 text-primary">
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div>
          <span class="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            Security Hardening
          </span>
          <h1 class="mt-1 text-xl font-bold tracking-tight">Two-Factor Authentication (TOTP)</h1>
          <p class="mt-0.5 text-xs text-base-content/60">
            Mandatory time-based one-time password security for administrator and moderator privileges.
          </p>
        </div>
      </div>

      <!-- STEP 1: Verify Password to Generate 2FA Secret -->
      <div v-if="!totpURI" class="mt-6 space-y-5">
        <div class="rounded-box bg-base-100/60 p-4 border border-base-300/60 text-xs text-base-content/70 space-y-1">
          <p class="font-semibold text-base-content">Step 1: Confirm Password</p>
          <p>Confirm your current account password to generate your unique authenticator secret key.</p>
        </div>

        <form class="space-y-4" @submit.prevent="enable">
          <div class="space-y-1.5">
            <label class="block text-xs font-mono font-medium text-base-content/70">
              Account Password
            </label>
            <input
              v-model="password"
              type="password"
              required
              class="input input-bordered w-full bg-base-100 font-mono text-sm"
              placeholder="Enter your admin password"
              autocomplete="current-password"
            >
          </div>

          <p v-if="error" class="alert alert-error py-2 text-xs font-mono">{{ error }}</p>

          <button
            type="submit"
            class="btn btn-primary btn-sm w-full font-semibold shadow-xs"
            :disabled="pending"
          >
            <span v-if="pending" class="loading loading-spinner loading-xs" />
            <span>{{ pending ? 'Generating 2FA Secret…' : 'Generate 2FA Secret Key →' }}</span>
          </button>
        </form>
      </div>

      <!-- STEP 2: Configure Authenticator & Verify Code -->
      <div v-else class="mt-6 space-y-6">
        <!-- Success or active step banner -->
        <div v-if="!verified" class="space-y-5">
          <div class="rounded-box bg-base-100/60 p-4 border border-base-300/60 text-xs text-base-content/70 space-y-1">
            <p class="font-semibold text-base-content">Step 2: Add Secret to Authenticator App</p>
            <p>Open Google Authenticator, 1Password, or Authy, add a new account and enter the manual key below.</p>
          </div>

          <!-- Secret Key Box -->
          <div class="rounded-box border border-base-300 bg-base-100 p-4 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/50">Manual Secret Key</span>
              <button
                type="button"
                class="btn btn-xs btn-ghost gap-1 text-primary hover:bg-primary/10"
                @click="copySecret"
              >
                <span>{{ copiedSecret ? '✓ Copied' : 'Copy Key' }}</span>
              </button>
            </div>
            <code class="block rounded bg-base-200/80 p-2.5 font-mono text-sm font-bold tracking-widest text-primary break-all select-all">
              {{ secret || 'GENERATING_KEY…' }}
            </code>
          </div>

          <!-- Emergency Backup Codes -->
          <div v-if="backupCodes.length" class="rounded-box border border-warning/30 bg-warning/5 p-4 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-warning">
                Emergency Backup Codes
              </span>
              <button
                type="button"
                class="btn btn-xs btn-ghost gap-1 text-warning hover:bg-warning/10"
                @click="copyAllBackupCodes"
              >
                <span>{{ copiedBackup ? '✓ Copied All' : 'Copy All Codes' }}</span>
              </button>
            </div>
            <p class="text-[11px] text-base-content/60">Save these single-use codes in a secure place. They allow login if you lose your phone.</p>
            <div class="grid grid-cols-2 gap-1.5 rounded bg-base-100/80 p-2.5 font-mono text-xs text-base-content/80">
              <span v-for="bCode in backupCodes" :key="bCode" class="tracking-wider">{{ bCode }}</span>
            </div>
          </div>

          <!-- Verification Form -->
          <form class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4" @submit.prevent="verify">
            <div class="space-y-1.5 text-center">
              <label class="block text-xs font-semibold text-base-content">
                Enter 6-Digit Code from Authenticator
              </label>
              <p class="text-[11px] text-base-content/50 font-mono">Verify that your app is in sync before proceeding</p>
              <input
                v-model="code"
                inputmode="numeric"
                pattern="[0-9]{6}"
                maxlength="6"
                required
                placeholder="000000"
                class="input input-bordered mx-auto w-48 text-center font-mono text-xl font-bold tracking-[0.4em] bg-base-200/50"
              >
            </div>

            <p v-if="error" class="alert alert-error py-1.5 text-xs font-mono text-center">{{ error }}</p>

            <button
              type="submit"
              class="btn btn-primary btn-sm w-full font-semibold shadow-xs"
              :disabled="pending || code.length < 6"
            >
              <span v-if="pending" class="loading loading-spinner loading-xs" />
              <span>{{ pending ? 'Verifying Code…' : 'Verify & Activate 2FA Protection' }}</span>
            </button>
          </form>
        </div>

        <!-- STEP 3: Complete / Verified -->
        <div v-else class="text-center py-6 space-y-4">
          <div class="mx-auto size-14 rounded-full bg-success/15 text-success flex items-center justify-center">
            <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 class="text-lg font-bold text-success">Two-Factor Authentication is Active</h2>
            <p class="mt-1 text-xs text-base-content/60">
              Your administrator account is now protected with hardware TOTP tokens and encrypted backup codes.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-sm px-6 font-semibold"
            @click="finish"
          >
            Proceed to Admin Dashboard →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
