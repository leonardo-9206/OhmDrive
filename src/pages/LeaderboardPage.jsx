import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Flame,
  Radio,
  RefreshCw,
  Shield,
  Target,
  Trophy,
  UserCog,
  WifiOff,
  Zap
} from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import {
  getLeaderboard,
  getLocalPracticeSessions,
  getTimeAttackLeaderboard,
  isSupabaseConfigured,
  subscribeToLeaderboard
} from '../services/supabaseClient'

const LEAGUE_ORDER = ['silicon', 'copper', 'gold', 'superconductor']

const LEAGUE_CONFIG = {
  silicon: {
    id: 'silicon',
    name: 'Silicio',
    minWatts: 0,
    nextTier: 'copper',
    nextThreshold: 500,
    color: 'text-slate-300',
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/10',
    bar: 'bg-slate-400'
  },
  copper: {
    id: 'copper',
    name: 'Cobre',
    minWatts: 500,
    nextTier: 'gold',
    nextThreshold: 1500,
    color: 'text-neon-amp',
    border: 'border-neon-amp/40',
    bg: 'bg-neon-amp/10',
    bar: 'bg-neon-amp'
  },
  gold: {
    id: 'gold',
    name: 'Oro',
    minWatts: 1500,
    nextTier: 'superconductor',
    nextThreshold: 3000,
    color: 'text-yellow-400',
    border: 'border-yellow-400/40',
    bg: 'bg-yellow-400/10',
    bar: 'bg-yellow-400'
  },
  superconductor: {
    id: 'superconductor',
    name: 'Superconductor',
    minWatts: 3000,
    nextTier: null,
    nextThreshold: null,
    color: 'text-neon-volt',
    border: 'border-neon-volt/50',
    bg: 'bg-neon-volt/10',
    bar: 'bg-neon-volt'
  }
}

const LOCAL_FALLBACK_USERS = [
  {
    user_id: 'demo-1',
    username: 'VoltMaster_99',
    total_watts_xp: 3450,
    streak_days: 12,
    league_tier: 'superconductor'
  },
  {
    user_id: 'demo-2',
    username: 'Tesla_Ags',
    total_watts_xp: 2350,
    streak_days: 8,
    league_tier: 'gold'
  },
  {
    user_id: 'demo-3',
    username: 'Kirchhoff_Hero',
    total_watts_xp: 1620,
    streak_days: 6,
    league_tier: 'gold'
  },
  {
    user_id: 'demo-4',
    username: 'OhmLawyer',
    total_watts_xp: 890,
    streak_days: 4,
    league_tier: 'copper'
  },
  {
    user_id: 'demo-5',
    username: 'NodoAlpha_CD',
    total_watts_xp: 320,
    streak_days: 2,
    league_tier: 'silicon'
  }
]

const LOCAL_FALLBACK_TIME_ATTACK = [
  {
    session_id: 'demo-ta-1',
    username: 'VoltMaster_99',
    league_tier: 'superconductor',
    questions_solved: 14,
    correct_answers: 13,
    watts_earned: 295,
    played_at: null
  },
  {
    session_id: 'demo-ta-2',
    username: 'Tesla_Ags',
    league_tier: 'gold',
    questions_solved: 12,
    correct_answers: 11,
    watts_earned: 245,
    played_at: null
  },
  {
    session_id: 'demo-ta-3',
    username: 'Kirchhoff_Hero',
    league_tier: 'gold',
    questions_solved: 10,
    correct_answers: 9,
    watts_earned: 195,
    played_at: null
  },
  {
    session_id: 'demo-ta-4',
    username: 'OhmLawyer',
    league_tier: 'copper',
    questions_solved: 8,
    correct_answers: 7,
    watts_earned: 150,
    played_at: null
  }
]

function formatRelativeDate(isoDate) {
  if (!isoDate) return 'Salón UAA'
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return 'Reciente'
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Reciente'
  }
}

