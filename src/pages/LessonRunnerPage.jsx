import { Link, useParams } from 'react-router-dom'
import { X, ShieldAlert } from 'lucide-react'

export default function LessonRunnerPage() {
  const { lessonId } = useParams()

  return (
    <div className="bg-pcb-grid mx-auto flex h-[100dvh] max-w-md flex-col border-x border-pcb-trace/40 bg-pcb-base px-4 py-3 text-slate-100">
      <header className="flex items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="Salir de la lección"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-pcb-trace bg-pcb-panel text-slate-300 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-pcb-elevated">
          <div className="h-full w-1/4 rounded-full bg-neon-watt shadow-neon-watt" />
        </div>
        <div className="flex items-center gap-1 font-mono text-sm font-bold text-neon-watt">
          <ShieldAlert className="h-4 w-4" />
          <span>5</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neon-volt">
          LessonRunnerStateMachine
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          Lección #{lessonId}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Esqueleto listo para US-06 (cápsula de teoría, lienzo SVG y drawer KaTeX).
        </p>
      </div>
    </div>
  )
}
