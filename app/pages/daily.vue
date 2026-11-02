<script setup lang="ts">
import { localDate } from '#shared/utils/dates'
import { dailySeed } from '#shared/utils/generator'
import { Sparkles } from 'lucide-vue-next'

useSeo('daily')

const store = useTestStore()
const { settings } = storeToRefs(useSettingsStore())
const seed = dailySeed(localDate(), 'en')
const engine = useTypingEngine(seed)

watch(() => store.config, () => engine.restart(true), { deep: true })

const showConfig = computed(() => !settings.value.appearance.focusMode || store.status !== 'running')
</script>

<template>
  <div class="mx-auto flex min-h-[75vh] w-full max-w-7xl flex-col justify-center gap-8 px-4 sm:px-8 lg:px-12 py-8">
    <section class="chrome text-center">
      <div class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold text-primary mb-2">
        <Sparkles class="size-3 fill-primary" />
        <span>Daily Challenge · {{ localDate() }}</span>
      </div>
      <h1 class="text-xl font-bold tracking-tight sm:text-2xl">Uniform Daily Challenge</h1>
      <p class="mt-1 text-xs text-base-content/50 font-mono">
        Identical seeded text for all typists globally. Resets at 00:00 UTC.
      </p>
    </section>

    <ClientOnly>
      <ConfigBar v-show="showConfig" :config="store.config" @update="patch => store.setConfig(patch)" />

      <AnimatePresence mode="wait">
        <Motion
          v-if="store.status === 'finished' && store.result"
          key="result-screen"
          as="div"
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
            @next="engine.restart(true)"
            @repeat="engine.restart(true)"
            @restart="engine.restart(true)"
          />
        </Motion>

        <Motion
          v-else
          key="typing-screen"
          as="div"
          class="flex flex-col gap-6"
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
            @restart="engine.restart(true)"
            @toggle-keyboard="settings.appearance.showKeyboard = !settings.appearance.showKeyboard"
          />
          <div class="chrome mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-base-content/40 font-mono">
            <span>Challenge text is fixed for today. Restart with <kbd class="kbd kbd-xs bg-base-200 border-base-300">tab</kbd> or <kbd class="kbd kbd-xs bg-base-200 border-base-300">esc</kbd>.</span>
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
          </div>
        </Motion>
      </AnimatePresence>

      <template #fallback><div class="py-10 text-center text-sm opacity-40 font-mono">Loading challenge…</div></template>
    </ClientOnly>
  </div>
</template>
