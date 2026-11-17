<script setup lang="ts">
import { Share2, Check } from 'lucide-vue-next'
import type { TestResult } from '#shared/types/test'
import ShareModal from './ShareModal.vue'

const props = defineProps<{
  result: TestResult
  isPB: boolean
  serverId?: string | null
  serverMeta?: { xpGained: number; level: number; levelUp: boolean; newAchievements: string[]; ranks?: { daily: number | null; weekly: number | null } } | null
}>()
const emit = defineEmits<{ next: []; repeat: []; restart: [] }>()

const { user } = useAuth()

const configLabel = computed(() => {
  const { config } = props.result
  if (config.mode === 'time') return `${config.amount}s`
  if (config.mode === 'words') return `${config.amount} words`
  if (config.mode === 'quote') return 'quote'
  return config.codeLanguage
})

const langLabel = computed(() => props.result.config.language.toUpperCase())

const published = ref(false)
const showShareModal = ref(false)
const confetti = ref<{ left: number; delay: number; duration: number; rotate: number; tone: string }[]>([])
const nextBtn = ref<HTMLButtonElement | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('next')
  }
}

onMounted(() => {
  nextBtn.value?.focus()
  window.addEventListener('keydown', onKeydown)
  if (!props.isPB) return
  const tones = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-error']
  confetti.value = Array.from({ length: 60 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.8 + Math.random() * 1.4,
    rotate: Math.random() * 360,
    tone: tones[Math.floor(Math.random() * tones.length)]!,
  }))
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

async function publish() {
  if (!props.serverId) return
  await $fetch(`/api/me/share/${props.serverId}`, { method: 'POST', body: { isPublic: true } })
  published.value = true
  const url = `${window.location.origin}/share/${props.serverId}`
  await navigator.clipboard?.writeText(url).catch(() => {})
}

async function share() {
  if (props.serverId && !published.value) {
    try {
      await $fetch(`/api/me/share/${props.serverId}`, { method: 'POST', body: { isPublic: true } })
      published.value = true
    } catch {}
  }
  showShareModal.value = true
}
</script>

<template>
  <div class="mx-auto w-full max-w-3xl">
    <div v-if="isPB" class="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <span
        v-for="(piece, index) in confetti"
        :key="index"
        class="confetti-piece"
        :class="piece.tone"
        :style="{
          left: `${piece.left}%`,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          transform: `rotate(${piece.rotate}deg)`,
        }"
      />
    </div>

    <Motion
      as="div"
      :initial="{ opacity: 0, y: 14, scale: 0.98 }"
      :animate="{ opacity: 1, y: 0, scale: 1 }"
      :transition="{ duration: 0.25, ease: 'easeOut' }"
    >
      <div v-if="serverMeta?.levelUp" class="alert alert-success mb-4 text-sm font-semibold shadow-lg">
        🎉 Level Up! You reached Level {{ serverMeta.level }}
      </div>

      <div class="mb-5 flex items-end justify-between gap-4">
        <!-- WPM with Hover Details -->
        <div class="group relative cursor-help">
          <div class="flex items-center gap-3">
            <span class="text-7xl font-bold font-mono tracking-tight text-primary transition-transform duration-150 group-hover:scale-105">{{ Math.round(result.wpm) }}</span>
            <div class="flex flex-col pb-1">
              <span class="text-xs uppercase font-mono tracking-widest text-base-content/40">wpm</span>
              <span v-if="isPB" class="badge badge-primary badge-xs mt-1 font-mono tracking-wide">new PB</span>
            </div>
          </div>
          <p class="mt-1 text-xs text-base-content/50 font-mono">{{ langLabel }} · {{ result.config.contentType }} · {{ configLabel }}</p>

          <!-- Floating Detail Popover -->
          <div class="pointer-events-none absolute -bottom-20 left-0 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 p-3 text-xs font-mono text-base-content/80 opacity-0 shadow-2xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40 space-y-1">
            <p class="font-bold text-primary">Net Speed: {{ result.wpm.toFixed(2) }} WPM</p>
            <p class="text-[11px] text-base-content/60">Raw: {{ result.rawWpm.toFixed(2) }} · Penalty: -{{ Math.max(0, result.rawWpm - result.wpm).toFixed(2) }} WPM</p>
            <p class="text-[10px] text-base-content/40">Formula: ({{ result.charsCorrect }} correct chars ÷ 5) ÷ {{ (result.durationMs / 60000).toFixed(2) }} min</p>
          </div>
        </div>

        <!-- Accuracy with Hover Details -->
        <div class="group relative cursor-help text-right">
          <p class="text-4xl font-semibold font-mono tabular-nums text-base-content transition-transform duration-150 group-hover:scale-105">{{ Math.round(result.accuracy) }}%</p>
          <p class="text-xs uppercase font-mono tracking-widest text-base-content/40">accuracy</p>

          <!-- Floating Detail Popover -->
          <div class="pointer-events-none absolute -bottom-20 right-0 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 p-3 text-xs font-mono text-base-content/80 opacity-0 shadow-2xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40 space-y-1 text-left">
            <p class="font-bold text-base-content">Exact Accuracy: {{ result.accuracy.toFixed(2) }}%</p>
            <p class="text-[11px] text-base-content/60">Correct: {{ result.charsCorrect }} · Mistakes: {{ result.charsIncorrect }}</p>
            <p class="text-[10px] text-base-content/40">Total keypresses: {{ result.charsCorrect + result.charsIncorrect + result.charsExtra }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-box border border-base-300/80 bg-base-200/50 p-4">
        <ResultChart
          :series="result.series"
          :duration-ms="result.durationMs"
          :consistency="result.consistency"
          :accuracy="result.accuracy"
        />
      </div>

      <dl class="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono">
        <!-- Raw WPM Card -->
        <div class="group relative cursor-help rounded-box border border-base-300/70 bg-base-200/40 p-3.5 transition-colors hover:border-primary/40 hover:bg-base-200/70">
          <dt class="text-[11px] uppercase tracking-wider text-base-content/40">raw</dt>
          <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ Math.round(result.rawWpm) }}</dd>

          <div class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 px-3 py-1.5 text-[11px] font-mono text-base-content/80 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40 text-center">
            <p class="font-bold text-primary">Raw: {{ result.rawWpm.toFixed(1) }} wpm</p>
            <p class="text-[10px] text-base-content/50">Speed before penalty for errors</p>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="group relative cursor-help rounded-box border border-base-300/70 bg-base-200/40 p-3.5 transition-colors hover:border-primary/40 hover:bg-base-200/70">
          <dt class="text-[11px] uppercase tracking-wider text-base-content/40">consistency</dt>
          <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ Math.round(result.consistency) }}%</dd>

          <div class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 px-3 py-1.5 text-[11px] font-mono text-base-content/80 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40 text-center">
            <p class="font-bold text-primary">{{ result.consistency.toFixed(1) }}% stability</p>
            <p class="text-[10px] text-base-content/50">100 × (1 - σ/μ) per-second speed variance</p>
          </div>
        </div>

        <!-- Time Card -->
        <div class="group relative cursor-help rounded-box border border-base-300/70 bg-base-200/40 p-3.5 transition-colors hover:border-primary/40 hover:bg-base-200/70">
          <dt class="text-[11px] uppercase tracking-wider text-base-content/40">time</dt>
          <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ (result.durationMs / 1000).toFixed(1) }}s</dd>

          <div class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 px-3 py-1.5 text-[11px] font-mono text-base-content/80 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40 text-center">
            <p class="font-bold text-primary">{{ (result.durationMs / 1000).toFixed(2) }} seconds</p>
            <p class="text-[10px] text-base-content/50">Exact: {{ result.durationMs }}ms</p>
          </div>
        </div>

        <!-- Words Card -->
        <div class="group relative cursor-help rounded-box border border-base-300/70 bg-base-200/40 p-3.5 transition-colors hover:border-primary/40 hover:bg-base-200/70">
          <dt class="text-[11px] uppercase tracking-wider text-base-content/40">words</dt>
          <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ result.wordsTyped }}</dd>

          <div class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 px-3 py-1.5 text-[11px] font-mono text-base-content/80 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40 text-center">
            <p class="font-bold text-primary">{{ result.wordsTyped }} completed words</p>
            <p class="text-[10px] text-base-content/50">~{{ (result.charsCorrect / Math.max(1, result.wordsTyped)).toFixed(1) }} chars per word</p>
          </div>
        </div>
      </dl>

      <div v-if="serverMeta" class="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span class="badge badge-primary font-medium">+{{ serverMeta.xpGained }} XP</span>
        <span class="badge badge-ghost">Level {{ serverMeta.level }}</span>
        <span v-if="serverMeta.levelUp" class="badge badge-success">Level up</span>
        <span v-for="achievement in serverMeta.newAchievements" :key="achievement" class="badge badge-secondary">{{ achievement }}</span>
        <span v-if="serverMeta.ranks?.daily" class="badge badge-ghost">daily #{{ serverMeta.ranks.daily }}</span>
        <span v-if="serverMeta.ranks?.weekly" class="badge badge-ghost">weekly #{{ serverMeta.ranks.weekly }}</span>
      </div>

      <div class="mt-3 flex flex-wrap gap-2 text-xs font-mono">
        <span class="badge badge-sm border border-base-300 bg-base-200 text-base-content/70 cursor-help" :title="`Correct characters: ${result.charsCorrect}`">correct {{ result.charsCorrect }}</span>
        <span class="badge badge-sm border border-error/30 bg-error/10 text-error cursor-help" :title="`Mistyped characters: ${result.charsIncorrect}`">incorrect {{ result.charsIncorrect }}</span>
        <span class="badge badge-sm border border-error/20 bg-error/5 text-error/70 cursor-help" :title="`Extra characters typed past word length: ${result.charsExtra}`">extra {{ result.charsExtra }}</span>
        <span class="badge badge-sm border border-base-300/60 bg-base-200/50 text-base-content/40 cursor-help" :title="`Remaining characters skipped: ${result.charsMissed}`">missed {{ result.charsMissed }}</span>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-2">
        <button ref="nextBtn" type="button" class="btn btn-primary btn-sm px-4 font-semibold text-primary-content shadow-xs" @click="emit('next')">Next test</button>
        <button type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" @click="emit('repeat')">Repeat text</button>
        <button type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" @click="emit('restart')">Restart</button>
        <button type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content gap-1.5" @click="share">
          <Share2 class="size-3.5" />
          <span>Share Score</span>
        </button>
        <button v-if="serverId" type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" :disabled="published" @click="publish">{{ published ? 'Published' : 'Publish result' }}</button>
        <NuxtLink v-if="serverId" :to="`/replay/${serverId}`" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content">Replay</NuxtLink>
        <NuxtLink
          v-if="!user"
          to="/login?redirect=/?savePending=1"
          class="btn btn-ghost btn-sm text-primary hover:bg-primary/10 ml-auto font-mono text-xs gap-1"
          title="Sign in or register to record this score and XP to your account"
        >
          <span>Sign in to save</span>
          <span>→</span>
        </NuxtLink>
        <span
          v-else-if="serverId"
          class="inline-flex items-center gap-1.5 text-xs font-mono text-success/80 ml-auto px-2 py-1"
        >
          <Check class="size-3.5" />
          <span>Saved to profile</span>
        </span>
      </div>
    </Motion>

    <!-- Custom Visual Stats Share Modal -->
    <ShareModal
      v-model="showShareModal"
      :result="result"
      :is-p-b="isPB"
      :server-id="serverId"
      :server-meta="serverMeta"
    />
  </div>
</template>

<style scoped>
.confetti-piece {
  position: absolute;
  top: -5vh;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  animation-name: confetti-fall;
  animation-timing-function: linear;
  animation-fill-mode: both;
}

@keyframes confetti-fall {
  to {
    transform: translateY(115vh) rotate(720deg);
    opacity: 0.7;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti-piece { display: none; }
}
</style>
