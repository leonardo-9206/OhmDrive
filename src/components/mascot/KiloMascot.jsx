import { motion } from 'framer-motion'

const STATE_CONFIG = {
  idle: {
    color: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.45)',
    label: 'Kilo en espera',
  },
  thinking: {
    color: '#FFB800',
    glow: 'rgba(255, 184, 0, 0.45)',
    label: 'Kilo analizando el circuito',
  },
  happy: {
    color: '#00FF66',
    glow: 'rgba(0, 255, 102, 0.5)',
    label: 'Kilo celebrando circuito correcto',
  },
  shock: {
    color: '#FF334B',
    glow: 'rgba(255, 51, 75, 0.55)',
    label: 'Kilo con descarga por cortocircuito',
  },
  overheat: {
    color: '#FF2A85',
    glow: 'rgba(255, 42, 133, 0.55)',
    label: 'Kilo en alerta de sobrecarga',
  },
}

const SIZE_MAP = {
  sm: 64,
  md: 96,
  lg: 136,
}

/**
 * Renders the animated SVG visor eyes for each Kilo state.
 */
function VisorExpression({ state, color }) {
  switch (state) {
    case 'thinking':
      return (
        <g>
          {/* Left squinted focused eye */}
          <rect x="46" y="74" width="18" height="5" rx="2.5" fill={color} />
          {/* Right "?" telemetry symbol */}
          <text
            x="104"
            y="84"
            textAnchor="middle"
            fill={color}
            fontSize="22"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            ?
          </text>
        </g>
      )

    case 'happy':
      return (
        <g>
          {/* Left happy arc ^ */}
          <path
            d="M 46 80 Q 55 66 64 80"
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Right happy arc ^ */}
          <path
            d="M 96 80 Q 105 66 114 80"
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      )

    case 'shock':
      return (
        <g stroke={color} strokeWidth="4.2" strokeLinecap="round">
          {/* Left X */}
          <line x1="47" y1="68" x2="61" y2="82" />
          <line x1="61" y1="68" x2="47" y2="82" />
          {/* Right X */}
          <line x1="99" y1="68" x2="113" y2="82" />
          <line x1="113" y1="68" x2="99" y2="82" />
        </g>
      )

    case 'overheat':
      return (
        <motion.g
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ repeat: Infinity, duration: 0.55 }}
        >
          {/* Left warning bar */}
          <rect x="48" y="72" width="14" height="6" rx="3" fill={color} />
          {/* Center-right exclamation alert ! */}
          <rect x="77" y="62" width="6" height="15" rx="3" fill={color} />
          <circle cx="80" cy="83" r="3.2" fill={color} />
          {/* Right warning bar */}
          <rect x="98" y="72" width="14" height="6" rx="3" fill={color} />
        </motion.g>
      )

    case 'idle':
    default:
      return (
        <motion.g
          animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
          transition={{
            repeat: Infinity,
            duration: 3.8,
            times: [0, 0.45, 0.5, 0.55, 1],
          }}
          style={{ transformOrigin: '80px 75px' }}
        >
          <rect x="47" y="66" width="14" height="18" rx="7" fill={color} />
          <rect x="99" y="66" width="14" height="18" rx="7" fill={color} />
        </motion.g>
      )
  }
}

/**
 * Animated SVG mascot Kilo (K-1L0), the Cyber-PCB fox/droid with multimeter-probe ears.
 *
 * @param {Object} props
 * @param {'idle'|'thinking'|'happy'|'shock'|'overheat'} [props.state='idle']
 * @param {'sm'|'md'|'lg'|number} [props.size='md']
 * @param {string} [props.className='']
 * @param {string} [props.label]
 */
