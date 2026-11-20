<script setup lang="ts">
import { Volume2, VolumeX, Sparkles, ArrowRight, X } from 'lucide-vue-next'
import { localDate } from '#shared/utils/dates'

useSeo('home')

const store = useTestStore()
const { settings } = storeToRefs(useSettingsStore())
const engine = useTypingEngine()
const dismissedDaily = useState('tachy_dismiss_daily', () => false)
const showDailyPopup = computed(() => !dismissedDaily.value && store.status !== 'running')

useHead(() => ({
  bodyAttrs: {
    class: settings.value.appearance.focusMode && store.status === 'running' ? 'focus-mode' : '',
  },
}))

watch(() => store.config, () => engine.restart(), { deep: true })

function updateConfig(patch: Parameters<typeof store.setConfig>[0]) {
  store.setConfig(patch)
}

function restart() {
  engine.restart()
}

function repeat() {
  engine.restart(true)
}

onMounted(() => {
  window.addEventListener('tachy-restart-test', restart)
})

onUnmounted(() => {
  window.removeEventListener('tachy-restart-test', restart)
})

const showConfig = computed(() => !settings.value.appearance.focusMode || store.status !== 'running')
</script>

<template>
  <div class="relative flex-1 min-h-[75vh] w-full flex flex-col justify-center overflow-x-clip">
    <!-- Atmospheric Ambient Yellow-to-Dark Center Vignette -->
    <div
      class="pointer-events-none absolute inset-0 -z-0 flex items-center justify-center transition-opacity duration-700"
      :class="store.status === 'running' ? 'opacity-85' : 'opacity-100'"
      aria-hidden="true"
    >
      <div
        class="size-full"
        style="background: radial-gradient(ellipse 70% 60% at 50% 50%, color-mix(in oklch, var(--color-primary) 7%, transparent) 0%, color-mix(in oklch, var(--color-primary) 3%, transparent) 35%, color-mix(in oklch, var(--color-primary) 0.8%, transparent) 60%, transparent 75%);"
      />
    </div>

    <div class="mx-auto flex w-full max-w-7xl flex-col justify-center gap-8 px-4 sm:px-8 lg:px-12 py-8 relative z-10">
      <section class="chrome pt-2 text-center">
        <h1 class="text-xs uppercase tracking-[0.25em] text-base-content/40 font-mono">Tachy typing test</h1>
        <p class="mt-1 text-xs text-base-content/40">Clean, replay-verified typing test. Track WPM and improve accuracy.</p>
      </section>

      <ClientOnly>
        <div class="relative z-30">
          <ConfigBar
            v-show="showConfig"
            :config="store.config"
            @update="updateConfig"
          />
        </div>

      <AnimatePresence mode="wait">
        <Motion
          v-if="store.status === 'finished' && store.result"
          key="result-screen"
          as="div"
          class="relative z-10"
          :initial="{ opacity: 0, y: 16, scale: 0.98 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.96 }"
          :transition="{ duration: 0.28, ease: 'easeOut' }"
        >
          <ResultCard
            :result="store.result"
            :is-pb="store.isPB"
            :server-id="store.serverId"
            :server-meta="store.serverMeta"
            @next="engine.next"
            @repeat="repeat"
            @restart="restart"
          />
        </Motion>

        <Motion
          v-else
          key="typing-screen"
          as="div"
          class="relative z-10 flex flex-col gap-6"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0, y: -10 }"
          :transition="{ duration: 0.2 }"
        >
          <LiveStats
            :metrics="engine.metrics.value"
            :remaining-ms="engine.remainingMs.value"
            :elapsed-ms="engine.elapsedMs.value"
            :mode="store.config.mode"
            :text-width="settings.appearance.textWidth"
            :show-wpm="settings.appearance.showLiveWpm"
            :show-accuracy="settings.appearance.showLiveAccuracy"
            :show-timer="settings.appearance.showTimer"
            :is-running="store.status === 'running'"
          />

          <!-- Soft Typing Stage Container -->
          <div
            class="relative mx-auto w-full transition-all duration-500 py-2 sm:py-3"
            :class="{
              'max-w-4xl': settings.appearance.textWidth === 'narrow',
              'max-w-6xl': settings.appearance.textWidth === 'medium' || !settings.appearance.textWidth,
              'max-w-7xl': settings.appearance.textWidth === 'wide',
            }"
          >
            <!-- Soft Decorative Typing Motifs & Viewfinder Accents (Fades gently when running) -->
            <div
              class="pointer-events-none absolute inset-0 select-none transition-opacity duration-500"
              :class="store.status === 'running' ? 'opacity-15' : 'opacity-60'"
            >
              <!-- Viewfinder Corner Accents -->
              <svg class="absolute -top-1 left-2 sm:left-6 size-3.5 text-base-content/25" viewBox="0 0 16 16" fill="none">
                <path d="M 0 10 L 0 0 L 10 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <svg class="absolute -top-1 right-2 sm:right-6 size-3.5 text-base-content/25" viewBox="0 0 16 16" fill="none">
                <path d="M 16 10 L 16 0 L 6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <svg class="absolute -bottom-1 left-2 sm:left-6 size-3.5 text-base-content/25" viewBox="0 0 16 16" fill="none">
                <path d="M 0 6 L 0 16 L 10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <svg class="absolute -bottom-1 right-2 sm:right-6 size-3.5 text-base-content/25" viewBox="0 0 16 16" fill="none">
                <path d="M 16 6 L 16 16 L 6 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>

              <!-- Left Side: Soft Tachymeter Curve Watermark -->
              <svg class="absolute -left-6 sm:left-0 top-1/2 -translate-y-1/2 size-40 sm:size-48 text-primary/[0.06] select-none hidden lg:block" viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="1" stroke-dasharray="2 4" />
                <path d="M 25 115 A 64 64 0 1 1 135 115" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="80" y1="16" x2="80" y2="24" stroke="currentColor" stroke-width="1.5" />
                <line x1="35" y1="35" x2="41" y2="41" stroke="currentColor" stroke-width="1.5" />
                <line x1="125" y1="35" x2="119" y2="41" stroke="currentColor" stroke-width="1.5" />
                <line x1="80" y1="80" x2="115" y2="45" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="80" cy="80" r="3.5" fill="currentColor" />
                <text x="80" y="105" text-anchor="middle" font-family="monospace" font-size="7" font-weight="bold" fill="currentColor" letter-spacing="1.5">TACHY</text>
              </svg>

              <!-- Right Side: Soft Mechanical Switch & Homing Keys Watermark -->
              <svg class="absolute -right-6 sm:right-0 top-1/2 -translate-y-1/2 size-40 sm:size-48 text-primary/[0.06] select-none hidden lg:block" viewBox="0 0 160 160" fill="none">
                <!-- Keycap F with Nub -->
                <rect x="25" y="35" width="40" height="40" rx="8" stroke="currentColor" stroke-width="1" />
                <text x="45" y="58" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor">F</text>
                <line x1="41" y1="64" x2="49" y2="64" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <!-- Keycap J with Nub -->
                <rect x="75" y="35" width="40" height="40" rx="8" stroke="currentColor" stroke-width="1" />
                <text x="95" y="58" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor">J</text>
                <line x1="91" y1="64" x2="99" y2="64" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <!-- Switch Stem -->
                <rect x="122" y="42" width="26" height="26" rx="4" stroke="currentColor" stroke-width="1" />
                <rect x="133" y="50" width="4" height="10" rx="0.5" fill="currentColor" />
                <rect x="130" y="53" width="10" height="4" rx="0.5" fill="currentColor" />
                <!-- Rhythm Line -->
                <path d="M 20 100 Q 55 85 90 98 T 150 92" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-dasharray="2 3" />
              </svg>

              <!-- Bottom Cadence Rhythm Tick Ruler -->
              <div class="absolute -bottom-2 left-1/4 right-1/4 flex items-center justify-between opacity-30 px-4">
                <span class="h-1.5 w-px bg-base-content/40" />
                <span class="h-1 w-px bg-base-content/25" />
                <span class="h-1 w-px bg-base-content/25" />
                <span class="h-1 w-px bg-base-content/25" />
                <span class="h-2 w-px bg-primary/60" />
                <span class="h-1 w-px bg-base-content/25" />
                <span class="h-1 w-px bg-base-content/25" />
                <span class="h-1 w-px bg-base-content/25" />
                <span class="h-1.5 w-px bg-base-content/40" />
              </div>
            </div>

            <!-- Typing Area Component -->
            <TypingArea
              :words="engine.targetWords.value"
              :typed="engine.typedWords.value"
              :cursor="engine.cursorWord.value"
              :font-family="settings.appearance.fontFamily"
              :font-size="settings.appearance.fontSize"
              :text-width="settings.appearance.textWidth"
              :blind="settings.behavior.blindMode"
              :quick-restart="settings.behavior.quickRestart"
              :caret-style="settings.appearance.caretStyle"
              :smooth-caret="settings.appearance.smoothCaret"
              :show-keyboard="settings.appearance.showKeyboard"
              @press="engine.press"
              @restart="restart"
              @toggle-keyboard="settings.appearance.showKeyboard = !settings.appearance.showKeyboard"
            />
          </div>

          <div v-if="store.config.mode === 'zen'" class="text-center">
            <button type="button" class="btn btn-ghost btn-xs text-primary" @click="engine.finish">End test</button>
          </div>

          <div class="chrome mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-base-content/40 font-mono">
            <span>{{ $t('home.hint') }}</span>
            <span class="opacity-30">·</span>
            <span>restart with <kbd class="kbd kbd-xs bg-base-200 border-base-300">tab</kbd> or <kbd class="kbd kbd-xs bg-base-200 border-base-300">esc</kbd></span>
            <span class="opacity-30">·</span>
            <button
              type="button"
              class="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
              :class="settings.appearance.showKeyboard ? 'text-primary font-semibold' : ''"
              title="Toggle animated keyboard visualizer"
              @click="settings.appearance.showKeyboard = !settings.appearance.showKeyboard"
            >
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
              </svg>
              <span>keyboard: {{ settings.appearance.showKeyboard ? 'on' : 'off' }}</span>
            </button>
            <span class="opacity-30">·</span>
            <button
              type="button"
              class="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
              :class="settings.sound.enabled ? 'text-primary font-semibold' : ''"
              title="Toggle mechanical typing sounds"
              @click="settings.sound.enabled = !settings.sound.enabled"
            >
              <Volume2 v-if="settings.sound.enabled" class="size-3.5 text-primary" />
              <VolumeX v-else class="size-3.5 opacity-60" />
              <span class="capitalize">sound: {{ settings.sound.enabled ? settings.sound.pack : 'off' }}</span>
            </button>
            <span class="opacity-30">·</span>
            <button
              type="button"
              class="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
              :class="settings.appearance.showLiveWpm ? 'text-primary font-semibold' : ''"
              title="Toggle live telemetry speedometer HUD"
              @click="settings.appearance.showLiveWpm = !settings.appearance.showLiveWpm; settings.appearance.showLiveAccuracy = settings.appearance.showLiveWpm"
            >
              <span>hud: {{ settings.appearance.showLiveWpm ? 'on' : 'off' }}</span>
            </button>
          </div>
        </Motion>
      </AnimatePresence>

        <template #fallback>
          <div class="py-10 text-center text-sm text-base-content/40 font-mono">Loading typing test…</div>
        </template>
      </ClientOnly>
    </div>

    <!-- Floating Daily Challenge Alert (Bottom-Right) -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-4 opacity-0 scale-95"
    >
      <div
        v-if="showDailyPopup"
        class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center"
        role="complementary"
        aria-label="Daily Challenge"
      >
        <div class="relative group flex items-center gap-3 rounded-2xl border border-primary/25 bg-base-200/90 hover:bg-base-200 p-2.5 sm:p-3 pr-3.5 sm:pr-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-primary/5">
          <NuxtLink
            to="/daily"
            class="flex items-center gap-3"
          >
            <div class="size-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles class="size-4 fill-primary/30" />
            </div>
            <div class="flex flex-col text-left">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-base-content group-hover:text-primary transition-colors">Daily Challenge</span>
                <span class="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <span class="text-[11px] font-mono text-base-content/60">{{ localDate() }}</span>
            </div>
            <ArrowRight class="size-3.5 text-primary/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-1" />
          </NuxtLink>

          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content shrink-0 ml-1 cursor-pointer"
            title="Dismiss"
            aria-label="Dismiss daily challenge notification"
            @click.stop="dismissedDaily = true"
          >
            <X class="size-3" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
