import { BODY_LENGTH, COLORS } from './circuitTheme'

/**
 * <VoltageSource /> — fuente DC: círculo cian con signos + y −.
 * Convención del JSON: `from` = terminal negativa, `to` = terminal positiva,
 * así que en coordenadas locales el "+" va hacia +x.
 * Los signos se contra-rotan para que el "−" nunca se vea como "|".
 */
export default function VoltageSource({ angle = 0, glowId, isFaulted = false }) {
  const r = BODY_LENGTH.voltage_source_dc / 2
  const color = isFaulted ? COLORS.short : COLORS.volt
  return (
    <g className={isFaulted ? 'ohm-fault-flash' : undefined}>
      <circle
        r={r}
        fill={COLORS.panel}
        stroke={color}
        strokeWidth={2.5}
        filter={glowId ? `url(#${glowId})` : undefined}
      />
      <Sign x={r * 0.45} angle={angle} color={color} d="M -4 0 H 4 M 0 -4 V 4" />
      <Sign x={-r * 0.45} angle={angle} color={color} d="M -4 0 H 4" />
    </g>
  )
}

function Sign({ x, angle, color, d }) {
  return (
    <g transform={`translate(${x} 0) rotate(${-angle})`}>
      <path d={d} stroke={color} strokeWidth={2.25} strokeLinecap="round" />
    </g>
  )
}
