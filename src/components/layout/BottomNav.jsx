import { NavLink } from 'react-router-dom'
import { Map, Zap, FlaskConical, BookOpen, Trophy } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Unidades', icon: Map, end: true },
  { to: '/practice', label: 'Práctica', icon: Zap },
  { to: '/cyberlab', label: 'CyberLab', icon: FlaskConical },
  { to: '/codex', label: 'Códice', icon: BookOpen },
  { to: '/leaderboard', label: 'Ranking', icon: Trophy },
]

/**
 * Responsive bottom navigation bar for OhmDrive's modes + Codex + Leaderboard.
 */
export default function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-pcb-trace bg-pcb-panel/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-1.5 md:max-w-5xl md:px-6">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-all md:flex-row md:justify-center md:gap-2 md:py-2 md:text-xs',
                isActive
                  ? 'text-neon-volt drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-slate-200',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={[
                    'flex h-8 w-11 items-center justify-center rounded-xl transition-colors md:h-8 md:w-8',
                    isActive ? 'border border-neon-volt/40 bg-neon-volt/15' : '',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.9} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
