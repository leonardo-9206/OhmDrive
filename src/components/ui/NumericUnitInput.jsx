import { Hash } from 'lucide-react'

const DEFAULT_UNITS = ['V', 'mV', 'A', 'mA', 'Ω', 'kΩ', 'W', 'mW']

/**
 * Numeric response input with integrated electrical unit pill selector and ±3% tolerance note.
 * Fulfills Rubric Criteria 5 & 6 for `"numeric_input"` challenges.
 *
 * @param {Object} props
 * @param {string|number} props.value - Current numeric string/value
 * @param {string} props.unit - Currently selected unit (e.g. 'mA', 'V', 'Ω')
 * @param {(val: string) => void} props.onValueChange
 * @param {(unit: string) => void} props.onUnitChange
 * @param {string[]} [props.unitOptions] - Allowed unit pills for the exercise
 * @param {number} [props.tolerancePercent=3] - Displayed rounding tolerance percentage
 * @param {string} [props.placeholder='Ej. 20 o 0.02']
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className='']
 */
export default function NumericUnitInput({
  value = '',
  unit = '',
  onValueChange,
  onUnitChange,
  unitOptions = DEFAULT_UNITS,
  tolerancePercent = 3,
  placeholder = 'Ej. 20 o 0.02',
  disabled = false,
  className = '',
}) {
  const units = unitOptions?.length ? unitOptions : DEFAULT_UNITS

  return (
    <div className={['space-y-3', className].filter(Boolean).join(' ')}>
      {/* Numeric Value Field */}
      <div className="relative flex items-center rounded-xl border-2 border-pcb-trace bg-pcb-base px-3.5 py-2 transition-colors focus-within:border-neon-volt focus-within:shadow-neon-volt">
        <Hash className="mr-2.5 h-5 w-5 shrink-0 text-neon-volt" />
        <input
          type="number"
          step="any"
          inputMode="decimal"
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange?.(e.target.value)}
          placeholder={placeholder}
          aria-label="Valor numérico de la respuesta"
          className="w-full bg-transparent font-mono text-lg font-semibold text-white placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        {unit && (
          <span className="ml-2 shrink-0 rounded-lg border border-neon-volt/40 bg-neon-volt/10 px-2.5 py-1 font-mono text-sm font-bold text-neon-volt">
            {unit}
          </span>
        )}
      </div>

      {/* Unit Pill Selector */}
      <div>
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          Selecciona la unidad:
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Selector de unidad eléctrica">
          {units.map((u) => {
            const isSelected = unit === u
            return (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onUnitChange?.(u)}
                className={[
                  'min-h-[40px] min-w-[48px] rounded-xl border-b-2 px-3 py-1.5 font-mono text-sm font-bold transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-volt',
                  isSelected
                    ? 'border-cyan-700 bg-neon-volt text-pcb-base shadow-neon-volt'
                    : 'border-pcb-trace bg-pcb-elevated text-slate-300 hover:border-neon-volt/50 hover:text-white',
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:translate-y-0.5',
                ].join(' ')}
              >
                {u}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tolerance Legend */}
      <p className="font-mono text-[11px] text-slate-400">
        Tolerancia de redondeo aceptada: <span className="text-neon-amp">±{tolerancePercent}%</span> · Verifica la unidad seleccionada
      </p>
    </div>
  )
}
