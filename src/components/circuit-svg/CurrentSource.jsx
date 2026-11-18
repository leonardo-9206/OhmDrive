import { BODY_LENGTH, COLORS } from './circuitTheme'

/**
 * <CurrentSource /> — fuente de corriente DC: círculo ámbar con flecha interna
 * apuntando de `from` hacia `to` (sentido de la corriente que entrega).
 */
export default function CurrentSource({ glowId, isFaulted = false }) {
  const r = BODY_LENGTH.current_source_dc / 2
  const color = isFaulted ? COLORS.short : COLORS.amp
  return (
    <g className={isFaulted ? 'ohm-fault-flash' : undefined}>
      <circle
        r={r}
        fill={COLORS.panel}
        stroke={color}
        strokeWidth={2.5}
        filter={glowId ? `url(#${glowId})` : undefined}
      />
      <path
        d={`M ${-r * 0.55} 0 H ${r * 0.5} M ${r * 0.18} -6 L ${r * 0.55} 0 L ${r * 0.18} 6`}
        fill="none"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}
