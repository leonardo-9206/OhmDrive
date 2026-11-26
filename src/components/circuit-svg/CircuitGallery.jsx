import { useState } from 'react'
import { sectorsList } from '../../data/sectors'
import CircuitCanvas from './CircuitCanvas'
import { DC_LEVEL_TOPOLOGIES } from './fixtures/dcLevelTopologies'

/**
 * Banco de pruebas visual del motor SVG (solo en desarrollo: /dev/circuits).
 * Renderiza todos los circuitos de los sectores con controles para energizar,
 * provocar cortocircuito o sobrecalentar un componente.
 */
export default function CircuitGallery() {
  const [source, setSource] = useState('levels')
  const challenges = sectorsList.flatMap((s) =>
    s.lessons.flatMap((l) => l.challenges.map((c) => ({ ...c, sectorTitle: s.title, lessonTitle: l.title }))),
  )
  const levelCards = DC_LEVEL_TOPOLOGIES.map((t) => ({
    challenge_id: t.title,
    interaction_type: `nivel ${t.level}`,
    circuit_config_json: t.config,
  }))
  const cards = source === 'levels' ? levelCards : challenges

  return (
    <div className="bg-pcb-grid min-h-[100dvh] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-md space-y-4 md:grid md:max-w-5xl md:grid-cols-2 md:gap-4 md:space-y-0">
        <header className="md:col-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neon-volt">US-04 · US-08R · dev</p>
          <h1 className="font-display text-xl font-bold text-white">Circuit Canvas Gallery</h1>
          <div className="mt-2 flex gap-2">
            <Toggle active={source === 'levels'} onClick={() => setSource('levels')}>
              6 niveles ({levelCards.length})
            </Toggle>
            <Toggle active={source === 'sectors'} onClick={() => setSource('sectors')}>
              sectores JSON ({challenges.length})
            </Toggle>
          </div>
        </header>
        {cards.map((c) => (
          <GalleryCard key={c.challenge_id} challenge={c} />
        ))}
      </div>
    </div>
  )
}

function GalleryCard({ challenge }) {
  const cfg = challenge.circuit_config_json
  const [energized, setEnergized] = useState(Boolean(cfg.is_energized_initially))
  const [fault, setFault] = useState(null)
  const [lastTap, setLastTap] = useState(null)
  const slot = cfg.components.find((c) => c.type === 'resistor_slot')
  const correct = challenge.options?.find((o) => o.id === challenge.solution_json?.correct_option_id)
  const [slotFilled, setSlotFilled] = useState(false)

  return (
    <article className="overflow-hidden rounded-2xl border border-pcb-trace bg-pcb-panel">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-xs font-bold text-neon-volt">{challenge.challenge_id}</span>
        <span className="font-mono text-[10px] uppercase text-slate-400">{challenge.interaction_type}</span>
      </div>
      <CircuitCanvas
        config={cfg}
        isEnergized={energized}
        fault={fault}
        slotValues={slot && slotFilled && correct ? { [slot.id]: correct.numeric_value } : {}}
        onComponentClick={(c) => {
          setLastTap(c.id)
          if (c.type === 'resistor_slot') setSlotFilled((v) => !v)
        }}
      />
      <div className="flex flex-wrap gap-2 p-3">
        <Toggle active={energized} onClick={() => setEnergized((v) => !v)}>
          ⚡ Energizar
        </Toggle>
        <Toggle active={fault?.type === 'short'} onClick={() => setFault((f) => (f?.type === 'short' ? null : { type: 'short' }))}>
          Corto
        </Toggle>
        {/* sin componentId: el canvas elige solo qué componente se calienta (US-13) */}
        <Toggle active={fault?.type === 'warning'} onClick={() => setFault((f) => (f?.type === 'warning' ? null : { type: 'warning' }))}>
          Calor
        </Toggle>
        <Toggle active={fault?.type === 'overheat'} onClick={() => setFault((f) => (f?.type === 'overheat' ? null : { type: 'overheat' }))}>
          Sobrecarga
        </Toggle>
        {lastTap && <span className="self-center font-mono text-[10px] text-slate-400">tap: {lastTap}</span>}
      </div>
    </article>
  )
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] rounded-lg border px-3 font-mono text-xs font-bold ${
        active ? 'border-neon-watt bg-neon-watt/10 text-neon-watt' : 'border-pcb-trace bg-pcb-elevated text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}
