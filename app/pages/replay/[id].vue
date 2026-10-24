<script setup lang="ts">
import { TypingSession } from '#shared/utils/engine'

const route = useRoute()
const { data, error } = await useFetch(`/api/tests/${route.params.id}/replay`)

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
const total = computed(() => data.value?.keystrokes.length ?? 0)

function reset() {
  if (!data.value) return
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
  if (!data.value || !session.value) return
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
  <div class="mx-auto w-full max-w-4xl px-4 py-10">
    <h1 class="text-2xl font-semibold">Replay</h1>
    <p v-if="error" class="alert alert-warning mt-4 text-sm">This replay is private or no longer available.</p>

    <template v-else-if="data">
      <div class="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-60">
        <span class="uppercase">{{ data.config.language }}</span>
        <span>· {{ data.config.mode }}</span>
        <span>· {{ data.keystrokes.length }} keystrokes</span>
        <span>· {{ (data.durationMs / 1000).toFixed(1) }}s</span>
      </div>

      <div class="mt-6">
        <TypingArea
          :words="data.words"
          :typed="typed"
          :cursor="cursor"
          disabled
        />
      </div>

      <div class="mt-6 flex items-center gap-3">
        <button type="button" class="btn btn-primary btn-sm" @click="play">{{ playing ? 'Pause' : 'Play' }}</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="reset">Restart</button>
        <progress class="progress progress-primary w-full" :value="index" :max="total || 1" />
        <span class="text-xs tabular-nums opacity-60">{{ index }}/{{ total }}</span>
      </div>
    </template>
  </div>
</template>
