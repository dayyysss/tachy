<script setup lang="ts">
import {
  Wrench,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  MessageSquare,
  Github,
  Keyboard,
  ArrowRight,
  Flame,
  AlertTriangle,
  RotateCcw,
} from 'lucide-vue-next'

const props = defineProps<{
  error: { statusCode: number; statusMessage?: string; message?: string }
}>()

const is503 = computed(() => props.error.statusCode === 503)
const is404 = computed(() => props.error.statusCode === 404)

const { user } = useAuth()
const config = useRuntimeConfig()
const panelSegment = computed(() => ((config.public.adminPanelBase as string) || 'tachos').replace(/^\/+|\/+$/g, ''))
const panelDashboardUrl = computed(() => `/${panelSegment.value}/dashboard`)

// Health check & auto-poll state
const isChecking = ref(false)
const checkMessage = ref<string | null>(null)
const autoCheckSeconds = ref(15)
const isOnline = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

async function checkStatus() {
  if (isChecking.value) return
  isChecking.value = true
  checkMessage.value = 'Pinging Tachy health services…'
  try {
    const res = await $fetch<{ status: string; maintenance: boolean }>('/api/health')
    if (res && res.status === 'ok' && !res.maintenance) {
      isOnline.value = true
      checkMessage.value = 'Platform is back online! Redirecting…'
      setTimeout(() => {
        clearError({ redirect: '/' })
      }, 1000)
    } else {
      checkMessage.value = 'Maintenance still active. We are making progress!'
      setTimeout(() => {
        if (!isOnline.value) checkMessage.value = null
      }, 3500)
    }
  } catch {
    checkMessage.value = 'Platform still updating. Retrying shortly.'
    setTimeout(() => {
      if (!isOnline.value) checkMessage.value = null
    }, 3500)
  } finally {
    isChecking.value = false
  }
}

// Offline typing warm-up mini-sandbox
const sampleWordList = ['swift', 'keystroke', 'rhythm', 'cadence', 'accuracy', 'focus', 'velocity', 'tachy', 'keyboard', 'latency', 'flow', 'telemetry', 'benchmark', 'switch', 'tactile']
const currentTargetIndex = ref(0)
const currentWord = computed(() => sampleWordList[currentTargetIndex.value % sampleWordList.length])
const nextWord = computed(() => sampleWordList[(currentTargetIndex.value + 1) % sampleWordList.length])

const warmUpInput = ref('')
const warmUpKeyCount = ref(0)
const warmUpWordsCompleted = ref(0)
const warmUpStartTime = ref<number | null>(null)

const warmUpWpm = computed(() => {
  if (!warmUpStartTime.value || warmUpKeyCount.value === 0) return 0
  const elapsedMinutes = (Date.now() - warmUpStartTime.value) / 60000
  return Math.max(1, Math.round((warmUpKeyCount.value / 5) / (elapsedMinutes || 0.01)))
})

function onWarmUpInput(e: Event) {
  if (!warmUpStartTime.value) warmUpStartTime.value = Date.now()
  const val = warmUpInput.value
  if (val.endsWith(' ') || val.endsWith('\n')) {
    const typed = val.trim()
    if (typed === currentWord.value) {
      warmUpKeyCount.value += typed.length + 1
      warmUpWordsCompleted.value++
      currentTargetIndex.value++
      warmUpInput.value = ''
    } else if (typed.length > 0) {
      warmUpKeyCount.value += typed.length + 1
      currentTargetIndex.value++
      warmUpInput.value = ''
    }
  }
}

function resetWarmUp() {
  warmUpInput.value = ''
  warmUpKeyCount.value = 0
  warmUpWordsCompleted.value = 0
  warmUpStartTime.value = null
  currentTargetIndex.value = 0
}

const handleClear = () => clearError({ redirect: '/' })

