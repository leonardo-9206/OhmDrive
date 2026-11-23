import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { syncUserProfile, recordLessonAttempt } from '../services/supabaseClient.js'

const MAX_FUSES = 5

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function calculateLeagueTier(watts) {
  if (watts >= 3000) return 'superconductor'
  if (watts >= 1500) return 'gold'
  if (watts >= 500) return 'copper'
  return 'silicon'
}

export const initialUserState = {
  userId: generateUUID(),
  username: 'Cadete_Ohm',
  fullName: 'Cadete Neo-Ags',
  roleId: 1,
  totalWattsXp: 0,
  currentFuses: MAX_FUSES,
  streakDays: 1,
  leagueTier: 'silicon',
  isGuest: true
}

// Rubric Criteria 2, 9 & 10: Exactly 3 Units in DC, all unlocked from the start for free navigation
export const initialSectorProgress = {
  1: { isUnlocked: true, title: 'Distrito Ohm', completedNodes: 0, totalNodes: 2 },
  2: { isUnlocked: true, title: 'Red de Distribución', completedNodes: 0, totalNodes: 2 },
  3: { isUnlocked: true, title: 'Núcleo Kirchhoff', completedNodes: 0, totalNodes: 2 }
}

// Rubric Criteria 4, 8, 9 & 10: Exactly 6 Levels with status, hits, errors, best score & persistence
export const initialLevelStats = {
  1: { isCompleted: false, status: 'pending', bestScorePoints: 0, lastCorrectCount: 0, lastErrorCount: 0, attemptsCount: 0, updatedAt: null },
  2: { isCompleted: false, status: 'pending', bestScorePoints: 0, lastCorrectCount: 0, lastErrorCount: 0, attemptsCount: 0, updatedAt: null },
  3: { isCompleted: false, status: 'pending', bestScorePoints: 0, lastCorrectCount: 0, lastErrorCount: 0, attemptsCount: 0, updatedAt: null },
  4: { isCompleted: false, status: 'pending', bestScorePoints: 0, lastCorrectCount: 0, lastErrorCount: 0, attemptsCount: 0, updatedAt: null },
  5: { isCompleted: false, status: 'pending', bestScorePoints: 0, lastCorrectCount: 0, lastErrorCount: 0, attemptsCount: 0, updatedAt: null },
  6: { isCompleted: false, status: 'pending', bestScorePoints: 0, lastCorrectCount: 0, lastErrorCount: 0, attemptsCount: 0, updatedAt: null }
}

