import { BODY_LENGTH, COLORS, formatValue } from './circuitTheme'

/**
 * <CyberSensor /> — tipo `cyber_sensor`: sensor/amperímetro en serie con display digital.
 * En Sector 1 Joao lo usa con unit "A" (ej. "Sensor de Flujo", "[DMM: 10.0 mA]").
 *
 * - value === null → muestra "? A" (la lectura es la incógnita del reto).
 * - Circuito sin energizar → "---".
 * El display se contra-rota para que siempre se lea derecho.
 */
export default function CyberSensor({ value, unit = 'A', isEnergized = false, angle = 0, glowId, isFaulted = false }) {
  const L = BODY_LENGTH.cyber_sensor
  const color = isFaulted ? COLORS.short : unitColor(unit)
  const reading = !isEnergized ? '---' : formatValue(value, unit)
  const vertical = Math.abs(Math.abs(angle) - 90) < 1

  // En vertical el cuerpo es "alto": dibujamos la caja en coordenadas de pantalla.
  const w = vertical ? 30 : L
  const h = vertical ? L : 30

  return (
    <g transform={`rotate(${-angle})`} className={isFaulted ? 'ohm-fault-flash' : undefined}>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={6}
        fill={COLORS.panel}
        stroke={color}
        strokeWidth={2}
        filter={glowId ? `url(#${glowId})` : undefined}
      />
      <rect x={-w / 2 + 4} y={-8} width={w - 8} height={16} rx={3} fill={COLORS.base} />
      <text
        x={0}
        y={0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={vertical ? 7 : 9}
        fontWeight={700}
        fill={color}
      >
        {reading}
      </text>
      {/* indicador de estado */}
      <circle cx={w / 2 - 5} cy={-h / 2 + 5} r={1.8} fill={isEnergized ? COLORS.watt : COLORS.trace} />
    </g>
  )
}

function unitColor(unit) {
  if (unit === 'V') return COLORS.volt
  if (unit === 'Ω') return COLORS.ohm
  if (unit === 'W') return COLORS.watt
  return COLORS.amp // A y por defecto: corriente
}
