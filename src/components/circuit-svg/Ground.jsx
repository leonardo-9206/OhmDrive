import { COLORS } from './circuitTheme'

/**
 * <Ground /> — símbolo de tierra (GND) en verde neón, colgando debajo del nodo.
 */
export default function Ground({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-label="Tierra (GND)">
      <line x1={0} y1={0} x2={0} y2={12} stroke={COLORS.watt} strokeWidth={2} />
      <line x1={-10} y1={12} x2={10} y2={12} stroke={COLORS.watt} strokeWidth={2} strokeLinecap="round" />
      <line x1={-6.5} y1={16.5} x2={6.5} y2={16.5} stroke={COLORS.watt} strokeWidth={2} strokeLinecap="round" />
      <line x1={-3} y1={21} x2={3} y2={21} stroke={COLORS.watt} strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}