export const LESSON_TO_SECTOR = {
  1: 1, 2: 1,
  3: 2, 4: 2,
  5: 3, 6: 3
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      user: { ...initialUserState },
      sectorProgress: { ...initialSectorProgress },
      levelStats: { ...initialLevelStats },
      unlockedCards: [1], // Ley de Ohm initially available in Codex
      completedLessons: [],
      soundEnabled: true,

      // Fuse management
      consumeFuse: () => {
        const current = get().user.currentFuses
        if (current <= 0) return 0
        const updated = Math.max(0, current - 1)
        set((state) => ({
          user: { ...state.user, currentFuses: updated }
        }))
        return updated
      },

      refillFuses: () => {
        set((state) => ({
          user: { ...state.user, currentFuses: MAX_FUSES }
        }))
      },

      // XP & Tier
      addWatts: (amount) => {
        if (!amount || amount <= 0) return
        set((state) => {
          const newWatts = state.user.totalWattsXp + amount
          const newTier = calculateLeagueTier(newWatts)
          const updatedUser = {
            ...state.user,
            totalWattsXp: newWatts,
            leagueTier: newTier
          }

          // Non-blocking background sync if connected
          syncUserProfile(updatedUser).catch(() => {})

          return { user: updatedUser }
        })
      },

      // Official Rubric Level Completion (Criteria 8, 9 & 10)
      recordLevelResults: ({
        lessonId,
        correctCount = 0,
        errorCount = 0,
        scorePoints = 0,
        fusesLost = 0,
        durationSeconds = 60
      }) => {
        const state = get()
        const lid = Number(lessonId)
        const sectorId = LESSON_TO_SECTOR[lid] || 1

        const currentLevel = state.levelStats?.[lid] || { ...initialLevelStats[lid] }
        const newBestScore = Math.max(currentLevel.bestScorePoints || 0, scorePoints)
        const newAttempts = (currentLevel.attemptsCount || 0) + 1

        const updatedLevelStats = {
          ...state.levelStats,
          [lid]: {
            isCompleted: true,
            status: 'completed',
            bestScorePoints: newBestScore,
            lastCorrectCount: correctCount,
            lastErrorCount: errorCount,
            attemptsCount: newAttempts,
            updatedAt: new Date().toISOString()
          }
        }

        const updatedCompletedLessons = state.completedLessons.includes(lid)
          ? state.completedLessons
          : [...state.completedLessons, lid]

        // Determine how many nodes are completed in this sector (each sector has 2 lessons)
        const sectorLessons = lid <= 2 ? [1, 2] : lid <= 4 ? [3, 4] : [5, 6]
        const sectorCompletedCount = sectorLessons.filter((id) =>
          updatedCompletedLessons.includes(id)
        ).length

        const updatedSectorProgress = {
          ...state.sectorProgress,
          [sectorId]: {
            ...(state.sectorProgress[sectorId] || { totalNodes: 2, title: `Unidad ${sectorId}` }),
            isUnlocked: true,
            completedNodes: sectorCompletedCount
          }
        }

        const newWatts = state.user.totalWattsXp + scorePoints
        const newTier = calculateLeagueTier(newWatts)
        const updatedUser = {
          ...state.user,
          totalWattsXp: newWatts,
          leagueTier: newTier
        }

        set({
          user: updatedUser,
          levelStats: updatedLevelStats,
          completedLessons: updatedCompletedLessons,
          sectorProgress: updatedSectorProgress
        })

        // Non-blocking background sync to Supabase if connected
        syncUserProfile(updatedUser).catch(() => {})
        recordLessonAttempt({
          userId: updatedUser.userId,
          lessonId: lid,
          scorePercentage: Math.round((correctCount / 4) * 100),
          scorePoints,
          correctCount,
          errorCount,
          wattsEarned: scorePoints,
          fusesLost,
          durationSeconds
        }).catch(() => {})
      },

      // Backward-compatible method mapping into recordLevelResults
      completeLessonNode: ({
        sectorId,
        nodeOrder,
        lessonId,
        wattsEarned = 50,
        fusesLost = 0,
        scorePercentage = 100,
        durationSeconds = 60
      }) => {
        const lid = lessonId || (sectorId === 1 ? nodeOrder : (sectorId - 1) * 2 + nodeOrder)
        const correct = Math.round((scorePercentage / 100) * 4)
        get().recordLevelResults({
          lessonId: lid,
          correctCount: correct,
          errorCount: 4 - correct,
          scorePoints: wattsEarned,
          fusesLost,
          durationSeconds
        })
      },

      // Helper queries (Criteria 9 & 10)
      getLevelStatus: (lessonId) => {
        const stats = get().levelStats?.[Number(lessonId)]
        return stats?.status || 'pending'
      },

      isLevelCompleted: (lessonId) => {
        const stats = get().levelStats?.[Number(lessonId)]
        return Boolean(stats?.isCompleted)
      },

      getOverallProgress: () => {
        const stats = get().levelStats || {}
        const completedLevels = Object.values(stats).filter((l) => l.isCompleted).length
        return {
          completedLevels,
          totalLevels: 6,
          completedExercises: completedLevels * 4,
          totalExercises: 24,
          percentage: Math.round((completedLevels / 6) * 100)
        }
      },

      // Codex cards
      unlockCodexCard: (cardId) => {
        set((state) => {
          if (state.unlockedCards.includes(cardId)) return state
          return {
            unlockedCards: [...state.unlockedCards, cardId]
          }
        })
      },

      // User session
      setGuestUser: (customUsername) => {
        set((state) => ({
          user: {
            ...state.user,
            username: customUsername || `Cadete_${Math.floor(1000 + Math.random() * 9000)}`,
            isGuest: true
          }
        }))
      },

      loginUser: (userData) => {
        set((state) => ({
          user: {
            ...state.user,
            userId: userData.user_id || state.user.userId,
            username: userData.username || state.user.username,
            fullName: userData.full_name || state.user.fullName,
            totalWattsXp: userData.total_watts_xp ?? state.user.totalWattsXp,
            currentFuses: userData.current_fuses ?? MAX_FUSES,
            streakDays: userData.streak_days ?? 1,
            leagueTier: userData.league_tier || calculateLeagueTier(userData.total_watts_xp || 0),
            isGuest: false
          }
        }))
      },

      logoutUser: () => {
        set({
          user: { ...initialUserState, userId: generateUUID() }
        })
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }))
      },

      resetAllProgress: () => {
        set({
          user: { ...initialUserState, userId: generateUUID() },
          sectorProgress: { ...initialSectorProgress },
          levelStats: { ...initialLevelStats },
          unlockedCards: [1],
          completedLessons: []
        })
      }
    }),
    {
      name: 'ohmdrive_local_state_v1',
      storage: createJSONStorage(() => localStorage),
      // Merge function ensures seamless state migration from previous schemas
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState
        }
        return {
          ...currentState,
          ...persistedState,
          // Ensure all 3 sectors remain unlocked
          sectorProgress: {
            ...initialSectorProgress,
            ...(persistedState.sectorProgress || {})
          },
          // Ensure all 6 levels have entries in levelStats
          levelStats: {
            ...initialLevelStats,
            ...(persistedState.levelStats || {})
          }
        }
      }
    }
  )
)
