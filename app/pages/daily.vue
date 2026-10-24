<script setup lang="ts">
import { localDate } from '#shared/utils/dates'
import { dailySeed } from '#shared/utils/generator'

useSeo('daily')

const store = useTestStore()
const { settings } = storeToRefs(useSettingsStore())
const seed = dailySeed(localDate(), 'en')
const engine = useTypingEngine(seed)

watch(() => store.config, () => engine.restart(true), { deep: true })

const showConfig = computed(() => store.status !== 'running')
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
    <section class="rounded-box border border-primary/30 bg-primary/5 p-4 text-center">
      <h1 class="text-lg font-semibold text-primary">Daily typing challenge</h1>
      <p class="text-sm text-base-content/60">
        Same text for everyone on {{ localDate() }} (UTC). Resets at 00:00 UTC.
      </p>
    </section>

    <ClientOnly>
    <ConfigBar v-show="showConfig" :config="store.config" @update="patch => store.setConfig(patch)" />

    <template v-if="store.status === 'finished' && store.result">
      <ResultCard
        :result="store.result"
        :is-pb="store.isPB"
        @next="engine.restart(true)"
        @repeat="engine.restart(true)"
        @restart="engine.restart(true)"
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
        @restart="engine.restart(true)"
      />
      <p class="text-center text-xs text-base-content/40">Text is fixed for the challenge. Tab or Esc restarts the same text.</p>
    </template>
    <template #fallback><div class="py-10 text-center text-sm opacity-40">Loading challenge…</div></template>
    </ClientOnly>
  </div>
</template>


