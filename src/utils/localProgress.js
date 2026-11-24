export const LOCAL_STORAGE_KEY = 'ohmdrive_local_state_v1'

/**
 * Safely reads persisted OhmDrive progress from localStorage.
 * Supports both Zustand `persist` format (`{ state: {...} }`) and plain JSON.
 *
 * @returns {{
 *   levelStats: Record<string, {
 *     isCompleted?: boolean,
 *     status?: 'completed'|'pending',
 *     bestScorePoints?: number,
 *     lastCorrectCount?: number,
 *     lastErrorCount?: number,
 *     attemptsCount?: number,
 *     updatedAt?: string|null
 *   }>,
 *   totalWattsXp: number,
 *   currentFuses: number,
 *   streakDays: number
 * }}
 */
export function readLocalProgress() {
  const fallback = {
    levelStats: {},
    totalWattsXp: 0,
    currentFuses: 5,
    streakDays: 1,
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback
    }
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw)
    const data = parsed?.state && typeof parsed.state === 'object' ? parsed.state : parsed

    return {
      levelStats: data?.levelStats && typeof data.levelStats === 'object' ? data.levelStats : {},
      totalWattsXp: Number.isFinite(Number(data?.totalWattsXp ?? data?.total_watts_xp))
        ? Number(data?.totalWattsXp ?? data?.total_watts_xp)
        : 0,
      currentFuses: Number.isFinite(Number(data?.currentFuses ?? data?.current_fuses))
        ? Number(data?.currentFuses ?? data?.current_fuses)
        : 5,
      streakDays: Number.isFinite(Number(data?.streakDays ?? data?.streak_days))
        ? Number(data?.streakDays ?? data?.streak_days)
        : 1,
    }
  } catch {
    return fallback
  }
}

/**
 * Checks whether a given level (1..6) is completed in `levelStats`.
 *
 * @param {Record<string, any>} levelStats
 * @param {number|string} lessonId
 * @returns {boolean}
 */
export function isLevelCompleted(levelStats, lessonId) {
  const entry = levelStats?.[String(lessonId)]
  if (!entry) return false
  return entry.status === 'completed' || entry.isCompleted === true
}
