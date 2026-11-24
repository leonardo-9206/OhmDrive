import { useMemo, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { FormulaText } from '../components/ui'

const CODEX_FORMULAS = [
  {
    id: 'codex-1',
    unit: 1,
    level: 'Nivel 1',
    title: 'Corriente Eléctrica y Voltaje',
    accent: 'border-neon-volt/40 text-neon-volt',
    formula: 'I = \\frac{q}{t} \\qquad V = \\frac{W}{q}',
    unitsNote: 'I [A = C/s], V [V = J/C]',
    summary: 'La corriente mide el flujo de carga por unidad de tiempo; el voltaje es la energía por unidad de carga.',
  },
  {
    id: 'codex-2',
    unit: 1,
    level: 'Nivel 2',
    title: 'Ley de Ohm',
    accent: 'border-neon-volt/40 text-neon-volt',
    formula: 'V = I \\cdot R \\quad\\Longleftrightarrow\\quad I = \\frac{V}{R} \\quad\\Longleftrightarrow\\quad R = \\frac{V}{I}',
    unitsNote: 'V [V], I [A], R [Ω]',
    summary: 'Relación fundamental entre tensión, corriente y resistencia en un elemento resistivo lineal.',
  },
  {
    id: 'codex-3',
    unit: 1,
    level: 'Nivel 2',
    title: 'Potencia Eléctrica en CD (Joule)',
    accent: 'border-neon-watt/40 text-neon-watt',
    formula: 'P = V \\cdot I = I^2 \\cdot R = \\frac{V^2}{R}',
    unitsNote: 'P [W = J/s], 1 W = 1000 mW',
    summary: 'Rapidez con la que un componente entrega o disipa energía en forma de calor.',
  },
  {
    id: 'codex-4',
    unit: 2,
    level: 'Nivel 3',
    title: 'Resistencias en Serie',
    accent: 'border-neon-amp/40 text-neon-amp',
    formula: 'R_{eq} = R_1 + R_2 + \\cdots + R_n',
    unitsNote: 'Misma corriente I en todos los elementos',
    summary: 'La resistencia equivalente en serie es la suma directa de las resistencias individuales.',
  },
  {
    id: 'codex-5',
    unit: 2,
    level: 'Nivel 3',
    title: 'Resistencias en Paralelo',
    accent: 'border-neon-amp/40 text-neon-amp',
    formula: '\\frac{1}{R_{eq}} = \\sum_{i=1}^{n} \\frac{1}{R_i} \\qquad R_{eq,2} = \\frac{R_1 \\cdot R_2}{R_1 + R_2}',
    unitsNote: 'Mismo voltaje V en todas las ramas',
    summary: 'El inverso de la resistencia equivalente es la suma de los inversos; siempre es menor que la menor R.',
  },
  {
    id: 'codex-6',
    unit: 2,
    level: 'Nivel 4',
    title: 'Divisor de Voltaje y de Corriente',
    accent: 'border-neon-amp/40 text-neon-amp',
    formula: 'V_x = V_s \\cdot \\frac{R_x}{R_{eq}} \\qquad I_x = I_s \\cdot \\frac{R_{eq}}{R_x}',
    unitsNote: 'V_x en serie · I_x en paralelo',
    summary: 'Permiten hallar directamente el voltaje de un resistor en serie o la corriente de una rama en paralelo.',
  },
  {
    id: 'codex-7',
    unit: 3,
    level: 'Nivel 5',
    title: 'Ley de Corrientes de Kirchhoff (LCK)',
    accent: 'border-neon-ohm/40 text-neon-ohm',
    formula: '\\sum I_{\\text{entran}} = \\sum I_{\\text{salen}} \\quad\\Longleftrightarrow\\quad \\sum I_k = 0',
    unitsNote: 'Conservación de carga en un nodo',
    summary: 'La suma algebraica de todas las corrientes que entran y salen de cualquier nodo es cero.',
  },
  {
    id: 'codex-8',
    unit: 3,
    level: 'Nivel 5',
    title: 'Ley de Voltajes de Kirchhoff (LVK)',
    accent: 'border-neon-ohm/40 text-neon-ohm',
    formula: '\\sum_{\\text{lazo}} V_k = 0',
    unitsNote: 'Conservación de energía en una malla',
    summary: 'La suma algebraica de todas las subidas y caídas de tensión alrededor de un lazo cerrado es cero.',
  },
  {
    id: 'codex-9',
    unit: 3,
    level: 'Nivel 6',
    title: 'Análisis Nodal y de Mallas (CD)',
    accent: 'border-neon-ohm/40 text-neon-ohm',
    formula: '\\sum_{j} \\frac{V_A - V_j}{R_{Aj}} = 0 \\qquad \\sum_{k} R_{mk} I_k = V_{fuente}',
    unitsNote: 'Nodos: LCK + Ohm · Mallas: LVK + Ohm',
    summary: 'Métodos sistemáticos para resolver circuitos de dos o más mallas y múltiples fuentes en CD.',
  },
]

const UNIT_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 1, label: 'Unidad 1' },
  { id: 2, label: 'Unidad 2' },
  { id: 3, label: 'Unidad 3' },
]

export default function CodexPage() {
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CODEX_FORMULAS.filter((card) => {
      const matchesUnit = unitFilter === 'all' || card.unit === unitFilter
      const matchesQuery =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.level.toLowerCase().includes(q) ||
        card.summary.toLowerCase().includes(q)
      return matchesUnit && matchesQuery
    })
  }, [query, unitFilter])

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-neon-watt/40 bg-pcb-panel p-4 md:p-5">
        <div className="flex items-center gap-2 text-neon-watt">
          <BookOpen className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wider">Códice de Fórmulas CD</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold text-white md:text-2xl">
          Formulario Oficial de los 6 Niveles
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Consulta las leyes, divisores y ecuaciones de Kirchhoff para las Unidades 1, 2 y 3 en Corriente Directa.
        </p>

        {/* Search + Unit Filters */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ley, nivel o concepto (ej. Kirchhoff, Ohm, divisor)..."
              className="w-full rounded-xl border border-pcb-trace bg-pcb-base py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-neon-volt focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {UNIT_FILTERS.map((f) => (
              <button
                key={String(f.id)}
                type="button"
                onClick={() => setUnitFilter(f.id)}
                className={[
                  'rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-colors',
                  unitFilter === f.id
                    ? 'border-neon-watt bg-neon-watt/15 text-neon-watt'
                    : 'border-pcb-trace bg-pcb-elevated text-slate-300 hover:text-white',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Formula Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCards.map((card) => (
          <article
            key={card.id}
            className={[
              'flex flex-col justify-between rounded-2xl border bg-pcb-panel p-4',
              card.accent.split(' ')[0],
            ].join(' ')}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-400">
                  Unidad {card.unit} · {card.level}
                </span>
              </div>
              <h2 className="mt-1 font-display text-base font-bold text-white">
                {card.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {card.summary}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="rounded-xl border border-pcb-trace bg-pcb-base px-3 py-2 text-center">
                <FormulaText formula={card.formula} block />
              </div>
              <p className="font-mono text-[11px] text-slate-400">{card.unitsNote}</p>
            </div>
          </article>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-6 text-center text-sm text-slate-400">
          No se encontraron fórmulas que coincidan con "{query}".
        </div>
      )}
    </section>
  )
}
