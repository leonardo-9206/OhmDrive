import { BookOpen } from 'lucide-react'

export default function CodexPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neon-watt/40 bg-pcb-panel p-4">
        <div className="flex items-center gap-2 text-neon-watt">
          <BookOpen className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wider">Códice de Fórmulas</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold text-white">
          Tarjetas Coleccionables
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Consulta las leyes y teoremas desbloqueados de las Unidades I a V en formato KaTeX.
        </p>
      </div>
    </section>
  )
}
