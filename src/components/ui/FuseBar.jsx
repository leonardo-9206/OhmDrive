import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

/**
 * Displays the player's remaining fuses (lives) in Story Mode with Cyber-PCB styling.
 *
 * @param {Object} props
 * @param {number} [props.fuses=5] - Current active fuses
 * @param {number} [props.maxFuses=5] - Maximum number of fuses
 * @param {boolean} [props.compact=false] - Compact mode for tight top bars
 * @param {boolean} [props.showLabel=true] - Show numeric counter (e.g. "5/5")
 * @param {string} [props.className='']
 */
export default function FuseBar({
  fuses = 5,
  maxFuses = 5,
  compact = false,
  showLabel = true,
  className = '',
}) {
  const safeMax = Math.max(1, maxFuses)
  const clampedFuses = Math.max(0, Math.min(fuses, safeMax))

  const isCritical = clampedFuses <= 1
  const isWarning = clampedFuses === 2

  const activeColor = isCritical
    ? {
        capsule: 'border-neon-short bg-neon-short/20 shadow-[0_0_10px_rgba(255,51,75,0.5)]',
        filament: 'bg-neon-short',
        text: 'text-neon-short',
      }
    : isWarning
      ? {
          capsule: 'border-neon-amp bg-neon-amp/20 shadow-[0_0_10px_rgba(255,184,0,0.4)]',
          filament: 'bg-neon-amp',
          text: 'text-neon-amp',
        }
      : {
          capsule: 'border-neon-watt bg-neon-watt/15 shadow-[0_0_10px_rgba(0,255,102,0.35)]',
          filament: 'bg-neon-watt',
          text: 'text-neon-watt',
        }

  return (
    <div
      role="status"
      aria-label={`${clampedFuses} de ${safeMax} fusibles activos`}
      className={[
        'inline-flex items-center gap-2 rounded-xl border border-pcb-trace bg-pcb-panel/90',
        compact ? 'px-2 py-1' : 'px-3 py-1.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Zap
        className={[
          compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          activeColor.text,
          isCritical ? 'animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      <div className="flex items-center gap-1">
        {Array.from({ length: safeMax }).map((_, index) => {
          const isActive = index < clampedFuses

          return (
            <motion.div
              key={index}
              initial={false}
              animate={{
                scale: isActive ? 1 : 0.9,
                opacity: isActive ? 1 : 0.35,
              }}
              transition={{ duration: 0.2 }}
              className={[
                'relative flex items-center justify-center rounded border transition-colors',
                compact ? 'h-3.5 w-2.5' : 'h-4 w-3',
                isActive
                  ? activeColor.capsule
                  : 'border-pcb-trace bg-pcb-elevated',
              ].join(' ')}
            >
              {/* Metallic fuse end caps */}
              <span className="absolute -top-[1px] h-[2px] w-1.5 rounded-full bg-slate-400/70" />
              <span className="absolute -bottom-[1px] h-[2px] w-1.5 rounded-full bg-slate-400/70" />

              {/* Internal glowing filament */}
              {isActive ? (
                <motion.span
                  animate={isCritical ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                  transition={isCritical ? { repeat: Infinity, duration: 0.8 } : undefined}
                  className={['h-2 w-[2px] rounded-full', activeColor.filament].join(' ')}
                />
              ) : (
                <span className="h-[2px] w-1.5 rotate-45 rounded-full bg-slate-600" />
              )}
            </motion.div>
          )
        })}
      </div>

      {showLabel && (
        <span
          className={[
            'font-mono font-bold tabular-nums',
            compact ? 'text-[11px]' : 'text-xs',
            activeColor.text,
          ].join(' ')}
        >
          {clampedFuses}/{safeMax}
        </span>
      )}
    </div>
  )
}
