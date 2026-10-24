import { defaultConfig, type TestConfig } from '#shared/config/modes'
import { defaultSettings, type Settings } from '#shared/schemas/settings'
import type { HistoryEntry, TestResult } from '#shared/types/test'

export const useSettingsStore = defineStore('settings', () => {
  const settings = useLocalStorage<Settings>('tachy-settings', defaultSettings, { mergeDefaults: true })

  type SettingsPatch = { [K in keyof Settings]?: Settings[K] extends object ? Partial<Settings[K]> : Settings[K] }

  function update(patch: SettingsPatch) {
    settings.value = { ...settings.value, ...patch } as Settings
  }

  function reset() {
    settings.value = structuredClone(defaultSettings)
  }

  return { settings, update, reset }
})

export const useTestStore = defineStore('test', () => {
  const config = useLocalStorage<TestConfig>('tachy-config', defaultConfig, { mergeDefaults: true })
  const status = ref<'idle' | 'running' | 'finished'>('idle')
  const result = ref<TestResult | null>(null)
  const isPB = ref(false)
  const serverId = ref<string | null>(null)
  const serverMeta = ref<{ xpGained: number; level: number; levelUp: boolean; newAchievements: string[]; ranks?: { daily: number | null; weekly: number | null } } | null>(null)
  const history = useLocalStorage<HistoryEntry[]>('tachy-history', [])

  function setConfig(patch: Partial<TestConfig>) {
    config.value = { ...config.value, ...patch } as TestConfig
  }

  function addHistory(entry: HistoryEntry) {
    history.value = [entry, ...history.value].slice(0, 50)
  }

  function clearHistory() {
    history.value = []
  }

  function finish(testResult: TestResult) {
    result.value = testResult
    status.value = 'finished'
    const entry: HistoryEntry = {
      id: testResult.id,
      createdAt: testResult.finishedAt,
      wpm: testResult.wpm,
      rawWpm: testResult.rawWpm,
      accuracy: testResult.accuracy,
      consistency: testResult.consistency,
      language: testResult.config.language,
      contentType: testResult.config.contentType,
      mode: testResult.config.mode,
      amount: testResult.config.amount,
      durationMs: testResult.durationMs,
      wordsTyped: testResult.wordsTyped,
    }
    const sameConfig = history.value.filter(item =>
      item.language === entry.language &&
      item.contentType === entry.contentType &&
      item.mode === entry.mode &&
      item.amount === entry.amount,
    )
    isPB.value = sameConfig.length === 0 || sameConfig.every(item => item.wpm < entry.wpm)
    addHistory(entry)
  }

  function reset() {
    result.value = null
    isPB.value = false
    serverId.value = null
    serverMeta.value = null
    status.value = 'idle'
  }

  return { config, status, result, isPB, serverId, serverMeta, history, setConfig, addHistory, clearHistory, finish, reset }
})

