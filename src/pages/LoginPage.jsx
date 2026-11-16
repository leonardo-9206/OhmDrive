import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="bg-pcb-grid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center border-x border-pcb-trace/40 bg-pcb-base px-6 text-center text-slate-100">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-volt/50 bg-neon-volt/10 text-neon-volt shadow-neon-volt">
        <Zap className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-white">
        Acceso a OhmDrive
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Inicia sesión con Supabase o entra en Modo Invitado Instantáneo.
      </p>
      <Link
        to="/"
        className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl border-b-4 border-cyan-700 bg-neon-volt px-4 font-display text-sm font-bold text-pcb-base transition-transform active:translate-y-1 active:border-b-0"
      >
        ENTRAR COMO INVITADO
      </Link>
    </div>
  )
}
