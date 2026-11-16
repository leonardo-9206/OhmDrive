import { Trophy } from 'lucide-react'

export default function LeaderboardPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-4">
        <div className="flex items-center gap-2 text-neon-volt">
          <Trophy className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wider">Ranking del Salón</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold text-white">
          Leaderboard de Ligas
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Compite en las ligas Silicio, Cobre, Oro y Superconductor acumulando Watts (XP).
        </p>
      </div>
    </section>
  )
}
