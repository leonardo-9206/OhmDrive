import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Play } from 'lucide-react'
import { NeonButton, FuseBar, FormulaText } from '../components/ui'
import KiloMascot from '../components/mascot/KiloMascot'

const KILO_STATES = ['idle', 'thinking', 'happy', 'shock', 'overheat']

export default function StoryMapPage() {
  const navigate = useNavigate()
  const [kiloState, setKiloState] = useState('idle')

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neon-volt/40 bg-pcb-panel p-4 shadow-neon-volt">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-neon-volt">
            <Map className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-wider">Modo Historia</span>
          </div>
          <FuseBar fuses={5} maxFuses={5} compact />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <KiloMascot state={kiloState} size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-white">
              Campaña: Reconexión Neo-Ags
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Restaura los 4 Sectores de la red eléctrica junto a{' '}
              <span className="font-mono text-neon-volt">K-1L0</span>, desde{' '}
              <FormulaText text="$V = I \cdot R$" /> hasta Potencia en CA.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {KILO_STATES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setKiloState(st)}
              className={[
                'rounded-lg border px-2 py-1 font-mono text-[11px] uppercase transition-colors',
                kiloState === st
                  ? 'border-neon-volt bg-neon-volt/15 text-neon-volt'
                  : 'border-pcb-trace bg-pcb-elevated text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <NeonButton
            variant="volt"
            fullWidth
            icon={<Play className="h-4 w-4 fill-current" />}
            onClick={() => navigate('/lesson/1')}
          >
            Probar Motor de Lección
          </NeonButton>
        </div>
      </div>
    </section>
  )
}
