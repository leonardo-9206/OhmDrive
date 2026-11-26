import { createClient } from '@supabase/supabase-js'

const supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : process?.env?.VITE_SUPABASE_URL
const supabaseAnonKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : process?.env?.VITE_SUPABASE_ANON_KEY

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
 * Fetch top users for the global or league leaderboard.
 * Returns local fallback if Supabase is offline or not configured.
 */
export async function getLeaderboard(limit = 10) {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, full_name, total_watts_xp, streak_days, league_tier')
      .order('total_watts_xp', { ascending: false })
      .limit(limit)

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
 * Log a practice mode session.
 */
export async function recordPracticeSession({
  userId,
  sectorId = null,
  practiceMode,
  questionsSolved,
  correctAnswers,
  wattsEarned
}) {
  if (!isSupabaseConfigured || !supabase) {
    return null
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
      return null
    }

    return data
  } catch (err) {
    console.warn('Network error recording practice session:', err)
    return null
  }
}
