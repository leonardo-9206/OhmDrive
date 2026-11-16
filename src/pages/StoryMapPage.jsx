import { Link } from 'react-router-dom'
import { Map, Play } from 'lucide-react'

export default function StoryMapPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neon-volt/40 bg-pcb-panel p-4 shadow-neon-volt">
        <div className="flex items-center gap-2 text-neon-volt">
          <Map className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wider">Modo Historia</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold text-white">
          Campaña: Reconexión Neo-Ags
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Restaura los 4 Sectores de la red eléctrica junto a Kilo (K-1L0), desde Ley de Ohm hasta Potencia en CA.
        </p>
        <Link
          to="/lesson/1"
          className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-b-4 border-cyan-700 bg-neon-volt px-4 font-display text-sm font-bold text-pcb-base transition-transform active:translate-y-1 active:border-b-0"
        >
          <Play className="h-4 w-4 fill-current" />
          PROBAR MOTOR DE LECCIÓN
        </Link>
      </div>
    </section>
  )
}
