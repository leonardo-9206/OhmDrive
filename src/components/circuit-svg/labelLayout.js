/**
 * OhmDrive — colocación automática de etiquetas del motor SVG (US-08R).
 *
 * Problema: en paralelos, mixtos, mallas y componentes en diagonal las etiquetas
 * fijas ("arriba" / "hacia el centro") se enciman entre sí y sobre los componentes.
 *
 * Solución: para cada etiqueta se generan posiciones candidatas alrededor de su
 * ancla (a ambos lados del componente, a varias distancias y desplazadas a lo largo
 * del segmento) y se elige la de menor "costo": choques con otras etiquetas,
 * cuerpos de componentes, cables, nodos y bordes del viewBox. Es un algoritmo
 * greedy: lo que se coloca primero tiene prioridad.
 */
import { VIEWBOX } from './circuitTheme'

/** Ancho promedio por carácter (px) — estimación suficiente para evitar choques. */
const CHAR_WIDTH = {
  sans10: 5.6,
  mono10: 6.05,
  mono9: 5.45,
  sans11: 6.2,
}
export const LINE_HEIGHT = 12

export function textWidth(text, kind = 'sans10') {
  return [...String(text)].length * (CHAR_WIDTH[kind] ?? 6)
}

/** Medidas de un bloque de varias líneas: [{ text, kind }]. */
export function measureBlock(lines, padding = 1) {
  const w = Math.max(...lines.map((l) => textWidth(l.text, l.kind))) + padding * 2
  const h = lines.length * LINE_HEIGHT + padding
  return { w, h }
}

function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/** Largo aproximado de un segmento que pasa por dentro de una caja (muestreo). */
function segmentInsideLength(seg, box) {
  const samples = 16
  const len = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y)
  let inside = 0
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const x = seg.a.x + (seg.b.x - seg.a.x) * t
    const y = seg.a.y + (seg.b.y - seg.a.y) * t
    if (x > box.x - 2 && x < box.x + box.w + 2 && y > box.y - 2 && y < box.y + box.h + 2) inside++
  }
  return (inside / (samples + 1)) * len
}

function outOfBoundsArea(box, margin = 3) {
  const inner = { x: margin, y: margin, w: VIEWBOX.width - margin * 2, h: VIEWBOX.height - margin * 2 }
  return box.w * box.h - overlapArea(box, inner)
}

/**
 * Coloca la caja (w × h) pegada al punto (px, py) del lado indicado por (dx, dy).
 * Devuelve la caja y cómo alinear el texto dentro.
 */
export function attachBox(px, py, dx, dy, w, h) {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax > ay * 1.3) {
    return { x: dx > 0 ? px : px - w, y: py - h / 2, w, h, anchor: dx > 0 ? 'start' : 'end' }
  }
  if (ay > ax * 1.3) {
    return { x: px - w / 2, y: dy > 0 ? py : py - h, w, h, anchor: 'middle' }
  }
  return {
    x: dx > 0 ? px : px - w,
    y: dy > 0 ? py : py - h,
    w,
    h,
    anchor: dx > 0 ? 'start' : 'end',
  }
}

/**
 * Motor de colocación. Uso:
 *   const layout = createLabelLayout({ obstacles, segments })
 *   const box = layout.place(candidates, w, h)  // candidates: [{x,y,dx,dy,penalty}]
 */
export function createLabelLayout({ obstacles = [], segments = [] }) {
  const placed = []

  function cost(box) {
    let c = 0
    for (const p of placed) c += overlapArea(box, p) * 6
    for (const o of obstacles) c += overlapArea(box, o) * (o.weight ?? 4)
    for (const s of segments) c += segmentInsideLength(s, box) * 3
    c += outOfBoundsArea(box) * 8
    return c
  }

  return {
    place(candidates, w, h) {
      let best = null
      for (const cand of candidates) {
        const box = attachBox(cand.x, cand.y, cand.dx, cand.dy, w, h)
        const score = cost(box) + (cand.penalty ?? 0)
        if (!best || score < best.score) best = { ...box, score }
      }
      if (best) placed.push(best)
      return best
    },
    /** Reserva espacio para algo que no se mueve (ej. etiqueta de corriente de malla). */
    reserve(box) {
      placed.push(box)
    },
  }
}

/** Caja que encierra un cuerpo rotado (largo `along` sobre el segmento, ancho `across`). */
export function rotatedBodyBox(mid, ux, uy, along, across) {
  const w = Math.abs(ux) * along + Math.abs(uy) * across
  const h = Math.abs(uy) * along + Math.abs(ux) * across
  return { x: mid.x - w / 2, y: mid.y - h / 2, w, h }
}

/** Candidatas a ambos lados de un segmento (normal ±), varias distancias y corrimientos. */
export function sideCandidates({ mid, ux, uy, length }, halfAcross, { center, shifts = [0, 0.22, -0.22, 0.36, -0.36] } = {}) {
  const normals = [
    { x: -uy, y: ux },
    { x: uy, y: -ux },
  ]
  const out = []
  for (const n of normals) {
    // leve preferencia por el lado "de afuera" del circuito en lazos simples
    const outward = center ? Math.sign((mid.x - center.x) * n.x + (mid.y - center.y) * n.y) : 0
    for (const gap of [5, 14, 26]) {
      for (const s of shifts) {
        const t = s * length
        out.push({
          x: mid.x + n.x * (halfAcross + gap) + ux * t,
          y: mid.y + n.y * (halfAcross + gap) + uy * t,
          dx: n.x,
          dy: n.y,
          penalty: gap * 0.4 + Math.abs(s) * 30 + (outward < 0 ? 6 : 0),
        })
      }
    }
  }
  return out
}

/** Candidatas alrededor de un punto (8 direcciones), prefiriendo alejarse del centro. */
export function pointCandidates(p, distance, center) {
  const dirs = [
    [1, 0], [-1, 0], [0, -1], [0, 1],
    [0.7, -0.7], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7],
  ]
  const vx = center ? p.x - center.x : 0
  const vy = center ? p.y - center.y : 0
  const vlen = Math.hypot(vx, vy) || 1
  return dirs.map(([dx, dy]) => ({
    x: p.x + dx * distance,
    y: p.y + dy * distance,
    dx,
    dy,
    penalty: center ? (1 - (dx * vx + dy * vy) / vlen) * 8 : 0,
  }))
}
