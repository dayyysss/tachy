<script setup lang="ts">
useSeo('home')

const store = useTestStore()
const { settings } = storeToRefs(useSettingsStore())
const engine = useTypingEngine()

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

const showConfig = computed(() => !settings.value.appearance.focusMode || store.status !== 'running')
</script>

<template>
  <div class="mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col justify-center gap-6 px-4 py-8">
    <section class="chrome pt-2 text-center">
      <h1 class="text-xs uppercase tracking-[0.25em] text-base-content/40 font-mono">Tachy typing test</h1>
      <p class="mt-1 text-xs text-base-content/40">Clean, replay-verified typing test. Track WPM and improve accuracy.</p>
    </section>

    <ClientOnly>
      <ConfigBar
        v-show="showConfig"
        :config="store.config"
        @update="updateConfig"
      />

      <template v-if="store.status === 'finished' && store.result">
        <ResultCard
          :result="store.result"
          :is-pb="store.isPB"
          :server-id="store.serverId"
          :server-meta="store.serverMeta"
          @next="engine.next"
          @repeat="repeat"
          @restart="restart"
        />
      </template>

      <template v-else>
        <LiveStats
          :metrics="engine.metrics.value"
          :remaining-ms="engine.remainingMs.value"
          :elapsed-ms="engine.elapsedMs.value"
          :mode="store.config.mode"
          :show-wpm="settings.appearance.showLiveWpm"
          :show-accuracy="settings.appearance.showLiveAccuracy"
          :show-timer="settings.appearance.showTimer"
        />

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
          @press="engine.press"
          @restart="restart"
        />

        <div v-if="store.config.mode === 'zen'" class="text-center">
          <button type="button" class="btn btn-ghost btn-xs text-primary" @click="engine.finish">End test</button>
        </div>

        <p class="chrome mt-6 text-center text-xs text-base-content/40 font-mono">
          <span>{{ $t('home.hint') }}</span>
          <span class="mx-2 opacity-30">·</span>
          <span>restart with <kbd class="kbd kbd-xs bg-base-200 border-base-300">tab</kbd> or <kbd class="kbd kbd-xs bg-base-200 border-base-300">esc</kbd></span>
        </p>
      </template>

      <template #fallback>
        <div class="py-10 text-center text-sm text-base-content/40 font-mono">Loading typing test…</div>
      </template>
    </ClientOnly>
  </div>
</template>
