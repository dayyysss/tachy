import { generateTestText } from '#shared/utils/generator'
import { TypingSession } from '#shared/utils/engine'
import type { TestResult, Metrics } from '#shared/types/test'

export function useTypingEngine(initialSeed?: string) {
  const store = useTestStore()
  const settings = useSettingsStore()
  const sound = useSound()

  const session = shallowRef<TypingSession | null>(null)
  const targetWords = shallowRef<string[]>([])
  const seed = ref('')
  const source = ref('')
  const version = ref(0)
  const now = ref(0)
  const startedAt = ref(0)
  const clockStarted = ref(false)
  const ticker = ref<ReturnType<typeof setInterval> | null>(null)
  const seqPositions = useLocalStorage<Record<string, number>>('tachy-seq', {})

  const status = computed(() => store.status)
  const elapsedMs = computed(() => (clockStarted.value ? Math.max(0, now.value) : 0))
  const remainingMs = computed(() => {
    if (store.config.mode !== 'time') return 0
    return Math.max(0, store.config.amount * 1000 - elapsedMs.value)
  })
  const typedWords = computed(() => {
    version.value
    return session.value?.typedWords ?? ['']
  })
  const cursorWord = computed(() => {
    version.value
    return session.value?.cursorWord ?? 0
  })
  const metrics = computed<Metrics>(() => {
    version.value
    if (!session.value || !session.value.started) {
      return {
        wpm: 0, rawWpm: 0, accuracy: 100, consistency: 0,
        charsCorrect: 0, charsIncorrect: 0, charsExtra: 0, charsMissed: 0,
        wordsTyped: 0, durationMs: 0, series: [],
      }
    }
    return session.value.snapshot(now.value)
  })

  function randomSeed(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  function prepare(seedOverride?: string) {
    stopTicker()
    const key = `${store.config.language}:${store.config.contentType}:${store.config.mode}:${store.config.amount}`
    const position = store.config.order === 'sequential' ? (seqPositions.value[key] ?? 0) : 0
    seed.value = seedOverride ?? randomSeed()
    const generated = generateTestText(store.config, seed.value, position)
    targetWords.value = generated.words
    source.value = generated.source
    seqPositions.value[key] = generated.nextPosition
    session.value = new TypingSession(targetWords.value)
    version.value++
    now.value = 0
    startedAt.value = 0
    clockStarted.value = false
    store.reset()
  }

  function syncClock() {
    if (!clockStarted.value) return
    now.value = performance.now() - startedAt.value
  }

  function startTicker() {
    if (ticker.value) return
    ticker.value = setInterval(() => {
      syncClock()
      if (store.config.mode === 'time' && startedAt.value > 0 && now.value >= store.config.amount * 1000) {
        finish()
      }
    }, 100)
  }

  function stopTicker() {
    if (ticker.value) {
      clearInterval(ticker.value)
      ticker.value = null
    }
  }

  function extendZen() {
    if (store.config.mode !== 'zen' || !session.value) return
    if (targetWords.value.length - session.value.cursorWord > 60) return
    const generated = generateTestText({ ...store.config, amount: 100 }, `${seed.value}:${targetWords.value.length}`)
    targetWords.value.push(...generated.words)
  }

  function press(key: string) {
    if (!session.value || store.status === 'finished') return

    const stopOnError = settings.behavior.stopOnError
    if (stopOnError !== 'off') {
      const typed = session.value.typedWords[session.value.cursorWord] ?? ''
      const target = session.value.targetWords[session.value.cursorWord] ?? ''
      if ((key === ' ' || key === '\n') && stopOnError === 'word' && typed !== target) return
      if (key.length === 1 && key !== ' ' && key !== '\n' && key !== target[typed.length]) return
    }


    if (key === 'Backspace' && settings.behavior.backspaceRule === 'stop_at_word_start') {
      const current = session.value.typedWords[session.value.cursorWord] ?? ''
      if (current.length === 0) return
    }

    if (!clockStarted.value) {
      clockStarted.value = true
      startedAt.value = performance.now()
      store.status = 'running'
      startTicker()
    }

    now.value = performance.now() - startedAt.value
    const before = session.value.keystrokes.length
    session.value.press(key, now.value)
    const last = session.value.keystrokes[session.value.keystrokes.length - 1]
    if (last && session.value.keystrokes.length > before) sound.play(last.correct, settings.sound)
    extendZen()
    version.value++

    if (session.value.finished) finish()
  }

  function finish() {
    if (!session.value || store.status === 'finished') return
    stopTicker()
    syncClock()
    const end = now.value
    session.value.finish(end)
    version.value++
    const snapshot = session.value.snapshot(end)
    const finishedAt = Date.now()
    const result: TestResult = {
      ...snapshot,
      id: randomSeed(),
      config: { ...store.config },
      seed: seed.value,
      startedAt: finishedAt - snapshot.durationMs,
      finishedAt,
      keystrokes: [...session.value.keystrokes],
      targetWords: [...targetWords.value],
      typedWords: [...session.value.typedWords],
    }
    store.finish(result)
    void saveResult(result)
  }

  async function saveResult(result: TestResult) {
    try {
      const auth = await $fetch<{ user?: { id: string } } | null>('/api/auth/get-session')
      if (!auth?.user) return
      const start = await $fetch<{ testId: string; seed: string; token: string }>('/api/tests/start', {
        method: 'POST',
        body: { config: result.config, seed: result.seed },
      })
      const saved = await $fetch<{ testId: string; xpGained: number; level: number; levelUp: boolean; newAchievements: string[]; ranks?: { daily: number | null; weekly: number | null } }>('/api/tests/submit', {
        method: 'POST',
        body: {
          testId: start.testId,
          token: start.token,
          seed: start.seed,
          config: result.config,
          keystrokes: result.keystrokes,
          claimed: {
            wpm: result.wpm,
            rawWpm: result.rawWpm,
            accuracy: result.accuracy,
            consistency: result.consistency,
            durationMs: result.durationMs,
          },
          isDailyChallenge: false,
        },
      })
      store.serverId = saved.testId
      store.serverMeta = {
        xpGained: saved.xpGained,
        level: saved.level,
        levelUp: saved.levelUp,
        newAchievements: saved.newAchievements,
        ranks: saved.ranks,
      }
    } catch {
      // guest mode and unconfigured deployments still keep local history
    }
  }

  function restart(sameSeed = false) {
    prepare(sameSeed ? seed.value : undefined)
  }

  function next() {
    prepare()
  }

  onScopeDispose(stopTicker)

  prepare(initialSeed)

  return {
    targetWords,
    typedWords,
    cursorWord,
    metrics,
    elapsedMs,
    remainingMs,
    seed,
    source,
    status,
    settings,
    press,
    finish,
    restart,
    next,
  }
}



