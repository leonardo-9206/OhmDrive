import { FlaskConical } from 'lucide-react'

export default function CyberLabPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neon-ohm/40 bg-pcb-panel p-4">
        <div className="flex items-center gap-2 text-neon-ohm">
          <FlaskConical className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wider">Modo Libre</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold text-white">
          CyberLab Sandbox
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Laboratorio interactivo en tiempo real: ajusta V, R, C y frecuencia para observar el flujo de corriente y las ecuaciones en vivo.
        </p>
      </div>
    </section>
  )
}
