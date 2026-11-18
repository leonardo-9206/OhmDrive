import { COLORS } from './circuitTheme'

/**
 * <Wire /> — traza de cobre entre dos puntos.
 * Base gris metálico; si el circuito está energizado se superpone la línea ámbar
 * punteada cuyo stroke-dashoffset avanza de `from` hacia `to` (sentido convencional).
 *
 * @param {{x:number,y:number}} from
 * @param {{x:number,y:number}} to
 * @param {boolean} isEnergized
 * @param {number|null} flowDuration  segundos por ciclo (ver flowDurationForCurrent)
 * @param {boolean} isShort           destello rojo de cortocircuito
 */
export default function Wire({ from, to, isEnergized = false, flowDuration = null, isShort = false }) {
  const showFlow = isEnergized && !isShort && flowDuration
  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isShort ? COLORS.short : COLORS.trace}
        strokeWidth={4}
        strokeLinecap="round"
        className={isShort ? 'ohm-fault-flash' : undefined}
      />
      {showFlow && (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={COLORS.amp}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="6 10"
          className="ohm-flow"
          style={{ animationDuration: `${flowDuration}s` }}
        />
      )}
    </g>
  )
}
