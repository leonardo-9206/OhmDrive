import { useId, useMemo } from 'react'
import Wire from './Wire'
import Resistor from './Resistor'
import VoltageSource from './VoltageSource'
import CurrentSource from './CurrentSource'
import CyberLed from './CyberLed'
import CyberSensor from './CyberSensor'
import Ground from './Ground'
import UnknownComponent from './UnknownComponent'
import {
  BODY_LENGTH,
  COLORS,
  VIEWBOX,
  centroid,
  flowDurationForCurrent,
  formatValue,
  labelAlreadyHasValue,
  segmentGeometry,
} from './circuitTheme'
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

const warnedTypes = new Set()

/**
 * <CircuitCanvas /> — Motor SVG de circuitos de OhmDrive (US-04).
 *
 * Lee un `circuit_config_json` (02_DATA_DICTIONARY.md §3) y dibuja nodos, cables,
 * fuentes, resistencias, slots, LEDs cyber y sensores con flujo de electrones animado.
 *
 * @param {object}   config            circuit_config_json del reto
 * @param {boolean}  [isEnergized]     sobreescribe config.is_energized_initially
 * @param {number}   [currentAmps]     sobreescribe config.current_speed_amps (velocidad del flujo)
 * @param {object}   [fault]           { type: 'short' | 'overheat', componentId?: string }
 * @param {object}   [slotValues]      { [slotComponentId]: number } valor insertado en un slot
 * @param {Function} [onComponentClick] (component) => void — hace tocables los componentes
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
  const energized = isEnergized ?? Boolean(config?.is_energized_initially)
  const amps = currentAmps ?? config?.current_speed_amps ?? 0
  const isShort = fault?.type === 'short'
  const flowDuration = energized && !isShort ? flowDurationForCurrent(amps) : null

  const layout = useMemo(() => buildLayout(nodes, components), [nodes, components])

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

      {/* 1. Cables y terminales (debajo de todo) */}
      {layout.items.map(({ component, a, b, geom, bodyLength }) => {
        if (!bodyLength) {
          return (
            <Wire
              key={`w-${component.id}`}
              from={a}
              to={b}
              isEnergized={energized}
              flowDuration={flowDuration}
              isShort={isShort}
            />
          )
        }
        const gap = Math.min(bodyLength, geom.length) / 2
        const p1 = { x: geom.mid.x - geom.ux * gap, y: geom.mid.y - geom.uy * gap }
        const p2 = { x: geom.mid.x + geom.ux * gap, y: geom.mid.y + geom.uy * gap }
        return (
          <g key={`w-${component.id}`}>
            <Wire from={a} to={p1} isEnergized={energized} flowDuration={flowDuration} isShort={isShort} />
            <Wire from={p2} to={b} isEnergized={energized} flowDuration={flowDuration} isShort={isShort} />
          </g>
        )
      })}

      {/* 2. Cuerpos de componentes */}
      {layout.items
        .filter((it) => it.bodyLength)
        .map((it) => {
          const { component, geom } = it
          const isFaulted = fault?.type === 'overheat' && fault.componentId === component.id
          const tappable = typeof onComponentClick === 'function'
          const body = renderBody(component, {
            angle: geom.angle,
            energized,
            isFaulted,
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

      {/* 3. Nodos, tierra y chispas */}
      {layout.usedNodes.map((n) => (
        <g key={`n-${n.id}`}>
          {n.is_ground && <Ground x={n.x} y={n.y} />}
          <circle r={3.5} cx={n.x} cy={n.y} fill={energized && !isShort ? COLORS.volt : COLORS.trace} />
          {isShort && (!fault.componentId || layout.faultNodes(fault.componentId).has(n.id)) && (
            <Spark x={n.x} y={n.y} />
          )}
        </g>
      ))}

      {/* 4. Etiquetas (siempre derechas, encima de todo) */}
      {layout.usedNodes
        .filter((n) => !n.is_ground && n.label)
        .map((n) => (
          <NodeLabel key={`nl-${n.id}`} node={n} center={layout.center} />
        ))}
      {layout.items
        .filter((it) => it.bodyLength)
        .map((it) => (
          <ComponentLabel
            key={`cl-${it.component.id}`}
            item={it}
            center={layout.center}
            slotValue={slotValues[it.component.id]}
            isFaulted={fault?.type === 'overheat' && fault.componentId === it.component.id}
          />
        ))}
    </svg>
  )
}

function buildLayout(nodes, components) {
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
    const bodyLength = isWire ? 0 : BODY_LENGTH[component.type] ?? BODY_LENGTH.unknown
    items.push({ component, a, b, geom: segmentGeometry(a, b), bodyLength })
  }

  const usedNodes = nodes.filter((n) => used.has(n.id))
  return {
    items,
    usedNodes,
    center: centroid(usedNodes),
    faultNodes: (componentId) => {
      const c = components.find((x) => x.id === componentId)
      return new Set(c ? [c.from, c.to] : [])
    },
  }
}

function renderBody(component, { angle, energized, isFaulted, isFilled, ids }) {
  switch (component.type) {
    case 'resistor':
      return <Resistor glowId={ids.glow} isFaulted={isFaulted} />
    case 'resistor_slot':
      return <Resistor isSlot isFilled={isFilled} glowId={ids.glow} isFaulted={isFaulted} />
    case 'voltage_source_dc':
      return <VoltageSource angle={angle} glowId={ids.glow} isFaulted={isFaulted} />
    case 'current_source_dc':
      return <CurrentSource glowId={ids.glow} isFaulted={isFaulted} />
    case 'cyber_led':
      return <CyberLed isLit={energized} isFaulted={isFaulted} glowId={ids.glow} strongGlowId={ids.strongGlow} />
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

const LABEL_FONT = "'Inter', 'Plus Jakarta Sans', sans-serif"
const MONO_FONT = "'JetBrains Mono', monospace"

/** Nombre + valor del componente, colocado hacia el lado libre del circuito. */
function ComponentLabel({ item, center, slotValue, isFaulted }) {
  const { component, geom } = item
  const color = isFaulted ? COLORS.short : TYPE_COLORS[component.type] ?? COLORS.textMuted
  const name = component.label || component.id

  let valueText = null
  if (component.type === 'resistor_slot') {
    valueText = slotValue !== undefined && slotValue !== null ? formatValue(slotValue, component.unit) : null
  } else if (component.type === 'cyber_led' || component.type === 'cyber_sensor') {
    valueText = null // el LED se explica solo y el sensor ya muestra su display
  } else if (!labelAlreadyHasValue(name, component.unit)) {
    valueText = component.value === null || component.value === undefined ? null : formatValue(component.value, component.unit)
  }
  if (!BODY_TYPES.has(component.type)) valueText = component.type

  const lines = [{ text: name, color: COLORS.text, font: LABEL_FONT, weight: 600 }]
  if (valueText) lines.push({ text: valueText, color, font: MONO_FONT, weight: 700 })

  const horizontal = Math.abs(geom.uy) < 0.5
  const lineH = 12
  let x
  let y
  let anchor
  if (horizontal) {
    anchor = 'middle'
    x = geom.mid.x
    const above = geom.mid.y <= center.y
    y = above ? geom.mid.y - 22 - (lines.length - 1) * lineH : geom.mid.y + 30
  } else {
    const toRight = geom.mid.x <= center.x
    anchor = toRight ? 'start' : 'end'
    x = geom.mid.x + (toRight ? 30 : -30)
    y = geom.mid.y - ((lines.length - 1) * lineH) / 2 + 3
  }

  return (
    <g pointerEvents="none">
      {lines.map((ln, i) => (
        <text
          key={i}
          x={x}
          y={y + i * lineH}
          textAnchor={anchor}
          fontFamily={ln.font}
          fontSize={10}
          fontWeight={ln.weight}
          fill={ln.color}
          stroke={COLORS.base}
          strokeWidth={3}
          paintOrder="stroke"
        >
          {ln.text}
        </text>
      ))}
    </g>
  )
}

/** Etiqueta de nodo (A, B, +12V…) empujada hacia afuera del circuito. */
function NodeLabel({ node, center }) {
  const dx = Math.sign(Math.round(node.x - center.x))
  const dy = Math.sign(Math.round(node.y - center.y)) || -1
  const anchor = dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle'
  let x = node.x + dx * 7
  const y = node.y + dy * 9 + (dy > 0 ? 6 : 0)
  // evita que etiquetas largas se salgan del viewBox
  const approxWidth = node.label.length * 5.6
  if (anchor === 'start') x = Math.min(x, VIEWBOX.width - 4 - approxWidth)
  if (anchor === 'end') x = Math.max(x, 4 + approxWidth)
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={MONO_FONT}
      fontSize={9}
      fontWeight={700}
      fill={COLORS.textMuted}
      stroke={COLORS.base}
      strokeWidth={3}
      paintOrder="stroke"
      pointerEvents="none"
    >
      {node.label}
    </text>
  )
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
