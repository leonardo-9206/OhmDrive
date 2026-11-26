import { useId, useMemo } from 'react'
import Wire from './Wire'
import Resistor from './Resistor'
import VoltageSource from './VoltageSource'
import CurrentSource from './CurrentSource'
import CyberLed from './CyberLed'
import CyberSensor from './CyberSensor'
import Ground from './Ground'
import UnknownComponent from './UnknownComponent'
import { CurrentArrowHead, MeshCurrent, NodeVoltageRing, NodeVoltageTag } from './Annotations'
import {
  BODY_LENGTH,
  COLORS,
  VIEWBOX,
  centroid,
  flowDurationForCurrent,
  currentIntensity,
  formatValue,
  labelAlreadyHasValue,
  segmentGeometry,
} from './circuitTheme'
import {
  LINE_HEIGHT,
  createLabelLayout,
  measureBlock,
  pointCandidates,
  rotatedBodyBox,
  sideCandidates,
} from './labelLayout'
import './circuitCanvas.css'

/** Tipos con cuerpo dibujado sobre el segmento (todo lo demás = cable). */
const BODY_TYPES = new Set([
  'resistor',
  'resistor_slot',
  'voltage_source_dc',
  'current_source_dc',
  'cyber_led',
  'cyber_sensor',
])
const TYPE_COLORS = {
  resistor: COLORS.ohm,
  resistor_slot: COLORS.ohm,
  voltage_source_dc: COLORS.volt,
  current_source_dc: COLORS.amp,
  cyber_led: COLORS.watt,
  cyber_sensor: COLORS.amp,
}
/** Medio ancho transversal (px) de cada cuerpo: sirve para separar las etiquetas. */
const HALF_ACROSS = {
  resistor: 9,
  resistor_slot: 15,
  voltage_source_dc: 22,
  current_source_dc: 22,
  cyber_led: 16,
  cyber_sensor: 16,
  unknown: 12,
}

const warnedTypes = new Set()

/**
 * <CircuitCanvas /> — Motor SVG de circuitos de OhmDrive (US-04 + US-08R).
 *
 * Lee un `circuit_config_json` (DATA_DICTIONARY.md §4) y dibuja nodos, cables,
 * fuentes, resistencias, slots, LEDs cyber y sensores con flujo de electrones animado.
 *
 * US-08R agrega (todo opcional y compatible con los JSON existentes):
 * - `component.current_amps`: corriente propia de esa rama → velocidad del flujo por rama;
 *   negativa = la corriente va de `to` hacia `from`; 0 = rama sin corriente.
 * - `config.annotations`: flechas de corriente (I₁, I₂…), voltaje de nodo (V_A) y
 *   corrientes de malla.
 * - Colocación automática de etiquetas para que no se encimen en paralelos, mallas
 *   y componentes en diagonal.
 *
 * @param {object}   config            circuit_config_json del reto
 * @param {boolean}  [isEnergized]     sobreescribe config.is_energized_initially
 * @param {number}   [currentAmps]     sobreescribe config.current_speed_amps (velocidad global)
 * @param {object}   [fault]           { type: 'short' | 'overheat' | 'warning', componentId?: string }
 *                                     'warning' = P ≥ 80 % de P_max (ámbar + ondas de calor).
 *                                     Sin componentId, 'overheat'/'warning' se aplican al componente
 *                                     con `max_watts` (o al primer slot / resistor / LED).
 * @param {object}   [slotValues]      { [slotComponentId]: number } valor insertado en un slot
 * @param {Function} [onComponentClick] (component) => void — hace tocables los componentes
 * @param {boolean}  [showAnnotations=true] oculta flechas/V_A/mallas si se pasa false
 * @param {string}   [className]
 * @param {string}   [ariaLabel]
 */
