import { BODY_LENGTH, COLORS } from './circuitTheme'

/**
 * <CyberLed /> — tipo `cyber_led` (usado por Joao en Sector 1 como "Núcleo Óptico",
 * "Diodo Láser", "Reactor Core"...). Símbolo de diodo apuntando de `from` (ánodo)
 * a `to` (cátodo) con dos flechas de emisión.
 *
 * - Apagado: trazo gris, sin relleno.
 * - Encendido (circuito energizado): relleno verde neón + halo pulsante.
 * - Falla (sobrecarga): rojo plasma parpadeando.
 */
export default function CyberLed({ isLit = false, isFaulted = false, intensity = 1, glowId, strongGlowId }) {
  const L = BODY_LENGTH.cyber_led
  const half = L / 2
  const color = isFaulted ? COLORS.short : isLit ? COLORS.watt : COLORS.trace
  const tri = `${-half + 8},-10 ${-half + 8},10 ${half - 10},0`
  // brillo proporcional a la corriente (US-13): con poca corriente apenas se enciende
  const glow = Math.min(Math.max(intensity, 0), 1)
  const haloR = 10 + glow * 10
  const haloOpacity = 0.15 + glow * 0.55
  const fillOpacity = 0.35 + glow * 0.6

  return (
    <g className={isFaulted ? 'ohm-fault-flash' : undefined}>
      {/* tapa el cable debajo del símbolo */}
      <rect x={-half} y={-13} width={L} height={26} fill={COLORS.base} />
      {isLit && !isFaulted && (
        <circle
          r={haloR}
          fill={COLORS.watt}
          opacity={haloOpacity}
          className="ohm-led-halo"
          filter={strongGlowId ? `url(#${strongGlowId})` : undefined}
        />
      )}
      <line x1={-half} y1={0} x2={-half + 8} y2={0} stroke={color} strokeWidth={2.5} />
      <line x1={half - 10} y1={0} x2={half} y2={0} stroke={color} strokeWidth={2.5} />
      <polygon
        points={tri}
        fill={isLit || isFaulted ? color : 'none'}
        fillOpacity={isFaulted ? 0.85 : isLit ? fillOpacity : 0}
        stroke={color}
        strokeWidth={2.25}
        strokeLinejoin="round"
        filter={(isLit || isFaulted) && glowId ? `url(#${glowId})` : undefined}
      />
      <line x1={half - 10} y1={-11} x2={half - 10} y2={11} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {/* flechas de emisión (hacia el lado -y local) */}
      <EmitArrow x={-3} color={color} />
      <EmitArrow x={5} color={color} />
    </g>
  )
}

function EmitArrow({ x, color }) {
  return (
    <path
      d={`M ${x} -13 l 6 -8 m -4.5 0.5 l 4.5 -0.5 l -0.5 4.5`}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}
