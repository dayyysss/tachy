<script setup lang="ts">
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Terminal,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Fingerprint,
} from 'lucide-vue-next'

definePageMeta({ layout: 'focus' })

const config = useRuntimeConfig()
const panelBase = computed(() => config.public.adminPanelBase || '/tachos')

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const pending = ref(false)
const error = ref('')

// 2FA verification step
const isTwoFactorStep = ref(false)
const totpCode = ref('')
const useBackup = ref(false)

onMounted(async () => {
  try {
    const session = await $fetch<{ user?: { role?: string } }>('/api/auth/get-session')
    if (session?.user?.role === 'admin') {
      await navigateTo(`${panelBase.value}/dashboard`)
    }
  } catch {
    // not authenticated
  }
})

async function submitPassword() {
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
      ? 'Database or Auth service is not reachable.'
      : 'Invalid administrator email or password.'
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

async function finalizeLogin() {
  const session = await $fetch<{ user?: { role?: string; twoFactorEnabled?: boolean } }>('/api/auth/get-session')
  const user = session?.user

  if (!user || user.role !== 'admin') {
    await $fetch('/api/auth/sign-out', { method: 'POST', body: {} }).catch(() => {})
    error.value = 'Access denied: You do not have administrator permissions.'
    isTwoFactorStep.value = false
    return
  }

  if (config.public.adminRequire2fa && !user.twoFactorEnabled) {
    await navigateTo(`${panelBase.value}/setup`)
  } else {
    await navigateTo(`${panelBase.value}/dashboard`)
  }
}

function backToPassword() {
  isTwoFactorStep.value = false
  totpCode.value = ''
  error.value = ''
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-100 p-4 sm:p-6 md:p-8 select-none selection:bg-primary/20">
    <!-- BACKGROUND LAYER 1: Ambient Lighting -->
    <div class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[700px] rounded-full bg-primary/10 blur-[140px] opacity-70" />
    <div class="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px] opacity-50" />
    <div class="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-base-content/5 blur-[120px] opacity-40" />

    <!-- BACKGROUND LAYER 2: Tactical Matrix Grid SVG -->
    <svg class="pointer-events-none absolute inset-0 size-full text-base-content/5 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]">
      <defs>
        <pattern id="tachypanel-grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="22" cy="22" r="0.75" fill="currentColor" opacity="0.6" />
          <path d="M 0 22 L 4 22 M 40 22 L 44 22 M 22 0 L 22 4 M 22 40 L 22 44" stroke="currentColor" stroke-width="0.75" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tachypanel-grid)" />
    </svg>

    <!-- BACKGROUND LAYER 3A: Top-Left Console Telemetry & Gauge SVG -->
    <svg
      class="pointer-events-none absolute -top-12 -left-12 sm:top-4 sm:left-4 size-72 sm:size-96 text-primary/15 opacity-80 transition-all select-none hidden md:block"
      viewBox="0 0 360 360"
      fill="none"
      aria-hidden="true"
    >
      <!-- Concentric Rings & Compass Ticks -->
      <circle cx="180" cy="180" r="160" stroke="currentColor" stroke-width="1" stroke-dasharray="3 6" opacity="0.4" />
      <circle cx="180" cy="180" r="135" stroke="currentColor" stroke-width="1.5" stroke-dasharray="16 4" opacity="0.6" />
      <circle cx="180" cy="180" r="100" stroke="currentColor" stroke-width="1" opacity="0.3" />
      <circle cx="180" cy="180" r="55" stroke="currentColor" stroke-width="1" stroke-dasharray="2 4" opacity="0.5" />
      <circle cx="180" cy="180" r="4" fill="currentColor" />

      <!-- Crosshairs & Coordinate Lines -->
      <line x1="180" y1="10" x2="180" y2="40" stroke="currentColor" stroke-width="2" />
      <line x1="180" y1="320" x2="180" y2="350" stroke="currentColor" stroke-width="2" />
      <line x1="10" y1="180" x2="40" y2="180" stroke="currentColor" stroke-width="2" />
      <line x1="320" y1="180" x2="350" y2="180" stroke="currentColor" stroke-width="2" />

      <!-- Dial Sweep Indicator -->
      <line x1="180" y1="180" x2="275" y2="85" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="275" cy="85" r="5" stroke="currentColor" stroke-width="1.5" fill="none" />

      <!-- Telemetry Text Annotations -->
      <text x="180" y="215" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor" letter-spacing="2">TACHY // ROOT</text>
      <text x="180" y="232" text-anchor="middle" font-family="monospace" font-size="8" fill="currentColor" opacity="0.6" letter-spacing="1.5">NODE ID: 0x41.64.6D</text>
      <text x="45" y="165" font-family="monospace" font-size="8" fill="currentColor" opacity="0.4">270° W</text>
      <text x="290" y="165" font-family="monospace" font-size="8" fill="currentColor" opacity="0.4">090° E</text>
      <text x="190" y="32" font-family="monospace" font-size="8" fill="currentColor" opacity="0.4">000° N</text>
    </svg>

    <!-- BACKGROUND LAYER 3B: Bottom-Right Mechanical Keycap & Switch Matrix SVG -->
    <svg
      class="pointer-events-none absolute -bottom-12 -right-12 sm:bottom-4 sm:right-4 size-80 sm:size-[420px] text-primary/15 opacity-80 transition-all select-none hidden md:block"
      viewBox="0 0 380 380"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(40, 40)">
        <!-- Keycap [ESC] -->
        <rect x="10" y="10" width="56" height="56" rx="10" stroke="currentColor" stroke-width="1.5" />
        <rect x="16" y="16" width="44" height="44" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.3" />
        <text x="38" y="42" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor">ESC</text>

        <!-- Keycap [CTRL] -->
        <rect x="80" y="10" width="68" height="56" rx="10" stroke="currentColor" stroke-width="1.5" />
        <rect x="86" y="16" width="56" height="44" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.3" />
        <text x="114" y="42" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor">CTRL</text>

        <!-- Keycap [CMD / ⌘] -->
        <rect x="162" y="10" width="64" height="56" rx="10" stroke="currentColor" stroke-width="1.5" />
        <rect x="168" y="16" width="52" height="44" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.3" />
        <text x="194" y="42" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="currentColor">⌘</text>

        <!-- Keycap [ENTER ↵] -->
        <g transform="translate(10, 80)">
          <rect x="0" y="0" width="138" height="56" rx="10" stroke="currentColor" stroke-width="1.5" />
          <rect x="6" y="6" width="126" height="44" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.3" />
          <text x="69" y="32" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="currentColor">ENTER ↵</text>
        </g>

        <!-- MX Mechanical Switch Cross-Stem Wireframe Diagram -->
        <g transform="translate(162, 80)">
          <rect x="0" y="0" width="56" height="56" rx="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
          <circle cx="28" cy="28" r="16" stroke="currentColor" stroke-width="1" opacity="0.6" />
          <rect x="25" y="17" width="6" height="22" rx="1" fill="currentColor" fill-opacity="0.4" />
          <rect x="17" y="25" width="22" height="6" rx="1" fill="currentColor" fill-opacity="0.4" />
        </g>

        <!-- Keystroke Pulse Frequency Wave -->
        <path d="M 0 170 Q 25 170 35 140 T 45 200 T 55 170 T 95 170 T 105 130 T 115 210 T 125 170 L 220 170" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7" />

        <!-- Hex Telemetry Stream Label: T-A-C-H-Y -->
        <text x="110" y="196" text-anchor="middle" font-family="monospace" font-size="8" fill="currentColor" opacity="0.5" letter-spacing="2">
          0x54 0x41 0x43 0x48 0x59
        </text>
      </g>
    </svg>

    <!-- TOP BAR DECORATIVE STATUS (DESKTOP) -->
    <div class="pointer-events-none absolute top-5 left-6 hidden sm:flex items-center gap-2 text-xs font-mono text-base-content/40">
      <Terminal class="size-3.5 text-primary/70" />
      <span>TACHY.CONSOLE // RESTRICTED ACCESS</span>
    </div>

    <div class="absolute top-5 right-6 hidden sm:flex items-center gap-2">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono text-base-content/60 hover:text-base-content hover:bg-base-200/50 transition-colors"
      >
        <span>Public Arena</span>
        <ExternalLink class="size-3" />
      </NuxtLink>
    </div>

    <!-- MAIN CONSOLE CARD -->
    <div class="relative z-10 w-full max-w-[420px]">
      <!-- Card Outer Container with Border Accent -->
      <div class="relative overflow-hidden rounded-3xl border border-base-300/80 bg-base-200/70 p-7 sm:p-9 shadow-2xl backdrop-blur-xl transition-all">
        <!-- Subtle Top Edge Gradient Accent Line -->
        <div class="pointer-events-none absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <!-- Header: Brand Logo -->
        <div class="text-center">
          <!-- Centered Brand Logo -->
          <div class="flex justify-center">
            <BrandLogo variant="auto" class="h-8" />
          </div>

          <!-- Title & Subtitle -->
          <h1 class="mt-3 text-xl font-bold tracking-tight text-base-content sm:text-2xl">
            {{ isTwoFactorStep ? 'Security Challenge' : 'Administrator Sign-In' }}
          </h1>
          <p class="mt-1.5 text-xs text-base-content/60 leading-relaxed max-w-xs mx-auto">
            {{ isTwoFactorStep
              ? 'Enter the 6-digit TOTP code or backup key to verify identity.'
              : 'Privileged console access for moderation, telemetry, and platform management.'
            }}
          </p>
        </div>

        <!-- STEP 1: CREDENTIALS AUTHENTICATION -->
        <form v-if="!isTwoFactorStep" class="mt-7 space-y-4" @submit.prevent="submitPassword">
          <!-- Email Input -->
          <div class="space-y-1.5">
            <label for="admin-email" class="flex items-center gap-1.5 font-mono text-xs font-semibold text-base-content/80">
              <Mail class="size-3 text-base-content/50" />
              <span>Administrator Email</span>
            </label>
            <input
              id="admin-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="admin@tachy.app"
              class="input input-bordered w-full bg-base-100 text-xs font-mono shadow-xs focus:border-primary focus:outline-none transition-colors"
            >
          </div>

          <!-- Password Input with Reveal Toggle -->
          <div class="space-y-1.5">
            <label for="admin-password" class="flex items-center gap-1.5 font-mono text-xs font-semibold text-base-content/80">
              <KeyRound class="size-3 text-base-content/50" />
              <span>Master Password</span>
            </label>
            <div class="relative flex items-center">
              <input
                id="admin-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••••••••••"
                class="input input-bordered w-full bg-base-100 pr-10 text-xs font-mono shadow-xs focus:border-primary focus:outline-none transition-colors"
              >
              <button
                type="button"
                class="absolute right-3 text-base-content/40 hover:text-base-content focus:outline-none transition-colors"
                tabindex="-1"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div
            v-if="error"
            class="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error shadow-xs"
            role="alert"
          >
            <AlertTriangle class="size-4 shrink-0 mt-0.5" />
            <span class="font-medium leading-snug">{{ error }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary w-full gap-2 font-mono text-xs font-bold tracking-wide shadow-sm hover:shadow-primary/20 transition-all mt-2"
            :disabled="pending"
          >
            <span v-if="pending" class="loading loading-spinner loading-xs" />
            <Lock v-else class="size-3.5" />
            <span>{{ pending ? 'AUTHENTICATING…' : 'SIGN IN TO CONSOLE' }}</span>
          </button>
        </form>

        <!-- STEP 2: MULTI-FACTOR AUTHENTICATION CHALLENGE -->
        <form v-else class="mt-7 space-y-5" @submit.prevent="verifyTwoFactor">
          <div class="text-center space-y-2">
            <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Fingerprint class="size-6" />
            </div>

            <label class="block font-mono text-xs font-bold text-base-content">
              {{ useBackup ? 'Enter 8-Character Backup Code' : 'Enter 6-Digit Authenticator Code' }}
            </label>

            <!-- 6-digit TOTP input -->
            <div v-if="!useBackup" class="pt-1">
              <input
                v-model="totpCode"
                type="text"
                inputmode="numeric"
                pattern="[0-9]{6}"
                maxlength="6"
                required
                autofocus
                placeholder="000000"
                class="input input-bordered mx-auto w-52 bg-base-100 text-center font-mono text-2xl font-black tracking-[0.4em] shadow-xs focus:border-primary focus:outline-none"
              >
              <p class="mt-2 text-[11px] text-base-content/50 font-mono">
                Open Google Authenticator, Authy, or your 2FA app
              </p>
            </div>

            <!-- Backup Code Input -->
            <div v-else class="pt-1">
              <input
                v-model="totpCode"
                type="text"
                required
                autofocus
                placeholder="e.g. a1b2c3d4"
                class="input input-bordered w-full bg-base-100 text-center font-mono text-sm tracking-widest shadow-xs focus:border-primary focus:outline-none"
              >
              <p class="mt-2 text-[11px] text-base-content/50 font-mono">
                One-time emergency recovery code generated during setup
              </p>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div
            v-if="error"
            class="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error text-left shadow-xs"
            role="alert"
          >
            <AlertTriangle class="size-4 shrink-0 mt-0.5" />
            <span class="font-medium leading-snug">{{ error }}</span>
          </div>

          <!-- Verify Button -->
          <button
            type="submit"
            class="btn btn-primary w-full gap-2 font-mono text-xs font-bold tracking-wide shadow-sm hover:shadow-primary/20 transition-all"
            :disabled="pending || !totpCode.trim()"
          >
            <span v-if="pending" class="loading loading-spinner loading-xs" />
            <ArrowRight v-else class="size-3.5" />
            <span>{{ pending ? 'VERIFYING CODE…' : 'VERIFY & CONTINUE' }}</span>
          </button>

          <!-- Toggle Backup vs TOTP -->
          <div class="flex items-center justify-between pt-1 font-mono text-xs text-base-content/60">
            <button
              type="button"
              class="hover:text-primary transition-colors inline-flex items-center gap-1"
              @click="useBackup = !useBackup; totpCode = ''; error = ''"
            >
              <span>{{ useBackup ? '← Use TOTP Code' : 'Use backup recovery code' }}</span>
            </button>

            <button
              type="button"
              class="hover:text-base-content transition-colors inline-flex items-center gap-1"
              @click="backToPassword"
            >
              <ArrowLeft class="size-3" />
              <span>Back</span>
            </button>
          </div>
        </form>

        <!-- CARD FOOTER: SECURITY SPEC & HOME LINK -->
        <div class="mt-8 border-t border-base-300/80 pt-4 flex items-center justify-between font-mono text-[11px] text-base-content/40">
          <div class="flex items-center gap-1.5">
            <span class="size-1.5 rounded-full bg-success animate-pulse" />
            <span>256-Bit TLS · Zero Leak</span>
          </div>

          <NuxtLink
            to="/"
            class="inline-flex items-center gap-1 hover:text-primary transition-colors sm:hidden"
          >
            <span>Public Arena</span>
            <ExternalLink class="size-3" />
          </NuxtLink>
          <span class="hidden sm:inline opacity-70">Tachy Engine</span>
        </div>
      </div>
    </div>
  </div>
</template>
