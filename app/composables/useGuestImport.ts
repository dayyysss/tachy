import type { TestResult } from '#shared/types/test'

export const PENDING_TEST_KEY = 'tachy-pending-submission'

export async function syncPendingTestResult(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const raw = window.localStorage.getItem(PENDING_TEST_KEY)
  if (!raw) return false

  const store = useTestStore()
  const toast = useToast()

  try {
    const parsed = JSON.parse(raw) as { result: TestResult; savedAt: number }
    if (!parsed?.result || !parsed.result.keystrokes?.length) {
      window.localStorage.removeItem(PENDING_TEST_KEY)
      return false
    }

    // Ignore stale tests older than 4 hours
    if (Date.now() - parsed.savedAt > 4 * 60 * 60 * 1000) {
      window.localStorage.removeItem(PENDING_TEST_KEY)
      return false
    }

    const { result } = parsed

    // 1. Request test token with matching seed & config
    const start = await $fetch<{ testId: string; seed: string; token: string }>('/api/tests/start', {
      method: 'POST',
      body: { config: result.config, seed: result.seed },
    })

    // 2. Submit test telemetry for full anti-cheat verification, XP awards, and profile storage
    const saved = await $fetch<{
      testId: string
      xpGained: number
      level: number
      levelUp: boolean
      newAchievements: string[]
      ranks?: { daily: number | null; weekly: number | null }
    }>('/api/tests/submit', {
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

    // Update active store
    store.serverId = saved.testId
    store.serverMeta = {
      xpGained: saved.xpGained,
      level: saved.level,
      levelUp: saved.levelUp,
      newAchievements: saved.newAchievements,
      ranks: saved.ranks,
    }

    window.localStorage.removeItem(PENDING_TEST_KEY)
    toast.success(`🎉 Score of ${Math.round(result.wpm)} WPM saved to your account! (+${saved.xpGained} XP)`)
    return true
  } catch (err) {
    console.warn('Could not sync pending guest test:', err)
    return false
  }
}

export async function importGuestHistory(): Promise<number> {
  const store = useTestStore()
  if (!store.history.length) return 0

  try {
    const result = await $fetch<{ imported: number }>('/api/tests/import', {
      method: 'POST',
      body: store.history.map(entry => ({
        id: entry.id,
        wpm: entry.wpm,
        rawWpm: entry.rawWpm,
        accuracy: entry.accuracy,
        consistency: entry.consistency,
        language: entry.language,
        contentType: entry.contentType === 'quotes' ? 'quotes' : entry.contentType === 'code' ? 'code' : entry.contentType === 'numbers' ? 'numbers' : 'words',
        mode: entry.mode,
        amount: entry.amount,
        durationMs: entry.durationMs,
        wordsTyped: entry.wordsTyped,
        createdAt: entry.createdAt,
      })),
    })
    store.clearHistory()
    return result.imported
  } catch {
    return 0
  }
}
