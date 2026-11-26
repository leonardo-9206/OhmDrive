import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : process?.env?.VITE_SUPABASE_URL
const supabaseAnonKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : process?.env?.VITE_SUPABASE_ANON_KEY

const LOCAL_PRACTICE_SESSIONS_KEY = 'ohmdrive_local_practice_sessions_v1'
const MAX_LOCAL_SESSIONS = 30

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co'
)

// Graceful fallback to prevent runtime crashes if env vars are missing
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null

/**
 * Safely reads locally persisted practice sessions for offline-first mode.
 */
export function getLocalPracticeSessions() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_PRACTICE_SESSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalPracticeSession(session) {
  if (typeof localStorage === 'undefined') return
  try {
    const existing = getLocalPracticeSessions()
    const next = [session, ...existing].slice(0, MAX_LOCAL_SESSIONS)
    localStorage.setItem(LOCAL_PRACTICE_SESSIONS_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage quota errors in offline fallback
  }
}

/**
 * Fetch top users for the global or league-filtered leaderboard.
 * Supports either a numeric limit or an options object `{ limit, leagueTier }`.
 * Returns an empty array if Supabase is offline or not configured.
 */
export async function getLeaderboard(limitOrOptions = 20) {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const options =
    typeof limitOrOptions === 'number'
      ? { limit: limitOrOptions, leagueTier: null }
      : { limit: 20, leagueTier: null, ...limitOrOptions }

  try {
    let query = supabase
      .from('users')
      .select('user_id, username, full_name, total_watts_xp, streak_days, league_tier')
      .order('total_watts_xp', { ascending: false })
      .limit(options.limit)

    if (options.leagueTier && options.leagueTier !== 'all') {
      query = query.eq('league_tier', options.leagueTier)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Supabase leaderboard fetch warning:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn('Supabase offline or network error:', err)
    return []
  }
}

/**
 * Fetch top classroom runs in Sobrecarga Contrarreloj (time_attack) from practice_sessions.
 */
export async function getTimeAttackLeaderboard(limit = 15) {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select(
        `
        session_id,
        user_id,
        sector_id,
        practice_mode,
        questions_solved,
        correct_answers,
        watts_earned,
        played_at,
        users (
          username,
          league_tier
        )
      `
      )
      .eq('practice_mode', 'time_attack')
      .order('watts_earned', { ascending: false })
      .order('correct_answers', { ascending: false })
      .order('played_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('Supabase time_attack fetch warning:', error.message)
      return []
    }

    return (data || []).map((row) => ({
      session_id: row.session_id,
      user_id: row.user_id,
      sector_id: row.sector_id,
      username: row.users?.username || 'Grid Engineer',
      league_tier: row.users?.league_tier || 'silicon',
      questions_solved: row.questions_solved,
      correct_answers: row.correct_answers,
      watts_earned: row.watts_earned,
      played_at: row.played_at
    }))
  } catch (err) {
    console.warn('Supabase offline or network error (time_attack):', err)
    return []
  }
}

/**
 * Subscribe to real-time changes on `users` and `practice_sessions` tables.
 * Returns a cleanup function that removes the channel subscription.
 */
export function subscribeToLeaderboard(onUpdate) {
  if (!isSupabaseConfigured || !supabase || typeof onUpdate !== 'function') {
    return () => {}
  }

  try {
    const channel = supabase
      .channel('ohmdrive-leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => onUpdate({ table: 'users', payload })
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'practice_sessions' },
        (payload) => onUpdate({ table: 'practice_sessions', payload })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  } catch (err) {
    console.warn('Realtime subscription unavailable:', err)
    return () => {}
  }
}

/**
 * Upsert user profile to Supabase.
 */
export async function syncUserProfile(user) {
  if (!isSupabaseConfigured || !supabase || !user) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          user_id: user.userId,
          username: user.username,
          full_name: user.fullName || user.username,
          total_watts_xp: user.totalWattsXp,
          current_fuses: user.currentFuses,
          streak_days: user.streakDays,
          league_tier: user.leagueTier || 'silicon'
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.warn('Failed to sync profile to Supabase:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Network error syncing profile:', err)
    return null
  }
}

/**
 * Log a completed lesson attempt (Criteria 8 & 10).
 */
export async function recordLessonAttempt({
  userId,
  lessonId,
  scorePercentage,
  scorePoints,
  correctCount = 0,
  errorCount = 0,
  wattsEarned,
  fusesLost = 0,
  durationSeconds = 60
}) {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('user_lesson_attempts')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        score_percentage: scorePercentage,
        score_points: scorePoints ?? wattsEarned ?? 0,
        correct_count: correctCount,
        error_count: errorCount,
        watts_earned: wattsEarned ?? scorePoints ?? 0,
        fuses_lost: fusesLost,
        duration_seconds: durationSeconds
      })
      .select()
      .single()

    if (error) {
      console.warn('Failed to record lesson attempt in Supabase:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Network error recording attempt:', err)
    return null
  }
}

/**
 * Log a practice mode session (saved locally for offline-first leaderboard + synced to Supabase).
 */
export async function recordPracticeSession({
  userId,
  sectorId = null,
  practiceMode,
  questionsSolved,
  correctAnswers,
  wattsEarned
}) {
  const localEntry = {
    session_id: `local-${Date.now()}`,
    user_id: userId,
    sector_id: sectorId,
    practice_mode: practiceMode,
    questions_solved: questionsSolved,
    correct_answers: correctAnswers,
    watts_earned: wattsEarned,
    played_at: new Date().toISOString()
  }

  saveLocalPracticeSession(localEntry)

  if (!isSupabaseConfigured || !supabase) {
    return localEntry
  }

  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        sector_id: sectorId,
        practice_mode: practiceMode,
        questions_solved: questionsSolved,
        correct_answers: correctAnswers,
        watts_earned: wattsEarned
      })
      .select()
      .single()

    if (error) {
      console.warn('Failed to record practice session in Supabase:', error.message)
      return localEntry
    }

    return data
  } catch (err) {
    console.warn('Network error recording practice session:', err)
    return localEntry
  }
}
