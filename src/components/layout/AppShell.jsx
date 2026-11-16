import { Outlet, Link } from 'react-router-dom'
import { Zap, Flame, ShieldAlert } from 'lucide-react'
import BottomNav from './BottomNav'

/**
 * Main mobile-first application shell with top status bar and persistent BottomNav.
 */
export default function AppShell() {
  return (
    <div className="bg-pcb-grid min-h-[100dvh] text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col border-x border-pcb-trace/40 bg-pcb-base/80">
        {/* Top Status Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-pcb-trace bg-pcb-panel/90 px-4 py-3 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-volt/50 bg-neon-volt/10 text-neon-volt shadow-neon-volt">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Ohm<span className="text-neon-volt">Drive</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 font-mono text-xs font-semibold">
            <div className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2 py-1 text-neon-amp">
              <Flame className="h-3.5 w-3.5" />
              <span>1d</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2 py-1 text-neon-volt">
              <Zap className="h-3.5 w-3.5" />
              <span>0 W</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2 py-1 text-neon-watt">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>5/5</span>
            </div>
          </div>
        </header>

        {/* Active Page Content */}
        <main className="flex-1 px-4 pb-24 pt-4">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
