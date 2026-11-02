<script setup lang="ts">
import { TypingSession } from '#shared/utils/engine'

const route = useRoute()
const { data, error } = await useFetch<{
  testId: string
  config: { language: string; contentType: string; mode: string; amount: number }
  words: string[]
  keystrokes: { t: number; key: string; correct: boolean }[]
  durationMs: number
}>(`/api/tests/${route.params.id}/replay`)

const session = shallowRef<TypingSession | null>(null)
const index = ref(0)
const playing = ref(false)
const version = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

const typed = computed(() => {
  version.value
  return session.value?.typedWords ?? ['']
})
const cursor = computed(() => {
  version.value
  return session.value?.cursorWord ?? 0
})
const total = computed(() => data.value?.keystrokes?.length ?? 0)

function reset() {
  if (!data.value?.words) return
  stop()
  session.value = new TypingSession(data.value.words)
  index.value = 0
  version.value++
}

function stop() {
  playing.value = false
  if (timer) clearTimeout(timer)
  timer = null
}

function step() {
  if (!data.value?.keystrokes || !session.value) return
  if (index.value >= data.value.keystrokes.length) {
    playing.value = false
    return
  }
  const keystroke = data.value.keystrokes[index.value]!
  const next = data.value.keystrokes[index.value + 1]
  session.value.press(keystroke.key, keystroke.t)
  index.value++
  version.value++
  if (next) {
    timer = setTimeout(step, Math.min(250, Math.max(20, (next.t - keystroke.t) / 4)))
  } else {
    playing.value = false
  }
}

function play() {
  if (playing.value) {
    stop()
    return
  }
  if (index.value >= total.value) reset()
  playing.value = true
  step()
}

onMounted(reset)
onBeforeUnmount(stop)
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12 space-y-6">
    <div v-if="error" class="rounded-2xl border border-warning/30 bg-warning/10 p-8 text-center text-sm text-warning font-mono">
      This test replay is private or no longer available.
      <div class="mt-4">
        <NuxtLink to="/" class="btn btn-primary btn-sm">Take a test</NuxtLink>
      </div>
    </div>

    <template v-else-if="data">
      <!-- Replay Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-200/50 p-5 shadow-xs">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Session Telemetry
            </span>
            <span class="text-xs opacity-40 font-mono">ID: {{ String(route.params.id).slice(0, 8) }}</span>
          </div>
          <h1 class="mt-1 text-2xl font-bold tracking-tight">Test Playback</h1>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span class="badge badge-sm border-base-300 bg-base-100 uppercase">{{ data.config.language }}</span>
          <span class="badge badge-sm border-base-300 bg-base-100">{{ data.config.mode }}</span>
          <span class="badge badge-sm border-base-300 bg-base-100">{{ (data.durationMs / 1000).toFixed(1) }}s</span>
          <span class="badge badge-sm border-primary/30 bg-primary/10 text-primary font-semibold">{{ data.keystrokes.length }} keystrokes</span>
        </div>
      </div>

      <!-- Playback Canvas Area -->
      <div class="rounded-2xl border border-base-300/80 bg-base-200/30 p-6 md:p-10 min-h-48 flex items-center justify-center">
        <TypingArea
          :words="data.words"
          :typed="typed"
          :cursor="cursor"
          disabled
        />
      </div>

      <!-- Playback Controls Bar -->
      <div class="flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-200/60 p-4">
        <button
          type="button"
          class="btn btn-primary btn-sm font-semibold shadow-xs gap-1.5 px-4"
          @click="play"
        >
          <svg v-if="!playing" class="size-4" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <svg v-else class="size-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <span>{{ playing ? 'Pause' : 'Play' }}</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm border border-base-300 text-xs font-mono"
          @click="reset"
        >
          Restart
        </button>

        <div class="flex-1 min-w-36">
          <progress
            class="progress progress-primary w-full h-2 bg-base-300"
            :value="index"
            :max="total || 1"
          />
        </div>

        <span class="font-mono text-xs tabular-nums text-base-content/60 min-w-16 text-right">
          {{ index }} / {{ total }}
        </span>
      </div>
    </template>
  </div>
</template>
