import { COLORS } from './circuitTheme'

/**
 * Anotaciones didácticas para los niveles de Kirchhoff, nodos y mallas (US-08R).
 * Se declaran en `circuit_config_json.annotations` (ver DATA_DICTIONARY.md §4.3).
 */

/** Flecha de corriente de rama dibujada sobre el cable (I₁, I₂, I_T…). */
export function CurrentArrowHead({ x, y, dx, dy }) {
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} pointerEvents="none">
      <path d="M -6 -5.5 L 5 0 L -6 5.5 Z" fill={COLORS.amp} stroke={COLORS.base} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  )
}

/** Anillo cian que resalta el nodo cuyo voltaje se pide (V_A). */
export function NodeVoltageRing({ x, y }) {
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={8} fill={`${COLORS.volt}22`} stroke={COLORS.volt} strokeWidth={1.75} />
      <circle cx={x} cy={y} r={3.5} fill={COLORS.volt} />
    </g>
  )
}

/** Etiqueta en forma de "pill" (V_A = ?). La caja ya viene calculada por el layout. */
export function NodeVoltageTag({ box, text }) {
  return (
    <g pointerEvents="none">
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={box.h / 2} fill={COLORS.base} stroke={COLORS.volt} strokeWidth={1.25} />
      <text
        x={box.x + box.w / 2}
        y={box.y + box.h / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={10}
        fontWeight={700}
        fill={COLORS.volt}
      >
        {text}
      </text>
    </g>
  )
}

/**
 * Corriente de malla: arco circular con punta de flecha y el nombre en el centro.
 * clockwise=true → sentido horario (convención usual del método de mallas).
 */
export function MeshCurrent({ cx, cy, r = 22, label, clockwise = true }) {
  // arco de 300°, con hueco arriba-derecha para la punta
  const startDeg = clockwise ? -60 : -120
  const sweepDeg = 300
  const dir = clockwise ? 1 : -1
  const toRad = (d) => (d * Math.PI) / 180
  const s = toRad(startDeg)
  const e = toRad(startDeg + dir * sweepDeg)
  const sx = cx + r * Math.cos(s)
  const sy = cy + r * Math.sin(s)
  const ex = cx + r * Math.cos(e)
  const ey = cy + r * Math.sin(e)
  // tangente al final del arco
  const tx = -Math.sin(e) * dir
  const ty = Math.cos(e) * dir
  const headAngle = (Math.atan2(ty, tx) * 180) / Math.PI

  return (
    <g pointerEvents="none">
      <path
        d={`M ${sx} ${sy} A ${r} ${r} 0 1 ${clockwise ? 1 : 0} ${ex} ${ey}`}
        fill="none"
        stroke={COLORS.amp}
        strokeWidth={1.75}
        strokeDasharray="4 3"
        opacity={0.9}
      />
      <g transform={`translate(${ex} ${ey}) rotate(${headAngle})`}>
        <path d="M -5 -4.5 L 4 0 L -5 4.5 Z" fill={COLORS.amp} />
      </g>
      <text
        x={cx}
        y={cy + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={11}
        fontWeight={700}
        fill={COLORS.amp}
        stroke={COLORS.base}
        strokeWidth={3}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  )
}
