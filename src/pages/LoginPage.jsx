import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, User, ArrowRight } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { isSupabaseConfigured, supabase } from '../services/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const setGuestUser = useGameStore((state) => state.setGuestUser)
  const loginUser = useGameStore((state) => state.loginUser)

  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  const handleGuestAccess = (e) => {
    e.preventDefault()
    setGuestUser(guestName.trim() || undefined)
    navigate('/')
  }

  const handleSupabaseLogin = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured || !supabase) return

    setLoading(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthError(error.message)
      } else if (data?.user) {
        loginUser({
          user_id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.email.split('@')[0]
        })
        navigate('/')
      }
    } catch (err) {
      setAuthError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-pcb-grid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center border-x border-pcb-trace/40 bg-pcb-base px-6 py-8 text-slate-100">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-volt/50 bg-neon-volt/10 text-neon-volt shadow-neon-volt">
        <Zap className="h-7 w-7" />
      </span>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
        Ohm<span className="text-neon-volt">Drive</span>
      </h1>
      <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-400">
        Terminal de Acceso — Grid Engineer
      </p>

      {/* Guest Mode Card */}
      <div className="mt-6 w-full rounded-2xl border border-pcb-trace bg-pcb-panel p-5 text-left">
        <div className="flex items-center gap-2 text-neon-amp text-sm font-semibold">
          <User className="h-4 w-4" />
          <span>Acceso Rápido (Modo Invitado)</span>
        </div>
        <p className="mt-1 text-xs text-slate-300">
          Entra al instante para la exposición o prácticas de clase sin necesidad de registro.
        </p>

        <form onSubmit={handleGuestAccess} className="mt-4 space-y-3">
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Tu Alias (ej. Cadete_Ohm)"
            maxLength={25}
            className="w-full rounded-xl border border-pcb-trace bg-pcb-elevated px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-neon-volt focus:outline-none"
          />

          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-b-4 border-amber-700 bg-neon-amp font-display text-sm font-bold text-pcb-base transition-transform active:translate-y-1 active:border-b-0"
          >
            <span>INGRESAR COMO INVITADO</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Supabase Cloud Login (if configured) */}
      {isSupabaseConfigured && (
        <div className="mt-4 w-full rounded-2xl border border-pcb-trace/60 bg-pcb-panel/60 p-5 text-left">
          <div className="flex items-center gap-2 text-neon-volt text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Sincronización Cloud (Supabase)</span>
          </div>

          {authError && (
            <p className="mt-2 rounded-lg border border-neon-short/40 bg-neon-short/10 p-2 text-xs text-neon-short">
              {authError}
            </p>
          )}

          <form onSubmit={handleSupabaseLogin} className="mt-3 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="w-full rounded-xl border border-pcb-trace bg-pcb-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-neon-volt focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full rounded-xl border border-pcb-trace bg-pcb-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-neon-volt focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border-b-4 border-cyan-700 bg-neon-volt font-display text-sm font-bold text-pcb-base transition-transform active:translate-y-1 active:border-b-0 disabled:opacity-50"
            >
              {loading ? 'AUTENTICANDO...' : 'SINCRONIZAR CUENTA'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
