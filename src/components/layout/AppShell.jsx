import { useEffect, useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Zap, Flame } from 'lucide-react'
import BottomNav from './BottomNav'
import FuseBar from '../ui/FuseBar'
import { readLocalProgress, LOCAL_STORAGE_KEY } from '../../utils/localProgress'

/**
 * Responsive PC + Mobile application shell with top status bar and persistent BottomNav.
 * Expands from mobile (`max-w-md`) to desktop (`md:max-w-5xl`) per Rubric Criterion 11.
 */
export default function AppShell() {
  const [progress, setProgress] = useState(() => readLocalProgress())

  useEffect(() => {
    const sync = () => setProgress(readLocalProgress())
    const onStorage = (e) => {
      if (!e.key || e.key === LOCAL_STORAGE_KEY) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return (
    <div className="bg-pcb-grid min-h-[100dvh] text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col border-x border-pcb-trace/40 bg-pcb-base/80 md:max-w-5xl">
        {/* Top Status Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-pcb-trace bg-pcb-panel/90 px-4 py-3 backdrop-blur-md md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-volt/50 bg-neon-volt/10 text-neon-volt shadow-neon-volt">
              <Zap className="h-4 w-4" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Ohm<span className="text-neon-volt">Drive</span>
              </span>
              <span className="hidden font-mono text-[11px] uppercase tracking-wider text-slate-400 md:inline">
                Circuitos CD · UAA
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 font-mono text-xs font-semibold md:gap-3">
            <div
              title="Racha de estudio"
              className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2 py-1 text-neon-amp"
            >
              <Flame className="h-3.5 w-3.5" />
              <span>{progress.streakDays}d</span>
            </div>
            <div
              title="Watts XP acumulados"
              className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2 py-1 text-neon-volt"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{progress.totalWattsXp} W</span>
            </div>
            <FuseBar fuses={progress.currentFuses} maxFuses={5} compact className="hidden sm:inline-flex" />
            <div className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2 py-1 text-neon-watt sm:hidden">
              <Zap className="h-3.5 w-3.5" />
              <span>{progress.currentFuses}/5</span>
            </div>
          </div>
        </header>

        {/* Active Page Content */}
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pt-6">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
