import { Zap } from 'lucide-react'

export default function PracticePage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neon-amp/40 bg-pcb-panel p-4">
        <div className="flex items-center gap-2 text-neon-amp">
          <Zap className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wider">Modo Práctica</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold text-white">
          Arcade &amp; Entrenamiento Rápido
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Selecciona un tema específico o entra a Sobrecarga Contrarreloj (120 s) para el Leaderboard del salón.
        </p>
      </div>
    </section>
  )
}
