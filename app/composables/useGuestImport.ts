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
