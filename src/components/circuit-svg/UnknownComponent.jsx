import { BODY_LENGTH, COLORS } from './circuitTheme'

/**
 * <UnknownComponent /> — red de seguridad: si un JSON trae un `type` que el motor
 * todavía no soporta, se dibuja una caja genérica en vez de romper la pantalla.
 */
export default function UnknownComponent({ angle = 0 }) {
  const L = BODY_LENGTH.unknown
  return (
    <g>
      <rect
        x={-L / 2}
        y={-12}
        width={L}
        height={24}
        rx={5}
        fill={COLORS.panel}
        stroke={COLORS.textMuted}
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <text
        transform={`rotate(${-angle})`}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={11}
        fontWeight={700}
        fill={COLORS.textMuted}
      >
        ?
      </text>
    </g>
  )
}
