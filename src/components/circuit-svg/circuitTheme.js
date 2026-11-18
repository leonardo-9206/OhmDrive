/**
 * OhmDrive — Circuit SVG Engine: tokens, geometry helpers & formatters.
 * Colores tomados 1:1 de 03_DESIGN_SYSTEM.md (paleta Cyber-PCB).
 */

export const VIEWBOX = { width: 360, height: 240 }

export const COLORS = {
  grid: '#1E293B',
  trace: '#334155', // cable base (metal apagado)
  traceDim: '#1F2937',
  volt: '#00F0FF', // fuentes de voltaje / nodos energizados
  amp: '#FFB800', // corriente / partículas
  ohm: '#FF2A85', // resistencias e impedancias
  watt: '#00FF66', // éxito / GND / LED encendido
  short: '#FF334B', // cortocircuito / error
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  panel: '#111827',
  base: '#090D16',
}

/** Largo (px) del cuerpo dibujado de cada componente sobre su segmento. */
export const BODY_LENGTH = {
  resistor: 56,
  resistor_slot: 64,
  voltage_source_dc: 44,
  current_source_dc: 44,
  cyber_led: 40,
  cyber_sensor: 52,
  unknown: 52,
}

/** Rango de duración (s) del ciclo de dashoffset: corriente baja → alta. */
const FLOW_SLOW = 2.5
const FLOW_FAST = 0.6
const I_MIN = 0.001 // 1 mA o menos → animación lenta
const I_MAX = 1 // 1 A o más → animación rápida

/**
 * Convierte la corriente (A) en duración de animación (s) usando escala logarítmica,
 * para que 10 mA y 50 mA se vean distintos aunque ambos sean "bajos".
 * Devuelve null si no hay corriente que animar.
 */
export function flowDurationForCurrent(amps) {
  const i = Math.abs(Number(amps))
  if (!Number.isFinite(i) || i <= 0) return null
  const clamped = Math.min(Math.max(i, I_MIN), I_MAX)
  const t = (Math.log10(clamped) - Math.log10(I_MIN)) / (Math.log10(I_MAX) - Math.log10(I_MIN))
  return +(FLOW_SLOW - t * (FLOW_SLOW - FLOW_FAST)).toFixed(2)
}

/** Geometría de un segmento entre dos nodos. */
export function segmentGeometry(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  const ux = length ? dx / length : 1
  const uy = length ? dy / length : 0
  return {
    length,
    ux,
    uy,
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
}

/** Centroide de los nodos: sirve para decidir hacia dónde van las etiquetas. */
export function centroid(nodes) {
  if (!nodes.length) return { x: VIEWBOX.width / 2, y: VIEWBOX.height / 2 }
  const sum = nodes.reduce((acc, n) => ({ x: acc.x + n.x, y: acc.y + n.y }), { x: 0, y: 0 })
  return { x: sum.x / nodes.length, y: sum.y / nodes.length }
}

const SI_PREFIXES = [
  { exp: 9, symbol: 'G' },
  { exp: 6, symbol: 'M' },
  { exp: 3, symbol: 'k' },
  { exp: 0, symbol: '' },
  { exp: -3, symbol: 'm' },
  { exp: -6, symbol: 'µ' },
  { exp: -9, symbol: 'n' },
  { exp: -12, symbol: 'p' },
]

/** 1200, "Ω" → "1.2 kΩ" · 0.01, "A" → "10 mA" · null → "? Ω" */
export function formatValue(value, unit = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return `? ${unit}`.trim()
  const v = Number(value)
  if (v === 0) return `0 ${unit}`.trim()
  const abs = Math.abs(v)
  const prefix = SI_PREFIXES.find((p) => abs >= 10 ** p.exp) || SI_PREFIXES[SI_PREFIXES.length - 1]
  const scaled = v / 10 ** prefix.exp
  const text = Number(scaled.toPrecision(3)).toString()
  return `${text} ${prefix.symbol}${unit}`.trim()
}

/**
 * ¿La etiqueta ya trae el valor escrito? (ej. "R1 = 1 kΩ", "Vs = 10 V", "R1 = ?")
 * En ese caso no repetimos el valor en una segunda línea — y si trae "?",
 * jamás mostramos el valor real porque sería revelar la respuesta.
 */
export function labelAlreadyHasValue(label, unit) {
  if (!label) return false
  if (label.includes('?')) return true
  if (!unit) return false
  const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\d\\s*[pnµumkMG]?\\s*${escaped}`).test(label)
}
