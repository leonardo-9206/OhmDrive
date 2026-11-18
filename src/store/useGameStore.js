import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { syncUserProfile, recordLessonAttempt } from '../services/supabaseClient'

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

function calculateLeagueTier(watts) {
  if (watts >= 3000) return 'superconductor'
  if (watts >= 1500) return 'gold'
  if (watts >= 500) return 'copper'
  return 'silicon'
}

const initialUserState = {
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

const initialSectorProgress = {
  1: { isUnlocked: true, completedNodes: 0, totalNodes: 4 },
  2: { isUnlocked: false, completedNodes: 0, totalNodes: 4 },
  3: { isUnlocked: false, completedNodes: 0, totalNodes: 4 },
  4: { isUnlocked: false, completedNodes: 0, totalNodes: 4 }
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      user: { ...initialUserState },
      sectorProgress: { ...initialSectorProgress },
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

      // Lesson & Sector progression
      completeLessonNode: ({ sectorId, nodeOrder, lessonId, wattsEarned = 50, fusesLost = 0, scorePercentage = 100, durationSeconds = 60 }) => {
        const state = get()
        const prevCompleted = state.sectorProgress[sectorId]?.completedNodes || 0
        const isNewNode = nodeOrder > prevCompleted
        const updatedCompleted = isNewNode ? nodeOrder : prevCompleted

        const updatedSectorProgress = {
          ...state.sectorProgress,
          [sectorId]: {
            ...state.sectorProgress[sectorId],
            completedNodes: updatedCompleted
          }
        }

        // If all 4 nodes in the sector are finished, unlock the next sector
        if (updatedCompleted >= 4 && sectorId < 4) {
          const nextSector = sectorId + 1
          if (updatedSectorProgress[nextSector]) {
            updatedSectorProgress[nextSector] = {
              ...updatedSectorProgress[nextSector],
              isUnlocked: true
            }
          }
        }

        const newWatts = state.user.totalWattsXp + wattsEarned
        const newTier = calculateLeagueTier(newWatts)
        const updatedUser = {
          ...state.user,
          totalWattsXp: newWatts,
          leagueTier: newTier
        }

        const updatedCompletedLessons = state.completedLessons.includes(lessonId)
          ? state.completedLessons
          : [...state.completedLessons, lessonId]

        set({
          user: updatedUser,
          sectorProgress: updatedSectorProgress,
          completedLessons: updatedCompletedLessons
        })

        // Background sync to Supabase if connected
        syncUserProfile(updatedUser).catch(() => {})
        recordLessonAttempt({
          userId: updatedUser.userId,
          lessonId: lessonId || 1,
          scorePercentage,
          wattsEarned,
          fusesLost,
          durationSeconds
        }).catch(() => {})
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
          unlockedCards: [1],
          completedLessons: []
        })
      }
    }),
    {
      name: 'ohmdrive_local_state_v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
