import { BODY_LENGTH, COLORS } from './circuitTheme'

/**
 * <Resistor /> — zig-zag IEEE en magenta, dibujado en coordenadas locales
 * (eje x = dirección del segmento, centrado en 0). CircuitCanvas lo traslada/rota.
 *
 * Con isSlot=true se dibuja la caja punteada tocable (`resistor_slot`).
 * Si el slot ya tiene un valor insertado (isFilled) se ve el zig-zag dentro de la caja.
 */
export default function Resistor({ isSlot = false, isFilled = false, isFaulted = false, glowId }) {
  const L = isSlot ? BODY_LENGTH.resistor_slot : BODY_LENGTH.resistor
  const color = isFaulted ? COLORS.short : COLORS.ohm

  const zigzag = buildZigzag(isSlot ? L - 16 : L, 7, 6)

  if (isSlot) {
    return (
      <g>
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
          <polyline
            points={zigzag}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
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
      </g>
    )
  }

  return (
    <g className={isFaulted ? 'ohm-fault-flash' : undefined}>
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
