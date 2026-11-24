import { Link, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { FuseBar } from '../components/ui'

export default function LessonRunnerPage() {
  const { lessonId } = useParams()

  return (
    <div className="bg-pcb-grid min-h-[100dvh] text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col border-x border-pcb-trace/40 bg-pcb-base/90 px-4 py-3 md:max-w-5xl md:px-6 md:py-5">
        <header className="flex items-center justify-between gap-3">
          <Link
            to="/"
            aria-label="Salir de la lección"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pcb-trace bg-pcb-panel text-slate-300 transition-colors hover:border-neon-volt/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-pcb-elevated">
            <div className="h-full w-1/4 rounded-full bg-neon-watt shadow-neon-watt" />
          </div>
          <FuseBar fuses={5} maxFuses={5} compact />
        </header>

        {/* Responsive 2-column desktop / 1-column mobile workspace */}
        <div className="mt-4 flex flex-1 flex-col gap-4 md:grid md:grid-cols-12 md:items-center md:gap-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-pcb-trace bg-pcb-panel/80 p-6 text-center md:col-span-7 md:min-h-[380px]">
            <p className="font-mono text-xs uppercase tracking-widest text-neon-volt">
              Lienzo SVG del Circuito
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-white">
              Nivel #{lessonId}
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Contenedor responsivo listo para US-06R (Explicación + Fórmulas + Ejemplo Resuelto,
              input numérico con unidades, pista con reintento y resultados).
            </p>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-pcb-trace bg-pcb-panel/80 p-6 text-center md:col-span-5 md:min-h-[380px]">
            <p className="font-mono text-xs uppercase tracking-wider text-neon-amp">
              Panel de Control &amp; Respuesta
            </p>
            <p className="mt-2 text-sm text-slate-400">
              En computadora se muestra a 2 columnas (`md:grid-cols-12`); en móvil se apila
              verticalmente sin desbordar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
