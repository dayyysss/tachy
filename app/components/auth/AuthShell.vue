<script setup lang="ts">
const localePath = useLocalePath()

defineProps<{
  title?: string
  subtitle?: string
  activeTab?: 'login' | 'register' | 'recovery'
  hideTabs?: boolean
}>()
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 md:py-16 overflow-hidden">
    <!-- Atmospheric Ambient Glows -->
    <div class="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-96 sm:size-[560px] rounded-full bg-primary/15 blur-3xl opacity-70" />
    <div class="pointer-events-none absolute bottom-0 -left-20 size-80 sm:size-[460px] rounded-full bg-secondary/15 blur-3xl opacity-50" />
    <div class="pointer-events-none absolute top-1/3 -right-24 size-80 sm:size-[440px] rounded-full bg-primary/10 blur-3xl opacity-40" />

    <!-- Mechanical Keycap Coordinate Pattern Overlay -->
    <svg class="pointer-events-none absolute inset-0 size-full stroke-base-content/5 opacity-70 [mask-image:radial-gradient(circle_at_center,black_60%,transparent_100%)] select-none">
      <defs>
        <pattern id="keyboard-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 24 20 L 24 28 M 20 24 L 28 24" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
          <circle cx="48" cy="48" r="0.8" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#keyboard-grid)" />
    </svg>

    <!-- Top-Left: Speedometer / Tachymeter Arc SVG -->
    <svg class="pointer-events-none absolute -left-10 sm:left-4 -top-6 sm:top-4 size-72 sm:size-[360px] text-primary/15 select-none hidden sm:block" viewBox="0 0 300 300" fill="none">
      <circle cx="150" cy="150" r="130" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 8" />
      <circle cx="150" cy="150" r="105" stroke="currentColor" stroke-width="1" stroke-opacity="0.3" />
      <path d="M 55 215 A 120 120 0 1 1 245 215" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <!-- Tick Marks -->
      <line x1="150" y1="30" x2="150" y2="45" stroke="currentColor" stroke-width="2.5" />
      <line x1="65" y1="65" x2="76" y2="76" stroke="currentColor" stroke-width="2" />
      <line x1="235" y1="65" x2="224" y2="76" stroke="currentColor" stroke-width="2" />
      <line x1="30" y1="150" x2="45" y2="150" stroke="currentColor" stroke-width="2" />
      <line x1="270" y1="150" x2="255" y2="150" stroke="currentColor" stroke-width="2" />
      <!-- Speed Needle -->
      <line x1="150" y1="150" x2="218" y2="82" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <circle cx="150" cy="150" r="9" fill="currentColor" />
      <text x="150" y="195" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="currentColor" letter-spacing="3">142 WPM</text>
      <text x="150" y="212" text-anchor="middle" font-family="monospace" font-size="8" fill="currentColor" opacity="0.6">TACHY VELOCITY</text>
    </svg>

    <!-- Bottom-Right: Mechanical Keyboard Switch & Keycaps SVG -->
    <svg class="pointer-events-none absolute -right-12 sm:right-6 -bottom-8 sm:bottom-4 size-80 sm:size-[400px] text-primary/15 select-none hidden sm:block" viewBox="0 0 320 320" fill="none">
      <g transform="translate(35, 25)">
        <!-- Keycap [F] with touch typing nub -->
        <rect x="0" y="0" width="56" height="56" rx="10" stroke="currentColor" stroke-width="1.5" />
        <rect x="6" y="6" width="44" height="44" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.4" />
        <text x="28" y="32" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="currentColor">F</text>
        <line x1="22" y1="38" x2="34" y2="38" stroke="currentColor" stroke-width="2" stroke-linecap="round" />

        <!-- Keycap [J] with touch typing nub -->
        <rect x="70" y="0" width="56" height="56" rx="10" stroke="currentColor" stroke-width="1.5" />
        <rect x="76" y="6" width="44" height="44" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.4" />
        <text x="98" y="32" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="currentColor">J</text>
        <line x1="92" y1="38" x2="104" y2="38" stroke="currentColor" stroke-width="2" stroke-linecap="round" />

        <!-- MX Mechanical Switch Stem wireframe -->
        <g transform="translate(145, 12)">
          <rect x="0" y="0" width="52" height="52" rx="8" stroke="currentColor" stroke-width="1.5" />
          <circle cx="26" cy="26" r="14" stroke="currentColor" stroke-width="1" />
          <rect x="23" y="16" width="6" height="20" rx="1" fill="currentColor" fill-opacity="0.4" />
          <rect x="16" y="23" width="20" height="6" rx="1" fill="currentColor" fill-opacity="0.4" />
        </g>

        <!-- Keycap [SPACEBAR] -->
        <rect x="0" y="70" width="197" height="44" rx="10" stroke="currentColor" stroke-width="1.5" />
        <rect x="6" y="76" width="185" height="32" rx="6" stroke="currentColor" stroke-width="1" stroke-opacity="0.4" />
        <text x="98" y="96" text-anchor="middle" font-family="monospace" font-size="10" font-weight="semibold" fill="currentColor" letter-spacing="4">SPACEBAR</text>
      </g>
      <!-- Telemetry Cadence Line -->
      <path d="M 20 230 Q 70 190 120 220 T 220 210 T 310 240" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" />
      <circle cx="120" cy="220" r="3.5" fill="currentColor" />
      <circle cx="220" cy="210" r="3.5" fill="currentColor" />
      <text x="220" y="196" text-anchor="middle" font-family="monospace" font-size="9" fill="currentColor" font-weight="bold">99.8% ACC</text>
    </svg>

    <!-- Bottom Keystroke Frequency Histogram Ribbon -->
    <svg class="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-12 text-base-content/10 stroke-current opacity-40 select-none overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 48" fill="none">
      <line x1="0" y1="46" x2="1000" y2="46" stroke-width="1" />
      <!-- Burst Frequency Bars -->
      <line x1="40" y1="46" x2="40" y2="28" stroke-width="3" stroke-linecap="round" />
      <line x1="70" y1="46" x2="70" y2="18" stroke-width="3" stroke-linecap="round" />
      <line x1="100" y1="46" x2="100" y2="34" stroke-width="3" stroke-linecap="round" />
      <line x1="130" y1="46" x2="130" y2="12" stroke-width="3" stroke-linecap="round" />
      <line x1="160" y1="46" x2="160" y2="22" stroke-width="3" stroke-linecap="round" />
      <line x1="190" y1="46" x2="190" y2="8" stroke-width="3" stroke-linecap="round" class="text-primary stroke-current" />
      <line x1="220" y1="46" x2="220" y2="16" stroke-width="3" stroke-linecap="round" />
      <line x1="250" y1="46" x2="250" y2="30" stroke-width="3" stroke-linecap="round" />
      <line x1="750" y1="46" x2="750" y2="26" stroke-width="3" stroke-linecap="round" />
      <line x1="780" y1="46" x2="780" y2="14" stroke-width="3" stroke-linecap="round" />
      <line x1="810" y1="46" x2="810" y2="8" stroke-width="3" stroke-linecap="round" class="text-primary stroke-current" />
      <line x1="840" y1="46" x2="840" y2="20" stroke-width="3" stroke-linecap="round" />
      <line x1="870" y1="46" x2="870" y2="32" stroke-width="3" stroke-linecap="round" />
      <line x1="900" y1="46" x2="900" y2="15" stroke-width="3" stroke-linecap="round" />
      <line x1="930" y1="46" x2="930" y2="25" stroke-width="3" stroke-linecap="round" />
      <line x1="960" y1="46" x2="960" y2="10" stroke-width="3" stroke-linecap="round" />
    </svg>

    <!-- Side Floating Telemetry Cards (Desktop Art) -->
    <div class="hidden xl:flex absolute left-8 2xl:left-24 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-none select-none">
      <div class="flex flex-col gap-2 p-4 rounded-2xl border border-base-300/80 bg-base-100/70 backdrop-blur-md shadow-xl font-mono text-xs w-52 -rotate-2">
        <div class="flex items-center justify-between text-base-content/50 text-[10px]">
          <span class="flex items-center gap-1.5">
            <span class="size-1.5 rounded-full bg-primary animate-ping" />
            <span>SPEED TELEMETRY</span>
          </span>
          <span class="badge badge-xs border-primary/30 text-primary">Live</span>
        </div>
        <div class="flex items-baseline gap-1.5 pt-1">
          <span class="text-3xl font-bold text-primary tabular-nums">136</span>
          <span class="text-[10px] text-base-content/50 uppercase font-semibold">wpm</span>
        </div>
        <div class="h-1.5 w-full bg-base-300 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary to-accent rounded-full w-[85%]" />
        </div>
        <div class="flex items-center justify-between text-[10px] text-base-content/40 pt-0.5">
          <span>Burst: 154 WPM</span>
          <span>Rank: Master</span>
        </div>
      </div>
    </div>

    <div class="hidden xl:flex absolute right-8 2xl:right-24 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-none select-none">
      <div class="flex flex-col gap-2 p-4 rounded-2xl border border-base-300/80 bg-base-100/70 backdrop-blur-md shadow-xl font-mono text-xs w-52 rotate-2">
        <div class="flex items-center justify-between text-base-content/50 text-[10px]">
          <span>TOUCH TYPING KEYS</span>
          <span class="text-success font-semibold">Home Row</span>
        </div>
        <div class="flex items-center justify-center gap-1.5 py-1">
          <kbd class="kbd kbd-sm bg-base-200 border-base-300 text-[10px]">A</kbd>
          <kbd class="kbd kbd-sm bg-base-200 border-base-300 text-[10px]">S</kbd>
          <kbd class="kbd kbd-sm bg-base-200 border-base-300 text-[10px]">D</kbd>
          <kbd class="kbd kbd-sm bg-primary/20 border-primary/40 text-primary font-bold text-[10px]">F</kbd>
          <kbd class="kbd kbd-sm bg-primary/20 border-primary/40 text-primary font-bold text-[10px]">J</kbd>
          <kbd class="kbd kbd-sm bg-base-200 border-base-300 text-[10px]">K</kbd>
          <kbd class="kbd kbd-sm bg-base-200 border-base-300 text-[10px]">L</kbd>
        </div>
        <div class="flex items-center justify-between text-[10px] text-base-content/40 pt-0.5">
          <span>Accuracy: 99.8%</span>
          <span>0 Errors</span>
        </div>
      </div>
    </div>

    <!-- Main Auth Card -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Glow beam on top of card -->
      <div class="relative rounded-3xl border border-base-300/80 bg-base-100/85 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/10 ring-1 ring-white/5 overflow-hidden">
        <div class="absolute -top-px left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <!-- Header Icon Badge & Typing Motifs -->
        <div class="text-center">
          <div class="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-inner p-2">
            <!-- Tachy Brand Logo Mark -->
            <BrandLogo mark :to="localePath('/')" imgClass="size-11 object-contain" />
          </div>

          <h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="mt-1.5 text-xs text-base-content/60 leading-relaxed">
            {{ subtitle }}
          </p>
        </div>

        <!-- Tab Bar Switcher (Sign In / Sign Up) -->
        <div v-if="!hideTabs && activeTab" class="mt-6 grid grid-cols-2 p-1 rounded-xl bg-base-200/80 border border-base-300/80 font-mono text-xs">
          <NuxtLink
            :to="localePath('/login')"
            class="py-2 text-center rounded-lg font-medium transition-all"
            :class="activeTab === 'login' ? 'bg-base-100 text-primary font-semibold shadow-xs' : 'text-base-content/60 hover:text-base-content'"
          >
            Sign In
          </NuxtLink>
          <NuxtLink
            :to="localePath('/register')"
            class="py-2 text-center rounded-lg font-medium transition-all"
            :class="activeTab === 'register' ? 'bg-base-100 text-primary font-semibold shadow-xs' : 'text-base-content/60 hover:text-base-content'"
          >
            Create Account
          </NuxtLink>
        </div>

        <!-- Form Slot -->
        <div class="mt-6">
          <slot />
        </div>
      </div>

      <!-- Subtle Footer / Tip -->
      <div class="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-base-content/40">
        <span class="inline-block size-1.5 rounded-full bg-primary/60" />
        <span>Tactile typing experience · 100% distraction-free</span>
      </div>
    </div>
  </div>
</template>
