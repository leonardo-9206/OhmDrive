import { motion } from 'framer-motion'

const VARIANT_STYLES = {
  volt: 'bg-neon-volt text-pcb-base border-cyan-700 shadow-neon-volt hover:brightness-110',
  watt: 'bg-neon-watt text-pcb-base border-emerald-700 shadow-neon-watt hover:brightness-110',
  short: 'bg-neon-short text-white border-rose-800 shadow-neon-short hover:brightness-110',
  amp: 'bg-neon-amp text-pcb-base border-amber-700 shadow-[0_0_15px_rgba(255,184,0,0.35)] hover:brightness-110',
  ohm: 'bg-neon-ohm text-white border-pink-800 shadow-[0_0_15px_rgba(255,42,133,0.35)] hover:brightness-110',
  panel: 'bg-pcb-elevated text-slate-100 border-pcb-trace hover:border-neon-volt/60 hover:text-white',
}

const SIZE_STYLES = {
  sm: 'min-h-[40px] px-3.5 text-xs',
  md: 'min-h-[52px] px-5 text-sm',
  lg: 'min-h-[56px] px-6 text-base',
}

/**
 * Tactile 3D Cyberpunk button ("Cyber-Tactile") with Duolingo-style bottom depth.
 *
 * @param {Object} props
 * @param {'volt'|'watt'|'short'|'amp'|'ohm'|'panel'} [props.variant='volt']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} [props.className='']
 * @param {import('react').ReactNode} props.children
 */
export default function NeonButton({
  variant = 'volt',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const isDisabled = disabled || loading
  const variantClasses = VARIANT_STYLES[variant] || VARIANT_STYLES.volt
  const sizeClasses = SIZE_STYLES[size] || SIZE_STYLES.md

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl border-b-4 font-display font-bold uppercase tracking-wide transition-all duration-100 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-volt focus-visible:ring-offset-2 focus-visible:ring-offset-pcb-base',
        'active:translate-y-1 active:border-b-0',
        sizeClasses,
        variantClasses,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'cursor-not-allowed opacity-50 active:translate-y-0 active:border-b-4' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon && <span className="flex shrink-0 items-center">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  )
}