onMounted(() => {
  if (is503.value) {
    timer = setInterval(() => {
      autoCheckSeconds.value--
      if (autoCheckSeconds.value <= 0) {
        autoCheckSeconds.value = 15
        checkStatus()
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-base-100 flex flex-col justify-between font-sans selection:bg-primary/20 text-base-content">
    <!-- Atmospheric Ambient Lighting Elements -->
    <div class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[150px] opacity-70" />
    <div class="pointer-events-none absolute top-1/2 -left-48 size-96 rounded-full bg-warning/5 blur-[130px] opacity-50" />
    <div class="pointer-events-none absolute bottom-10 -right-36 size-[400px] rounded-full bg-primary/5 blur-[140px] opacity-40" />

    <!-- Subtle Tactical Radial Dot Grid -->
    <svg class="pointer-events-none absolute inset-0 size-full text-base-content/5 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]">
      <defs>
        <pattern id="maintenance-grid" width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#maintenance-grid)" />
    </svg>

    <!-- Top Minimal Navigation Bar -->
    <header class="relative z-20 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
      <div class="inline-flex items-center gap-2.5 font-mono font-bold text-primary select-none">
        <span class="rounded-xl bg-primary/20 px-2.5 py-1 text-primary border border-primary/30 text-sm">T</span>
        <span class="text-base-content font-sans text-lg font-bold tracking-tight">Tachy</span>
      </div>
      <div class="flex items-center gap-2">
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-xs border border-base-300 font-mono gap-1.5 text-xs text-base-content/70 hover:text-base-content"
        >
          <MessageSquare class="size-3.5 text-[#5865F2]" />
          <span class="hidden sm:inline">Discord Status</span>
        </a>
        <a
          href="https://github.com/dayyysss/tachy"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-xs border border-base-300 font-mono gap-1.5 text-xs text-base-content/70 hover:text-base-content"
        >
          <Github class="size-3.5" />
          <span class="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>

    <!-- MAIN HERO CONTENT -->
    <main class="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <!-- 503 SPECIFIC MODERN MAINTENANCE PRESENTATION -->
      <template v-if="is503">
        <!-- Logged-in Administrator Quick Bypass & Dashboard Access Banner -->
        <div
          v-if="user?.role === 'admin'"
          class="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-mono text-primary flex flex-wrap items-center justify-between gap-3 max-w-lg w-full mb-6 shadow-sm"
        >
          <span class="flex items-center gap-1.5 font-bold">
            <ShieldCheck class="size-4" />
            <span>Admin Active · Maintenance Bypass Available</span>
          </span>
          <div class="flex items-center gap-2">
            <a :href="panelDashboardUrl" class="btn btn-primary btn-xs font-sans font-semibold">
              Dashboard →
            </a>
            <a href="/?bypass=1" class="btn btn-ghost btn-xs font-mono border border-primary/30">
              Preview Home (?bypass=1)
            </a>
          </div>
        </div>

        <!-- 3D Isometric Futuristic Maintenance Chassis SVG -->
        <div class="relative mb-6 w-full max-w-[360px] sm:max-w-[440px] transition-transform hover:scale-[1.02] duration-300">
          <!-- Ambient Base Shadow & Pulse Glow -->
          <div class="pointer-events-none absolute inset-0 -bottom-6 rounded-full bg-primary/15 blur-2xl transform scale-75" />

          <svg
            viewBox="0 0 500 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="relative z-10 w-full drop-shadow-2xl"
          >
            <defs>
              <!-- Metallic Chassis Linear Gradients -->
              <linearGradient id="chassisTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2a2e36" />
                <stop offset="100%" stop-color="#1e2127" />
              </linearGradient>
              <linearGradient id="chassisLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1b1d22" />
                <stop offset="100%" stop-color="#131418" />
              </linearGradient>
              <linearGradient id="chassisRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#24272e" />
                <stop offset="100%" stop-color="#17191d" />
              </linearGradient>

              <!-- Glowing Amber Accents -->
              <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#f4c95d" stop-opacity="0.9" />
                <stop offset="50%" stop-color="#ffd56b" stop-opacity="1" />
                <stop offset="100%" stop-color="#d9a838" stop-opacity="0.8" />
              </linearGradient>

              <!-- Hex Grid Base Plate Gradient -->
              <linearGradient id="gridBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#22252a" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#141619" stop-opacity="0.9" />
              </linearGradient>

              <!-- Neon Blue Pulse Gradients -->
              <linearGradient id="cyanData" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#60a5fa" />
                <stop offset="100%" stop-color="#3b82f6" />
              </linearGradient>

              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- 1. BASE ISOMETRIC PLATFORM -->
            <polygon points="250,230 430,140 250,50 70,140" fill="url(#gridBase)" stroke="#3b404a" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" />
            <!-- Isometric Platform Bevel Thickness -->
            <polygon points="70,140 250,230 250,242 70,152" fill="#15171a" />
            <polygon points="250,230 430,140 430,152 250,242" fill="#1c1f24" />

            <!-- Platform Circuit Trace Paths -->
            <path d="M 120 135 L 200 175 L 250 150" stroke="#f4c95d" stroke-width="1.5" opacity="0.3" fill="none" />
            <path d="M 380 135 L 300 175 L 250 150" stroke="#60a5fa" stroke-width="1.5" opacity="0.3" fill="none" />
            <circle cx="200" cy="175" r="2.5" fill="#f4c95d" opacity="0.6" />
            <circle cx="300" cy="175" r="2.5" fill="#60a5fa" opacity="0.6" />

            <!-- 2. MAIN ISOMETRIC SERVER TOWER / TYPING MAINFRAME -->
            <!-- Left Face of Mainframe -->
            <polygon points="170,150 250,195 250,290 170,245" fill="url(#chassisLeft)" stroke="#323740" stroke-width="1.5" />
            <!-- Right Face of Mainframe -->
            <polygon points="250,195 330,150 330,245 250,290" fill="url(#chassisRight)" stroke="#3a404b" stroke-width="1.5" />
            <!-- Top Face of Mainframe -->
            <polygon points="250,105 330,150 250,195 170,150" fill="url(#chassisTop)" stroke="#454c59" stroke-width="1.5" />

            <!-- Left Face Ventilation Grilles / Server Blades -->
            <line x1="185" y1="175" x2="235" y2="203" stroke="#0e1013" stroke-width="2.5" stroke-linecap="round" />
            <line x1="185" y1="190" x2="235" y2="218" stroke="#0e1013" stroke-width="2.5" stroke-linecap="round" />
            <line x1="185" y1="205" x2="235" y2="233" stroke="#0e1013" stroke-width="2.5" stroke-linecap="round" />
            <line x1="185" y1="220" x2="235" y2="248" stroke="#0e1013" stroke-width="2.5" stroke-linecap="round" />
            <line x1="185" y1="235" x2="235" y2="263" stroke="#0e1013" stroke-width="2.5" stroke-linecap="round" />

            <!-- Right Face Blade Status LEDs -->
            <!-- LED Array 1 -->
            <circle cx="265" cy="207" r="2" fill="#f4c95d" filter="url(#softGlow)" />
            <line x1="275" y1="202" x2="315" y2="180" stroke="#f4c95d" stroke-width="1.5" opacity="0.4" stroke-linecap="round" />
            <!-- LED Array 2 -->
            <circle cx="265" cy="222" r="2" fill="#f4c95d" filter="url(#softGlow)" />
            <line x1="275" y1="217" x2="315" y2="195" stroke="#f4c95d" stroke-width="1.5" opacity="0.4" stroke-linecap="round" />
            <!-- LED Array 3 (Pulsing Active Tuning) -->
            <circle cx="265" cy="237" r="2.5" fill="#f4c95d" class="animate-pulse" filter="url(#softGlow)" />
            <line x1="275" y1="232" x2="315" y2="210" stroke="#ffd56b" stroke-width="2" opacity="0.8" stroke-linecap="round" />
            <!-- LED Array 4 -->
            <circle cx="265" cy="252" r="2" fill="#60a5fa" filter="url(#softGlow)" />
            <line x1="275" y1="247" x2="315" y2="225" stroke="#60a5fa" stroke-width="1.5" opacity="0.4" stroke-linecap="round" />
            <!-- LED Array 5 -->
            <circle cx="265" cy="267" r="2" fill="#10b981" filter="url(#softGlow)" />
            <line x1="275" y1="262" x2="315" y2="240" stroke="#10b981" stroke-width="1.5" opacity="0.4" stroke-linecap="round" />

            <!-- Amber Central Energy Core Line -->
            <line x1="250" y1="195" x2="250" y2="290" stroke="#f4c95d" stroke-width="2" filter="url(#softGlow)" opacity="0.9" />

            <!-- 3. FLOATING 3D MECHANICAL SWITCH STEM (The Heart of Tachy) -->
            <g class="animate-bounce" style="animation-duration: 3.2s; animation-timing-function: ease-in-out;">
              <!-- Switch Housing Top -->
              <polygon points="250,45 285,65 250,85 215,65" fill="#2d323b" stroke="#f4c95d" stroke-width="1.5" />
              <!-- Switch Housing Left Side -->
              <polygon points="215,65 250,85 250,110 215,90" fill="#1f2228" stroke="#3d434f" stroke-width="1" />
              <!-- Switch Housing Right Side -->
              <polygon points="250,85 285,65 285,90 250,110" fill="#262a32" stroke="#3d434f" stroke-width="1" />

              <!-- Cross Stem (+) Cherry MX Style Stem in Amber Gold -->
              <polygon points="247,40 253,40 253,60 247,60" fill="#f4c95d" />
              <polygon points="237,50 263,50 263,56 237,56" fill="#f4c95d" />

              <!-- Floating Hologram Ring around Switch -->
              <ellipse cx="250" cy="78" rx="55" ry="24" fill="none" stroke="#f4c95d" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6" filter="url(#softGlow)" />
            </g>

            <!-- 4. FLOATING TELEMETRY DATA CUBES (Left & Right) -->
            <!-- Left Data Cube -->
            <g class="animate-pulse" style="animation-duration: 2.6s;">
              <polygon points="120,95 140,105 120,115 100,105" fill="#2a2e36" stroke="#60a5fa" stroke-width="1" />
              <polygon points="100,105 120,115 120,130 100,120" fill="#181a1f" stroke="#60a5fa" stroke-width="0.8" />
              <polygon points="120,115 140,105 140,120 120,130" fill="#20232a" stroke="#60a5fa" stroke-width="0.8" />
              <line x1="120" y1="130" x2="150" y2="160" stroke="#60a5fa" stroke-width="1" stroke-dasharray="2 3" opacity="0.4" />
            </g>

            <!-- Right Maintenance Tool / Telemetry Chip -->
            <g class="animate-pulse" style="animation-duration: 3.8s;">
              <polygon points="380,85 400,95 380,105 360,95" fill="#2a2e36" stroke="#f4c95d" stroke-width="1" />
              <polygon points="360,95 380,105 380,120 360,110" fill="#181a1f" stroke="#f4c95d" stroke-width="0.8" />
              <polygon points="380,105 400,95 400,110 380,120" fill="#20232a" stroke="#f4c95d" stroke-width="0.8" />
              <line x1="380" y1="120" x2="330" y2="165" stroke="#f4c95d" stroke-width="1" stroke-dasharray="2 3" opacity="0.4" />
            </g>

            <!-- 5. TACTICAL 503 WATERMARK BADGE IN ISOMETRIC PLANE -->
            <text x="250" y="325" text-anchor="middle" font-family="monospace" font-size="12" font-weight="700" fill="#f4c95d" opacity="0.6" letter-spacing="4">
              TACHY // ENGINE RE-CALIBRATION
            </text>
          </svg>
        </div>

        <!-- Status Pill with Pulsing Dot -->
        <div class="inline-flex items-center gap-2.5 rounded-full border border-warning/30 bg-warning/10 px-4 py-1.5 text-xs font-mono font-semibold text-warning shadow-xs">
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-75" />
            <span class="relative inline-flex size-2 rounded-full bg-warning" />
          </span>
          <span>SYSTEM MAINTENANCE · HTTP 503</span>
        </div>

        <!-- Headline & Humanized Narrative -->
        <h1 class="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-base-content max-w-xl">
          Engine Optimization in Progress
        </h1>

        <p class="mt-3 text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-lg font-sans">
          We are performing scheduled maintenance on the typing engine and database cluster to improve keystroke latency and leaderboard throughput.
          Your personal bests, history, and streak integrity are safely preserved.
        </p>

        <!-- Live Server Status Check & Action Buttons -->
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            class="btn btn-primary btn-sm px-5 font-semibold gap-2 shadow-xs font-mono"
            :disabled="isChecking || isOnline"
            @click="checkStatus"
          >
            <span v-if="isChecking" class="loading loading-spinner loading-xs" />
            <CheckCircle2 v-else-if="isOnline" class="size-4 text-primary-content" />
            <RefreshCw v-else class="size-3.5" />
            <span>{{ isOnline ? 'Online! Redirecting…' : (isChecking ? 'Pinging Node…' : 'Check Server Status') }}</span>
          </button>

          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm border-base-300 font-mono text-xs gap-1.5 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2]"
          >
            <MessageSquare class="size-3.5" />
            <span>Live Discord Updates</span>
            <ExternalLink class="size-3 opacity-60" />
          </a>
        </div>

        <!-- Auto-check Timer Countdown Indicator -->
        <div class="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-mono text-base-content/50">
          <Clock class="size-3 text-warning/70" />
          <span>Auto-rechecking in <span class="text-warning font-bold tabular-nums">{{ autoCheckSeconds }}s</span></span>
        </div>

        <p v-if="checkMessage" class="mt-2 text-xs font-mono transition-all font-semibold" :class="isOnline ? 'text-success' : 'text-warning'">
          {{ checkMessage }}
        </p>

        <!-- MINI OFFLINE WARM-UP TYPING SANDBOX -->
        <div class="mt-8 w-full max-w-md rounded-2xl border border-base-300/80 bg-base-200/50 p-4 sm:p-5 shadow-xs text-left space-y-3">
          <div class="flex items-center justify-between border-b border-base-300/80 pb-2.5">
            <div class="flex items-center gap-2">
              <Keyboard class="size-4 text-primary" />
              <span class="text-xs font-bold font-mono tracking-tight text-base-content">Offline Finger Warm-up</span>
            </div>
            <div class="flex items-center gap-2 font-mono text-[11px]">
              <span class="badge badge-xs badge-neutral border border-base-300 font-semibold">{{ warmUpWpm }} WPM</span>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content p-0.5"
                title="Reset Warm-up"
                @click="resetWarmUp"
              >
                <RotateCcw class="size-3" />
              </button>
            </div>
          </div>

          <p class="text-[11px] font-sans text-base-content/60">
            Keep your fingers warm while we finish tuning. Type the word below and hit <kbd class="kbd kbd-xs bg-base-300 text-[10px]">Space</kbd>:
          </p>

          <!-- Target Word Display -->
          <div class="flex items-center gap-3 rounded-xl bg-base-100/90 border border-base-300 px-3.5 py-2.5 font-mono text-sm">
            <span class="font-bold text-primary text-base">{{ currentWord }}</span>
            <span class="text-base-content/30 text-xs truncate">{{ nextWord }}</span>
            <span class="ml-auto text-[10px] font-mono text-base-content/40 tabular-nums">Score: {{ warmUpWordsCompleted }}</span>
          </div>

          <!-- Typing Input -->
          <input
            v-model="warmUpInput"
            type="text"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Type word here…"
            class="input input-sm input-bordered w-full font-mono text-xs bg-base-100 focus:border-primary"
            @input="onWarmUpInput"
          >
        </div>
      </template>

      <!-- 404 NOT FOUND PRESENTATION -->
      <template v-else-if="is404">
        <div class="relative mb-6">
          <p class="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-primary/20 select-none">
            404
          </p>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-mono font-bold text-primary shadow-xs">
              <Radio class="size-3.5 animate-pulse" />
              <span>ROUTE NOT FOUND</span>
            </div>
          </div>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          Lost in the Keystrokes
        </h1>
        <p class="mt-2 text-xs sm:text-sm text-base-content/60 max-w-md font-sans">
          The requested page does not exist or has been relocated. Check the address or jump back to the typing benchmark.
        </p>

        <div class="mt-6 flex items-center gap-3">
          <button type="button" class="btn btn-primary btn-sm px-5 font-semibold font-mono" @click="handleClear">
            Return to Typing Area →
          </button>
        </div>
      </template>

      <!-- GENERIC / 500 SERVER ERROR PRESENTATION -->
      <template v-else>
        <div class="rounded-2xl border border-error/30 bg-error/10 p-4 mb-4 text-error inline-flex items-center gap-2 font-mono text-xs font-bold">
          <AlertTriangle class="size-4" />
          <span>ERROR {{ error.statusCode || 500 }}</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          {{ error.statusMessage || 'Unexpected Anomaly' }}
        </h1>
        <p class="mt-2 text-xs sm:text-sm text-base-content/60 max-w-md font-mono">
          {{ error.message || 'An unhandled exception occurred during processing.' }}
        </p>

        <div class="mt-6 flex items-center gap-3">
          <button type="button" class="btn btn-primary btn-sm px-5 font-semibold font-mono" @click="handleClear">
            Clear Error & Retry
          </button>
        </div>
      </template>
    </main>

    <!-- Bottom Footer Minimal -->
    <footer class="relative z-10 border-t border-base-300/60 py-4 text-center font-mono text-[11px] text-base-content/40">
      <p>Tachy Benchmark Engine · Zero ads, pure keystroke telemetry.</p>
    </footer>
  </div>
</template>
