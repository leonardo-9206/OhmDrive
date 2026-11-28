import { BODY_LENGTH, COLORS } from './circuitTheme'

/**
 * <Resistor /> — zig-zag IEEE en magenta, dibujado en coordenadas locales
 * (eje x = dirección del segmento, centrado en 0). CircuitCanvas lo traslada/rota.
 *
 * Con isSlot=true se dibuja la caja punteada tocable (`resistor_slot`).
 * Si el slot ya tiene un valor insertado (isFilled) se ve el zig-zag dentro de la caja.
 *
 * Estado térmico (US-13):
 * - heat="warning"  → ámbar, resplandor pulsante y ondas de calor (P ≥ 80 % de P_max).
 * - heat="overheat" → rojo plasma parpadeando y humo (P > P_max).
 * intensity (0–1) sube el resplandor neón según la corriente que la atraviesa.
 */
export default function Resistor({
  isSlot = false,
  isFilled = false,
  isFaulted = false,
  heat = null,
  intensity = 0,
  angle = 0,
  glowId,
  strongGlowId,
}) {
  const L = isSlot ? BODY_LENGTH.resistor_slot : BODY_LENGTH.resistor
  const thermal = isFaulted ? 'overheat' : heat
  const color = thermal === 'overheat' ? COLORS.short : thermal === 'warning' ? COLORS.amp : COLORS.ohm

  const zigzag = buildZigzag(isSlot ? L - 16 : L, 7, 6)
  const haloOpacity = thermal ? 0.75 : intensity * 0.7

  const halo =
    haloOpacity > 0.02 && strongGlowId ? (
      <polyline
        points={zigzag}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinejoin="round"
        opacity={haloOpacity}
        filter={`url(#${strongGlowId})`}
        className={thermal === 'warning' ? 'ohm-heat-pulse' : undefined}
      />
    ) : null

  if (isSlot) {
    return (
      <g className={thermal === 'overheat' ? 'ohm-fault-flash' : undefined}>
        {/* fondo para tapar el cable que pasa por debajo */}
        <rect x={-L / 2} y={-15} width={L} height={30} rx={7} fill={COLORS.base} />
        <rect
          className={isFilled ? 'ohm-focus-ring' : 'ohm-slot-pulse ohm-focus-ring'}
          x={-L / 2}
          y={-15}
          width={L}
          height={30}
          rx={7}
          fill={`${COLORS.ohm}14`}
          stroke={color}
          strokeWidth={1.75}
          strokeDasharray="5 4"
          filter={glowId ? `url(#${glowId})` : undefined}
        />
        {isFilled ? (
          <>
            {halo}
            <polyline
              points={zigzag}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        ) : (
          // "+" invariante a la rotación: invita a insertar el componente
          <path
            d="M -6 0 H 6 M 0 -6 V 6"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            className="ohm-slot-pulse"
          />
        )}
        {thermal && <HeatWaves angle={angle} color={color} smoke={thermal === 'overheat'} />}
      </g>
    )
  }

  return (
    <g>
      {halo}
      <g className={thermal === 'overheat' ? 'ohm-fault-flash' : undefined}>
        <polyline
          points={zigzag}
          fill="none"
          stroke={color}
          strokeWidth={2.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={glowId ? `url(#${glowId})` : undefined}
        />
      </g>
      {thermal && <HeatWaves angle={angle} color={color} smoke={thermal === 'overheat'} />}
    </g>
  )
}

/**
 * Ondas de calor que suben (siempre hacia arriba en pantalla, aunque el resistor
 * esté vertical) y, en sobrecarga, nubecitas de humo.
 */
function HeatWaves({ angle, color, smoke }) {
  return (
    <g transform={`rotate(${-angle})`} pointerEvents="none">
      {[-9, 0, 9].map((x, i) => (
        <path
          key={x}
          d={`M ${x} -12 q 3 -4 0 -8 q -3 -4 0 -8`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          className="ohm-heat-rise"
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}
      {smoke &&
        [-6, 6].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={-16}
            r={4}
            fill="#94A3B8"
            opacity={0.5}
            className="ohm-smoke"
            style={{ animationDelay: `${i * 0.6}s` }}
          />
        ))}
    </g>
  )
}

/** Zig-zag de `peaks` picos entre -length/2 y +length/2. */
function buildZigzag(length, amplitude, peaks) {
  const half = length / 2
  const lead = 6
  const step = (length - lead * 2) / (peaks * 2)
  const pts = [[-half, 0], [-half + lead, 0]]
  for (let i = 0; i < peaks * 2; i++) {
    const x = -half + lead + step * (i + 0.5)
    pts.push([x, i % 2 === 0 ? -amplitude : amplitude])
  }
  pts.push([half - lead, 0], [half, 0])
  return pts.map(([x, y]) => `${x.toFixed(2)},${y}`).join(' ')
}
