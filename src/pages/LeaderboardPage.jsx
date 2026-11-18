import { useEffect, useState } from 'react'
import { Trophy, Medal, Zap, Flame, Shield, RefreshCw } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { getLeaderboard, isSupabaseConfigured } from '../services/supabaseClient'

const LEAGUE_BADGES = {
  silicon: { name: 'Silicio', color: 'text-slate-400', border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
  copper: { name: 'Cobre', color: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  gold: { name: 'Oro', color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
  superconductor: { name: 'Superconductor', color: 'text-neon-volt', border: 'border-neon-volt/40', bg: 'bg-neon-volt/10' }
}

const LOCAL_FALLBACK_LEADERBOARD = [
  { username: 'VoltMaster_99', total_watts_xp: 4200, streak_days: 14, league_tier: 'superconductor' },
  { username: 'Tesla_Ags', total_watts_xp: 3450, streak_days: 9, league_tier: 'superconductor' },
  { username: 'Kirchhoff_Hero', total_watts_xp: 2800, streak_days: 7, league_tier: 'gold' },
  { username: 'OhmLawyer', total_watts_xp: 1950, streak_days: 5, league_tier: 'copper' },
  { username: 'TheveninGhost', total_watts_xp: 1200, streak_days: 3, league_tier: 'copper' }
]

export default function LeaderboardPage() {
  const currentUser = useGameStore((state) => state.user)
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(false)

  const loadLeaderboardData = async () => {
    setLoading(true)
    try {
      const data = await getLeaderboard(10)
      if (data && data.length > 0) {
        setBoard(data)
      } else {
        // Merge current player with fallback leaderboard for display
        const merged = [
          ...LOCAL_FALLBACK_LEADERBOARD,
          {
            username: currentUser.username,
            total_watts_xp: currentUser.totalWattsXp,
            streak_days: currentUser.streakDays,
            league_tier: currentUser.leagueTier,
            isCurrent: true
          }
        ].sort((a, b) => b.total_watts_xp - a.total_watts_xp)
        setBoard(merged)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboardData()
  }, [currentUser.totalWattsXp])

  const userLeague = LEAGUE_BADGES[currentUser.leagueTier] || LEAGUE_BADGES.silicon

  return (
    <section className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neon-amp">
            <Trophy className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-wider">Ranking del Salón</span>
          </div>
          <button
            onClick={loadLeaderboardData}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        <h1 className="mt-1 font-display text-xl font-bold text-white">
          Leaderboard de Ligas
        </h1>
        <p className="mt-1 text-xs text-slate-300">
          Compite acumulando Watts (XP) en el Modo Historia y Contrarreloj.
        </p>

        {/* Current User Summary Card */}
        <div className={`mt-3 flex items-center justify-between rounded-xl border ${userLeague.border} ${userLeague.bg} p-3`}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Tu Estado Actual</span>
            <p className="font-display text-sm font-bold text-white">{currentUser.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className={`h-3.5 w-3.5 ${userLeague.color}`} />
              <span className={`text-xs font-semibold ${userLeague.color}`}>Liga {userLeague.name}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-neon-volt justify-end font-mono text-sm font-bold">
              <Zap className="h-4 w-4" />
              <span>{currentUser.totalWattsXp} W</span>
            </div>
            <div className="flex items-center gap-1 text-neon-amp justify-end text-xs font-mono">
              <Flame className="h-3 w-3" />
              <span>{currentUser.streakDays} d racha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-3">
        <div className="mb-2 px-2 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
          <span># Grid Engineer</span>
          <span>Watts (XP)</span>
        </div>

        <div className="space-y-1.5">
          {board.map((item, index) => {
            const isMe = item.username === currentUser.username
            const league = LEAGUE_BADGES[item.league_tier] || LEAGUE_BADGES.silicon

            return (
              <div
                key={item.user_id || `${item.username}-${index}`}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                  isMe
                    ? 'border border-neon-volt/50 bg-neon-volt/10'
                    : 'border border-pcb-trace/50 bg-pcb-elevated/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center font-mono text-xs font-bold text-slate-400">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-semibold ${isMe ? 'text-neon-volt' : 'text-white'}`}>
                        {item.username}
                      </p>
                      {isMe && (
                        <span className="rounded bg-neon-volt/20 px-1 py-0.2 text-[9px] font-bold text-neon-volt">
                          TÚ
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono ${league.color}`}>
                      Liga {league.name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-neon-volt">
                    {item.total_watts_xp} W
                  </span>
                  {item.streak_days > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono justify-end">
                      <Flame className="h-2.5 w-2.5 text-neon-amp" />
                      <span>{item.streak_days}d</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