export default function LeaderboardPage() {
  const currentUser = useGameStore((state) => state.user)

  const [activeTab, setActiveTab] = useState('leagues') // 'leagues' | 'time_attack'
  const [selectedLeague, setSelectedLeague] = useState('all') // 'all' | 'silicon' | 'copper' | 'gold' | 'superconductor'
  const [usersBoard, setUsersBoard] = useState([])
  const [timeAttackBoard, setTimeAttackBoard] = useState([])
  const [loading, setLoading] = useState(false)
  const [isLiveCloud, setIsLiveCloud] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const buildOfflineUsersBoard = useCallback(() => {
    const merged = [
      ...LOCAL_FALLBACK_USERS.filter((u) => u.username !== currentUser.username),
      {
        user_id: currentUser.userId,
        username: currentUser.username,
        total_watts_xp: currentUser.totalWattsXp,
        streak_days: currentUser.streakDays,
        league_tier: currentUser.leagueTier || 'silicon',
        isCurrent: true
      }
    ].sort((a, b) => b.total_watts_xp - a.total_watts_xp)
    return merged
  }, [currentUser])

  const buildOfflineTimeAttackBoard = useCallback(() => {
    const localSessions = getLocalPracticeSessions()
      .filter((s) => s.practice_mode === 'time_attack' && s.questions_solved > 0)
      .map((s) => ({
        ...s,
        username: currentUser.username,
        league_tier: currentUser.leagueTier || 'silicon',
        isCurrent: true
      }))

    return [...localSessions, ...LOCAL_FALLBACK_TIME_ATTACK]
      .sort((a, b) => {
        if (b.watts_earned !== a.watts_earned) return b.watts_earned - a.watts_earned
        return b.correct_answers - a.correct_answers
      })
      .slice(0, 15)
  }, [currentUser])

  const loadLeaderboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [remoteUsers, remoteTimeAttack] = await Promise.all([
        getLeaderboard({ limit: 30 }),
        getTimeAttackLeaderboard(15)
      ])

      const hasCloudData = isSupabaseConfigured && (remoteUsers.length > 0 || remoteTimeAttack.length > 0)
      setIsLiveCloud(hasCloudData)

      if (remoteUsers.length > 0) {
        const userExists = remoteUsers.some(
          (u) => u.user_id === currentUser.userId || u.username === currentUser.username
        )
        const combinedUsers = userExists
          ? remoteUsers
          : [
              ...remoteUsers,
              {
                user_id: currentUser.userId,
                username: currentUser.username,
                total_watts_xp: currentUser.totalWattsXp,
                streak_days: currentUser.streakDays,
                league_tier: currentUser.leagueTier || 'silicon'
              }
            ].sort((a, b) => b.total_watts_xp - a.total_watts_xp)
        setUsersBoard(combinedUsers)
      } else {
        setUsersBoard(buildOfflineUsersBoard())
      }

      if (remoteTimeAttack.length > 0) {
        setTimeAttackBoard(remoteTimeAttack)
      } else {
        setTimeAttackBoard(buildOfflineTimeAttackBoard())
      }

      setLastSyncedAt(new Date())
    } finally {
      setLoading(false)
    }
  }, [buildOfflineTimeAttackBoard, buildOfflineUsersBoard, currentUser])

  useEffect(() => {
    loadLeaderboardData()
  }, [loadLeaderboardData])

  // Real-time subscription to Supabase `users` and `practice_sessions`
  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(() => {
      loadLeaderboardData()
    })
    return () => {
      unsubscribe()
    }
  }, [loadLeaderboardData])

  const filteredUsers = useMemo(() => {
    if (selectedLeague === 'all') return usersBoard
    return usersBoard.filter((u) => (u.league_tier || 'silicon') === selectedLeague)
  }, [usersBoard, selectedLeague])

  const userRank = useMemo(() => {
    const idx = usersBoard.findIndex(
      (u) => u.user_id === currentUser.userId || u.username === currentUser.username
    )
    return idx >= 0 ? idx + 1 : null
  }, [usersBoard, currentUser])

  const userBestTimeAttack = useMemo(() => {
    const mine = timeAttackBoard.filter(
      (s) => s.user_id === currentUser.userId || s.username === currentUser.username
    )
    return mine.length > 0 ? mine[0] : null
  }, [timeAttackBoard, currentUser])

  const userLeague = LEAGUE_CONFIG[currentUser.leagueTier] || LEAGUE_CONFIG.silicon
  const nextLeague = userLeague.nextTier ? LEAGUE_CONFIG[userLeague.nextTier] : null

  const leagueProgressPct = useMemo(() => {
    if (!userLeague.nextThreshold) return 100
    const span = userLeague.nextThreshold - userLeague.minWatts
    const earnedInTier = Math.max(0, currentUser.totalWattsXp - userLeague.minWatts)
    return Math.min(100, Math.round((earnedInTier / span) * 100))
  }, [currentUser.totalWattsXp, userLeague])

  const wattsToNextLeague = userLeague.nextThreshold
    ? Math.max(0, userLeague.nextThreshold - currentUser.totalWattsXp)
    : 0

  return (
    <section className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-neon-amp">
            <Trophy className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-wider">
              Ranking del Salón · Tiempo Real
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLiveCloud ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-watt/40 bg-neon-watt/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-neon-watt">
                <Radio className="h-3 w-3 animate-pulse" />
                EN VIVO · SUPABASE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-volt/30 bg-neon-volt/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-neon-volt">
                <WifiOff className="h-3 w-3" />
                MODO LOCAL
              </span>
            )}

            <button
              type="button"
              onClick={loadLeaderboardData}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-neon-volt/50 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <h1 className="mt-2 font-display text-xl font-bold text-white md:text-2xl">
          Leaderboard de Ligas &amp; Contrarreloj
        </h1>
        <p className="mt-1 text-xs text-slate-300 md:text-sm">
          Compite acumulando Watts (XP) en los 6 niveles oficiales y registra tu mejor marca en
          Sobrecarga Contrarreloj (120s).
        </p>

        {/* Responsive 2-column summary on desktop */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Current User Status Card */}
          <div
            className={`flex flex-col justify-between rounded-xl border ${userLeague.border} ${userLeague.bg} p-3.5`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Tu Estado Actual {userRank ? `· Puesto #${userRank}` : ''}
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="font-display text-base font-bold text-white">
                    {currentUser.username}
                  </p>
                  <Link
                    to="/login"
                    title="Cambiar alias o iniciar sesión"
                    className="rounded-md border border-pcb-trace bg-pcb-panel/80 p-1 text-slate-400 transition-colors hover:text-neon-volt"
                  >
                    <UserCog className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Shield className={`h-3.5 w-3.5 ${userLeague.color}`} />
                  <span className={`text-xs font-semibold ${userLeague.color}`}>
                    Liga {userLeague.name}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-mono text-base font-bold text-neon-volt">
                  <Zap className="h-4 w-4" />
                  <span>{currentUser.totalWattsXp} W</span>
                </div>
                <div className="mt-0.5 flex items-center justify-end gap-1 font-mono text-xs text-neon-amp">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{currentUser.streakDays}d racha</span>
                </div>
              </div>
            </div>

            {/* League Progress Bar */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-300">
                {nextLeague ? (
                  <>
                    <span>Ascenso a {nextLeague.name}</span>
                    <span>Faltan {wattsToNextLeague} W</span>
                  </>
                ) : (
                  <>
                    <span className="text-neon-volt">Rango Máximo Alcanzado</span>
                    <span>100%</span>
                  </>
                )}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-pcb-base/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${userLeague.bar}`}
                  style={{ width: `${leagueProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* League Tiers Reference Card */}
          <div className="rounded-xl border border-pcb-trace bg-pcb-elevated/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Escala de Ligas OhmDrive
              </span>
              {lastSyncedAt && (
                <span className="font-mono text-[10px] text-slate-500">
                  Sync {lastSyncedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {LEAGUE_ORDER.map((tierId) => {
                const tier = LEAGUE_CONFIG[tierId]
                const isCurrentTier = tierId === currentUser.leagueTier
                return (
                  <button
                    key={tierId}
                    type="button"
                    onClick={() => {
                      setActiveTab('leagues')
                      setSelectedLeague(selectedLeague === tierId ? 'all' : tierId)
                    }}
                    className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all ${
                      isCurrentTier
                        ? `${tier.border} ${tier.bg}`
                        : 'border-pcb-trace/60 bg-pcb-panel/60 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className={`h-3.5 w-3.5 ${tier.color}`} />
                      <span className={`text-xs font-semibold ${tier.color}`}>{tier.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {tier.minWatts}+ W
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-pcb-trace bg-pcb-panel p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('leagues')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-display text-xs font-bold transition-all md:text-sm ${
            activeTab === 'leagues'
              ? 'border border-neon-volt/50 bg-neon-volt/15 text-neon-volt shadow-neon-volt'
              : 'text-slate-400 hover:bg-pcb-elevated hover:text-white'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Ligas Globales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('time_attack')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-display text-xs font-bold transition-all md:text-sm ${
            activeTab === 'time_attack'
              ? 'border border-neon-amp/50 bg-neon-amp/15 text-neon-amp shadow-[0_0_15px_rgba(255,184,0,0.25)]'
              : 'text-slate-400 hover:bg-pcb-elevated hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Top Contrarreloj 120s</span>
        </button>
      </div>

      {/* TAB 1: GLOBAL LEAGUES LEADERBOARD */}
      {activeTab === 'leagues' && (
        <div className="space-y-3 rounded-2xl border border-pcb-trace bg-pcb-panel p-3.5 md:p-4">
          {/* League Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLeague('all')}
              className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                selectedLeague === 'all'
                  ? 'border-neon-volt bg-neon-volt/15 text-neon-volt'
                  : 'border-pcb-trace bg-pcb-elevated text-slate-400 hover:text-white'
              }`}
            >
              Todas ({usersBoard.length})
            </button>
            {[...LEAGUE_ORDER].reverse().map((tierId) => {
              const tier = LEAGUE_CONFIG[tierId]
              const count = usersBoard.filter((u) => (u.league_tier || 'silicon') === tierId).length
              return (
                <button
                  key={tierId}
                  type="button"
                  onClick={() => setSelectedLeague(tierId)}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                    selectedLeague === tierId
                      ? `${tier.border} ${tier.bg} ${tier.color}`
                      : 'border-pcb-trace bg-pcb-elevated text-slate-400 hover:text-white'
                  }`}
                >
                  {tier.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Column Headers */}
          <div className="flex items-center justify-between px-2 font-mono text-[11px] uppercase text-slate-400">
            <span># Grid Engineer</span>
            <span>Watts (XP)</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-pcb-trace bg-pcb-elevated/30 p-6 text-center">
              <Shield className="mx-auto h-7 w-7 text-slate-500" />
              <p className="mt-2 text-sm font-semibold text-slate-300">
                Aún no hay ingenieros en esta liga
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Completa niveles o juega Contrarreloj para escalar de categoría.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredUsers.map((item, index) => {
                const isMe =
                  item.user_id === currentUser.userId || item.username === currentUser.username
                const league = LEAGUE_CONFIG[item.league_tier] || LEAGUE_CONFIG.silicon

                return (
                  <div
                    key={item.user_id || `${item.username}-${index}`}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                      isMe
                        ? 'border border-neon-volt/50 bg-neon-volt/10 shadow-[0_0_12px_rgba(0,240,255,0.12)]'
                        : 'border border-pcb-trace/50 bg-pcb-elevated/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pcb-base/70 font-mono text-xs font-bold text-slate-300">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-sm font-semibold ${
                              isMe ? 'text-neon-volt' : 'text-white'
                            }`}
                          >
                            {item.username}
                          </p>
                          {isMe && (
                            <span className="rounded bg-neon-volt/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-neon-volt">
                              TÚ
                            </span>
                          )}
                        </div>
                        <span className={`font-mono text-[10px] ${league.color}`}>
                          Liga {league.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-neon-volt">
                        {item.total_watts_xp} W
                      </span>
                      {item.streak_days > 0 && (
                        <div className="flex items-center justify-end gap-1 font-mono text-[10px] text-slate-400">
                          <Flame className="h-2.5 w-2.5 text-neon-amp" />
                          <span>{item.streak_days}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIME ATTACK 120s LEADERBOARD */}
      {activeTab === 'time_attack' && (
        <div className="space-y-3 rounded-2xl border border-pcb-trace bg-pcb-panel p-3.5 md:p-4">
          {/* Personal Best / CTA Bar */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-neon-amp/40 bg-neon-amp/10 p-3.5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-neon-amp">
                <Clock className="h-3.5 w-3.5" />
                <span>Sobrecarga Contrarreloj · 120 Segundos</span>
              </div>
              {userBestTimeAttack ? (
                <p className="mt-1 text-xs text-slate-200 md:text-sm">
                  Tu mejor marca:{' '}
                  <strong className="font-mono text-neon-volt">
                    +{userBestTimeAttack.watts_earned} W
                  </strong>{' '}
                  ({userBestTimeAttack.correct_answers}/{userBestTimeAttack.questions_solved}{' '}
                  aciertos).
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-200 md:text-sm">
                  Aún no registras una partida Contrarreloj. ¡Compite por el Top 1 del salón!
                </p>
              )}
            </div>

            <Link
              to="/practice"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border-b-4 border-amber-700 bg-neon-amp px-4 font-display text-xs font-bold text-pcb-base transition-transform active:translate-y-1 active:border-b-0"
            >
              <Zap className="h-4 w-4" />
              <span>JUGAR CONTRARRELOJ</span>
            </Link>
          </div>

          {/* Column Headers */}
          <div className="flex items-center justify-between px-2 font-mono text-[11px] uppercase text-slate-400">
            <span># Piloto · Precisión</span>
            <span>Marca (Watts)</span>
          </div>

          <div className="space-y-1.5">
            {timeAttackBoard.map((run, index) => {
              const isMe =
                run.user_id === currentUser.userId || run.username === currentUser.username
              const league = LEAGUE_CONFIG[run.league_tier] || LEAGUE_CONFIG.silicon
              const accuracy =
                run.questions_solved > 0
                  ? Math.round((run.correct_answers / run.questions_solved) * 100)
                  : 0

              return (
                <div
                  key={run.session_id || `${run.username}-${index}`}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                    isMe
                      ? 'border border-neon-amp/50 bg-neon-amp/10'
                      : 'border border-pcb-trace/50 bg-pcb-elevated/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pcb-base/70 font-mono text-xs font-bold text-slate-300">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-sm font-semibold ${
                            isMe ? 'text-neon-amp' : 'text-white'
                          }`}
                        >
                          {run.username}
                        </p>
                        {isMe && (
                          <span className="rounded bg-neon-amp/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-neon-amp">
                            TÚ
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-slate-400">
                        <span className={league.color}>Liga {league.name}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-neon-watt">
                          <Target className="h-2.5 w-2.5" />
                          {run.correct_answers}/{run.questions_solved} ({accuracy}%)
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{formatRelativeDate(run.played_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-neon-amp">
                      +{run.watts_earned} W
                    </span>
                    <div className="font-mono text-[10px] text-slate-400 sm:hidden">
                      {accuracy}% prec.
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