export default function KiloMascot({
  state = 'idle',
  size = 'md',
  className = '',
  label,
}) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.idle
  const px = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md

  const containerAnimation =
    state === 'shock'
      ? {
          x: [-3, 3, -3, 3, 0],
          transition: { repeat: Infinity, duration: 0.32 },
        }
      : state === 'happy'
        ? {
            y: [0, -6, 0],
            transition: { repeat: Infinity, duration: 1.1, ease: 'easeInOut' },
          }
        : state === 'overheat'
          ? {
              y: [0, -2, 0],
              scale: [1, 1.03, 1],
              transition: { repeat: Infinity, duration: 0.7 },
            }
          : state === 'thinking'
            ? {
                rotate: [0, -2.5, 0],
                y: [0, -2, 0],
                transition: { repeat: Infinity, duration: 2.6, ease: 'easeInOut' },
              }
            : {
                y: [0, -4, 0],
                transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
              }

  return (
    <motion.div
      role="img"
      aria-label={label || cfg.label}
      animate={containerAnimation}
      style={{ width: px, height: px }}
      className={['relative inline-flex shrink-0 items-center justify-center select-none', className]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`kilo-glow-${state}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={cfg.color} floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Ambient state aura behind helmet */}
        <circle cx="80" cy="82" r="52" fill={cfg.glow} opacity="0.14" />

        {/* State-specific ambient effects */}
        {state === 'happy' && (
          <g fill="#00FF66">
            <motion.circle
              cx="24"
              cy="46"
              r="3"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
            <motion.circle
              cx="138"
              cy="42"
              r="2.5"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
            />
            <motion.path
              d="M 134 78 L 138 72 L 142 78 L 138 84 Z"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}
            />
          </g>
        )}

        {state === 'shock' && (
          <g>
            {/* Smoke puffs */}
            <motion.circle
              cx="34"
              cy="28"
              r="6"
              fill="#64748B"
              animate={{ y: [0, -10], opacity: [0.75, 0], scale: [0.8, 1.5] }}
              transition={{ repeat: Infinity, duration: 1.1 }}
            />
            <motion.circle
              cx="126"
              cy="26"
              r="5"
              fill="#94A3B8"
              animate={{ y: [0, -12], opacity: [0.75, 0], scale: [0.8, 1.6] }}
              transition={{ repeat: Infinity, duration: 1.1, delay: 0.35 }}
            />
          </g>
        )}

        {/* LEFT EAR: Red Positive (+) Multimeter Probe */}
        <g transform="rotate(-14 48 48)">
          {/* Metallic needle tip */}
          <polygon points="48,6 44,24 52,24" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
          {/* Probe collar */}
          <rect x="42" y="23" width="12" height="5" rx="1.5" fill="#475569" />
          {/* Red probe body */}
          <path
            d="M 40 28 L 56 28 L 59 54 L 37 54 Z"
            fill="#FF334B"
            stroke="#9F1239"
            strokeWidth="2"
          />
          {/* + symbol */}
          <text
            x="48"
            y="45"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            +
          </text>
        </g>

        {/* RIGHT EAR: Black/Dark Common (COM) Multimeter Probe */}
        <g transform="rotate(14 112 48)">
          {/* Metallic needle tip */}
          <polygon points="112,6 108,24 116,24" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
          {/* Probe collar */}
          <rect x="106" y="23" width="12" height="5" rx="1.5" fill="#475569" />
          {/* Dark COM probe body */}
          <path
            d="M 104 28 L 120 28 L 123 54 L 101 54 Z"
            fill="#1E293B"
            stroke="#475569"
            strokeWidth="2"
          />
          {/* COM / - detail */}
          <text
            x="112"
            y="44"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="8"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            COM
          </text>
        </g>

        {/* CHEST / TORSO COLLAR WITH GLOWING OHM SYMBOL */}
        <path
          d="M 52 114 L 108 114 L 116 144 Q 116 150 108 150 L 52 150 Q 44 150 44 144 Z"
          fill="#111827"
          stroke="#334155"
          strokeWidth="2.5"
        />
        {/* Chest core plate */}
        <circle
          cx="80"
          cy="134"
          r="12"
          fill="#090D16"
          stroke={cfg.color}
          strokeWidth="2"
          filter={`url(#kilo-glow-${state})`}
        />
        <text
          x="80"
          y="139.5"
          textAnchor="middle"
          fill={cfg.color}
          fontSize="15"
          fontWeight="700"
          fontFamily="Space Grotesk, sans-serif"
        >
          Ω
        </text>

        {/* GEOMETRIC FOX/DROID HELMET HEAD */}
        <path
          d="M 38 56 Q 38 42 54 42 L 106 42 Q 122 42 122 56 L 128 84 Q 128 102 106 112 L 86 118 Q 80 120 74 118 L 54 112 Q 32 102 32 84 Z"
          fill="#111827"
          stroke="#334155"
          strokeWidth="2.5"
        />
        {/* Subtle top helmet ridge */}
        <path d="M 62 42 L 68 50 L 92 50 L 98 42" fill="none" stroke="#334155" strokeWidth="2" />

        {/* Cheek vents */}
        <line x1="29" y1="82" x2="35" y2="82" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" />
        <line x1="125" y1="82" x2="131" y2="82" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" />

        {/* PANORAMIC LED VISOR */}
        <rect
          x="38"
          y="56"
          width="84"
          height="38"
          rx="14"
          fill="#090D16"
          stroke={cfg.color}
          strokeWidth="2.5"
          filter={`url(#kilo-glow-${state})`}
        />

        {/* Visor inner reflection */}
        <path
          d="M 47 61 L 72 61"
          stroke="#FFFFFF"
          strokeOpacity="0.16"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dynamic LED Eyes */}
        <VisorExpression state={state} color={cfg.color} />

        {/* Cute geometric fox snout indicator */}
        <polygon points="76,101 84,101 80,106" fill="#475569" />
      </svg>
    </motion.div>
  )
}