export default function CircuitCanvas({
  config,
  isEnergized,
  currentAmps,
  fault = null,
  slotValues = {},
  onComponentClick,
  showAnnotations = true,
  className = '',
  ariaLabel,
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ids = {
    grid: `ohm-grid-${uid}`,
    glow: `ohm-glow-${uid}`,
    strongGlow: `ohm-glow-strong-${uid}`,
  }

  const nodes = config?.nodes ?? []
  const components = config?.components ?? []
  const annotations = showAnnotations ? config?.annotations ?? [] : []
  const energized = isEnergized ?? Boolean(config?.is_energized_initially)
  const globalAmps = currentAmps ?? config?.current_speed_amps ?? 0
  const isShort = fault?.type === 'short'
  // US-13: 'overheat' / 'warning' sin componentId → se elige solo el componente que se calienta
  const thermalTargetId = fault?.type === 'overheat' || fault?.type === 'warning' ? resolveThermalTarget(fault, components) : null
  const thermalFor = (id) => (id && id === thermalTargetId ? fault.type : null)

  const layout = useMemo(
    () => buildLayout(nodes, components, annotations, slotValues, thermalTargetId),
    [nodes, components, annotations, slotValues, thermalTargetId],
  )

  /** Velocidad, sentido y brillo del flujo de una rama. */
  function flowFor(component) {
    if (!energized || isShort) return { duration: null, reversed: false, intensity: 0 }
    const own = component.current_amps
    const amps = own === undefined || own === null ? globalAmps : own
    return {
      duration: flowDurationForCurrent(amps),
      reversed: Number(amps) < 0,
      intensity: currentIntensity(amps),
    }
  }

  const summary =
    ariaLabel ??
    `Circuito con ${components.filter((c) => c.type !== 'wire').length} componentes: ` +
      components
        .filter((c) => c.type !== 'wire')
        .map((c) => c.label || c.id)
        .join(', ')

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={summary}
      className={`block h-auto w-full select-none ${className}`}
    >
      <defs>
        <pattern id={ids.grid} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill={COLORS.grid} />
        </pattern>
        <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={ids.strongGlow} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width={VIEWBOX.width} height={VIEWBOX.height} fill={COLORS.base} />
      <rect width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${ids.grid})`} />

      {/* 0. Corrientes de malla (debajo de todo, son una guía) */}
      {layout.meshes.map((m, i) => (
        <MeshCurrent key={`mesh-${i}`} {...m} />
      ))}

      {/* 1. Cables y terminales */}
      {layout.items.map(({ component, a, b, p1, p2 }) => {
        const { duration, reversed, intensity } = flowFor(component)
        const seg = (from, to, key) => (
          <Wire
            key={key}
            from={reversed ? to : from}
            to={reversed ? from : to}
            isEnergized={energized}
            flowDuration={duration}
            isShort={isShort}
            intensity={intensity}
          />
        )
        if (!p1) return seg(a, b, `w-${component.id}`)
        return (
          <g key={`w-${component.id}`}>
            {seg(a, p1, 'l1')}
            {seg(p2, b, 'l2')}
          </g>
        )
      })}

      {/* 2. Cuerpos de componentes */}
      {layout.items
        .filter((it) => it.bodyLength)
        .map((it) => {
          const { component, geom } = it
          const heat = thermalFor(component.id)
          const flow = flowFor(component)
          const tappable = typeof onComponentClick === 'function'
          const body = renderBody(component, {
            angle: geom.angle,
            energized: energized && !isShort && flow.duration !== null,
            intensity: flow.intensity,
            heat,
            isFaulted: heat === 'overheat',
            isFilled: slotValues[component.id] !== undefined && slotValues[component.id] !== null,
            ids,
          })
          return (
            <g
              key={`b-${component.id}`}
              transform={`translate(${geom.mid.x} ${geom.mid.y}) rotate(${geom.angle})`}
              data-component-id={component.id}
              {...(tappable
                ? {
                    className: 'ohm-tappable',
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': component.label || component.id,
                    onClick: () => onComponentClick(component),
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onComponentClick(component)
                      }
                    },
                  }
                : {})}
            >
              {/* zona táctil generosa (≥ 44px) para dedos en celular */}
              {tappable && <rect x={-30} y={-22} width={60} height={44} fill="transparent" />}
              {body}
            </g>
          )
        })}

      {/* 3. Nodos, tierra, V_A y chispas */}
      {layout.usedNodes.map((n) => (
        <g key={`n-${n.id}`}>
          {n.is_ground && <Ground x={n.x} y={n.y} />}
          {layout.voltageNodes.has(n.id) ? (
            <NodeVoltageRing x={n.x} y={n.y} />
          ) : (
            <circle r={3.5} cx={n.x} cy={n.y} fill={energized && !isShort ? COLORS.volt : COLORS.trace} />
          )}
          {isShort && (!fault.componentId || layout.faultNodes(fault.componentId).has(n.id)) && (
            <Spark x={n.x} y={n.y} />
          )}
        </g>
      ))}

      {/* 4. Flechas de corriente */}
      {layout.arrows.map((a, i) => (
        <CurrentArrowHead key={`arr-${i}`} {...a} />
      ))}

      {/* 5. Etiquetas (siempre derechas, encima de todo) */}
      {layout.tags.map((t, i) => (
        <NodeVoltageTag key={`tag-${i}`} box={t.box} text={t.text} />
      ))}
      {layout.labels.map((lbl, i) => (
        <TextBlock key={`lbl-${i}`} {...lbl} thermal={thermalFor(lbl.componentId)} />
      ))}
    </svg>
  )
}

const FONTS = {
  sans10: { family: "'Inter', 'Plus Jakarta Sans', sans-serif", size: 10, weight: 600 },
  mono10: { family: "'JetBrains Mono', monospace", size: 10, weight: 700 },
  mono9: { family: "'JetBrains Mono', monospace", size: 9, weight: 700 },
}

function TextBlock({ box, lines, thermal }) {
  const thermalColor = thermal === 'overheat' ? COLORS.short : thermal === 'warning' ? COLORS.amp : null
  const x = box.anchor === 'start' ? box.x + 1 : box.anchor === 'end' ? box.x + box.w - 1 : box.x + box.w / 2
  return (
    <g pointerEvents="none">
      {lines.map((ln, i) => {
        const f = FONTS[ln.kind] ?? FONTS.sans10
        return (
          <text
            key={i}
            x={x}
            y={box.y + LINE_HEIGHT * (i + 1) - 3}
            textAnchor={box.anchor}
            fontFamily={f.family}
            fontSize={f.size}
            fontWeight={f.weight}
            fill={thermalColor && ln.colored ? thermalColor : ln.color}
            stroke={COLORS.base}
            strokeWidth={3}
            paintOrder="stroke"
          >
            {ln.text}
          </text>
        )
      })}
    </g>
  )
}

/**
 * Calcula geometría, flechas y la posición de cada etiqueta.
 * Orden de prioridad para colocar etiquetas: componentes → V_A → flechas → nodos.
 */
function buildLayout(nodes, components, annotations, slotValues, thermalTargetId = null) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const used = new Set()
  const items = []

  for (const component of components) {
    const a = byId[component.from]
    const b = byId[component.to]
    if (!a || !b) {
      console.warn(`[CircuitCanvas] "${component.id}" apunta a un nodo inexistente (${component.from} → ${component.to}).`)
      continue
    }
    used.add(a.id)
    used.add(b.id)
    const isWire = component.type === 'wire'
    if (!isWire && !BODY_TYPES.has(component.type) && !warnedTypes.has(component.type)) {
      warnedTypes.add(component.type)
      console.warn(`[CircuitCanvas] Tipo de componente no soportado: "${component.type}". Se dibuja como caja genérica.`)
    }
    const geom = segmentGeometry(a, b)
    const bodyLength = isWire ? 0 : Math.min(BODY_LENGTH[component.type] ?? BODY_LENGTH.unknown, geom.length)
    const item = { component, a, b, geom, bodyLength }
    if (bodyLength) {
      const gap = bodyLength / 2
      item.p1 = { x: geom.mid.x - geom.ux * gap, y: geom.mid.y - geom.uy * gap }
      item.p2 = { x: geom.mid.x + geom.ux * gap, y: geom.mid.y + geom.uy * gap }
      item.halfAcross = HALF_ACROSS[component.type] ?? HALF_ACROSS.unknown
    }
    items.push(item)
  }

  const usedNodes = nodes.filter((n) => used.has(n.id))
  const center = centroid(usedNodes)
  const itemById = Object.fromEntries(items.map((it) => [it.component.id, it]))

  // ── Anotaciones ────────────────────────────────────────────────
  const arrows = []
  const arrowLabels = []
  const voltageAnns = []
  const meshes = []
  for (const ann of annotations) {
    if (ann.type === 'current_arrow') {
      const it = itemById[ann.target]
      if (!it) continue
      const arrow = arrowPosition(it, ann)
      arrows.push(arrow)
      if (ann.label) arrowLabels.push({ arrow, text: ann.label })
    } else if (ann.type === 'node_voltage') {
      if (byId[ann.node]) voltageAnns.push({ node: byId[ann.node], text: ann.label ?? `V_${ann.node}` })
    } else if (ann.type === 'mesh_current') {
      const c = ann.center ?? (ann.nodes ? centroid(ann.nodes.map((id) => byId[id]).filter(Boolean)) : null)
      if (c) meshes.push({ cx: c.x, cy: c.y, r: ann.radius ?? 22, label: ann.label, clockwise: ann.clockwise !== false })
    }
  }
  const voltageNodes = new Set(voltageAnns.map((v) => v.node.id))

  // ── Obstáculos para el layout de etiquetas ─────────────────────
  const obstacles = []
  for (const it of items) {
    if (it.bodyLength) {
      obstacles.push({ ...rotatedBodyBox(it.geom.mid, it.geom.ux, it.geom.uy, it.bodyLength, it.halfAcross * 2), weight: 5 })
      if (it.component.id === thermalTargetId) {
        // ondas de calor / humo: suben ~30px por encima del centro del componente
        obstacles.push({ x: it.geom.mid.x - 14, y: it.geom.mid.y - 34, w: 28, h: 26, weight: 6 })
      }
    }
  }
  for (const n of usedNodes) {
    obstacles.push({ x: n.x - 6, y: n.y - 6, w: 12, h: 12, weight: 5 })
    if (n.is_ground) obstacles.push({ x: n.x - 11, y: n.y, w: 22, h: 23, weight: 5 })
  }
  for (const a of arrows) obstacles.push({ x: a.x - 7, y: a.y - 7, w: 14, h: 14, weight: 5 })
  for (const m of meshes) obstacles.push({ x: m.cx - m.r - 2, y: m.cy - m.r - 2, w: m.r * 2 + 4, h: m.r * 2 + 4, weight: 1.5 })
  const segments = items.map((it) => ({ a: it.a, b: it.b }))

  const placer = createLabelLayout({ obstacles, segments })
  for (const m of meshes) {
    const w = m.label ? m.label.length * 6.8 + 4 : 0
    if (w) placer.reserve({ x: m.cx - w / 2, y: m.cy - 8, w, h: 16 })
  }

  const labels = []

  // 1) etiquetas de componentes
  for (const it of items) {
    if (!it.bodyLength) continue
    const lines = componentLabelLines(it.component, slotValues[it.component.id])
    if (!lines.length) continue
    const { w, h } = measureBlock(lines)
    const box = placer.place(sideCandidates(it.geom, it.halfAcross, { center }), w, h)
    labels.push({ box, lines, componentId: it.component.id })
  }

  // 2) V_A
  const tags = []
  for (const v of voltageAnns) {
    const w = v.text.length * 6.1 + 12
    const h = 15
    const box = placer.place(pointCandidates(v.node, 11, center), w, h)
    tags.push({ box, text: v.text })
  }

  // 3) etiquetas de flechas de corriente
  for (const al of arrowLabels) {
    const lines = [{ text: al.text, kind: 'mono10', color: COLORS.amp }]
    const { w, h } = measureBlock(lines)
    const n1 = { x: -al.arrow.dy, y: al.arrow.dx }
    const cands = []
    for (const sgn of [1, -1]) {
      for (const gap of [7, 13]) {
        for (const along of [0, 8, -8]) {
          cands.push({
            x: al.arrow.x + n1.x * sgn * gap + al.arrow.dx * along,
            y: al.arrow.y + n1.y * sgn * gap + al.arrow.dy * along,
            dx: n1.x * sgn,
            dy: n1.y * sgn,
            penalty: gap * 0.3 + Math.abs(along) * 0.5,
          })
        }
      }
    }
    labels.push({ box: placer.place(cands, w, h), lines })
  }

  // 4) etiquetas de nodos (A, B, +12V…) — la tierra ya tiene su símbolo
  for (const n of usedNodes) {
    if (n.is_ground || !n.label || voltageNodes.has(n.id)) continue
    const lines = [{ text: n.label, kind: 'mono9', color: COLORS.textMuted }]
    const { w, h } = measureBlock(lines)
    labels.push({ box: placer.place(pointCandidates(n, 7, center), w, h), lines })
  }

  return {
    items,
    usedNodes,
    labels,
    tags,
    arrows,
    meshes,
    voltageNodes,
    faultNodes: (componentId) => {
      const c = components.find((x) => x.id === componentId)
      return new Set(c ? [c.from, c.to] : [])
    },
  }
}

/**
 * Dónde va la flecha: sobre la terminal de entrada del componente (o a la mitad del
 * cable). Sentido: from→to, invertido con `reverse: true` o si la rama trae
 * current_amps negativo.
 */
function arrowPosition(it, ann) {
  const { geom, a, p1, p2, b, component } = it
  const negative = Number(component.current_amps) < 0
  const reverse = Boolean(ann.reverse) !== negative
  let x
  let y
  if (!p1) {
    x = geom.mid.x
    y = geom.mid.y
  } else {
    const lead1 = Math.hypot(p1.x - a.x, p1.y - a.y)
    const lead2 = Math.hypot(b.x - p2.x, b.y - p2.y)
    const useFirst = (lead1 >= 16 && !reverse) || lead2 < 16
    const [s, e] = useFirst ? [a, p1] : [p2, b]
    x = (s.x + e.x) / 2
    y = (s.y + e.y) / 2
  }
  const sign = reverse ? -1 : 1
  return { x, y, dx: geom.ux * sign, dy: geom.uy * sign }
}

function componentLabelLines(component, slotValue) {
  const color = TYPE_COLORS[component.type] ?? COLORS.textMuted
  const name = component.label || component.id
  let valueText = null
  if (component.type === 'resistor_slot') {
    valueText = slotValue !== undefined && slotValue !== null ? formatValue(slotValue, component.unit) : null
  } else if (component.type === 'cyber_led' || component.type === 'cyber_sensor') {
    valueText = null // el LED se explica solo y el sensor ya muestra su display
  } else if (!BODY_TYPES.has(component.type)) {
    valueText = component.type
  } else if (!labelAlreadyHasValue(name, component.unit)) {
    valueText = component.value === null || component.value === undefined ? null : formatValue(component.value, component.unit)
  }
  const lines = [{ text: name, kind: 'sans10', color: COLORS.text }]
  if (valueText) lines.push({ text: valueText, kind: 'mono10', color, colored: true })
  return lines
}

/**
 * Componente que se calienta cuando la falla térmica no dice cuál es:
 * el que declara `max_watts` → el primer slot → el primer resistor → el primer LED.
 */
function resolveThermalTarget(fault, components) {
  if (fault.componentId) return fault.componentId
  const pick =
    components.find((c) => c.max_watts !== undefined && c.max_watts !== null) ||
    components.find((c) => c.type === 'resistor_slot') ||
    components.find((c) => c.type === 'resistor') ||
    components.find((c) => c.type === 'cyber_led')
  return pick?.id ?? null
}

function renderBody(component, { angle, energized, intensity, heat, isFaulted, isFilled, ids }) {
  const resistorProps = {
    glowId: ids.glow,
    strongGlowId: ids.strongGlow,
    heat,
    intensity: energized ? intensity : 0,
    angle,
  }
  switch (component.type) {
    case 'resistor':
      return <Resistor {...resistorProps} />
    case 'resistor_slot':
      return <Resistor isSlot isFilled={isFilled} {...resistorProps} />
    case 'voltage_source_dc':
      return <VoltageSource angle={angle} glowId={ids.glow} isFaulted={isFaulted} />
    case 'current_source_dc':
      return <CurrentSource glowId={ids.glow} isFaulted={isFaulted} />
    case 'cyber_led':
      return (
        <CyberLed
          isLit={energized}
          intensity={intensity}
          isFaulted={isFaulted}
          glowId={ids.glow}
          strongGlowId={ids.strongGlow}
        />
      )
    case 'cyber_sensor':
      return (
        <CyberSensor
          value={component.value}
          unit={component.unit}
          isEnergized={energized}
          angle={angle}
          glowId={ids.glow}
          isFaulted={isFaulted}
        />
      )
    default:
      return <UnknownComponent angle={angle} />
  }
}

function Spark({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <circle r={9} fill="none" stroke={COLORS.short} strokeWidth={2} className="ohm-spark" />
      <path
        d="M -7 -7 L -2 -2 M 7 -7 L 2 -2 M -7 7 L -2 2 M 7 7 L 2 2"
        stroke={COLORS.amp}
        strokeWidth={1.5}
        strokeLinecap="round"
        className="ohm-fault-flash"
      />
    </g>
  )
}
