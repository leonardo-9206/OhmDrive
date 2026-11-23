import { useState, useMemo } from 'react'
import {
  FlaskConical,
  Sliders,
  Zap,
  Cpu,
  Layers,
  Flame,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Activity,
  Gauge,
  Sparkles
} from 'lucide-react'
import CircuitCanvas from '../components/circuit-svg/CircuitCanvas'
import KiloMascot from '../components/mascot/KiloMascot'
import { FormulaText, NeonButton } from '../components/ui'
import circuitSolver, {
  calcCurrent,
  calcVoltage,
  calcPowerVI,
  calcPowerVR,
  checkComponentOverheat,
  recommendResistorWattage,
  calcTwoParallel,
  calcSeriesResistance,
  calcVoltageDivider,
  calcCurrentDividerTwo,
  formatEngineering
} from '../engine/circuitSolver'

// ============================================================================
// PLANTILLAS DE CIRCUITOS DEL MODO LIBRE (CYBERLAB SANDBOX)
// ============================================================================

const LAB_TEMPLATES = [
  {
    id: 'ohm_power',
    name: 'Ley de Ohm & Límite Térmico',
    tag: 'Efecto Joule',
    icon: Flame,
    color: 'neon-ohm',
    desc: 'Varía voltaje y resistencia en vivo. Observa cómo cambia la corriente y si la disipación supera el límite comercial nominal.'
  },
  {
    id: 'voltage_divider',
    name: 'Divisor de Voltaje',
    tag: 'Red Serie',
    icon: Sliders,
    color: 'neon-volt',
    desc: 'Ajusta dos resistencias en serie para fraccionar el potencial y calibrar tensiones de salida seguras.'
  },
  {
    id: 'current_divider',
    name: 'Divisor de Corriente',
    tag: 'Ramas Paralelo',
    icon: Zap,
    color: 'neon-amp',
    desc: 'Inyecta corriente constante a dos ramas en paralelo y observa cómo la menor resistencia absorbe el mayor flujo (LCK).'
  },
  {
    id: 'mixed_network',
    name: 'Red Mixta Serie-Paralelo',
    tag: 'Análisis Mixto',
    icon: Layers,
    color: 'neon-watt',
    desc: 'Analiza el comportamiento simultáneo de resistencias en serie con un bloque en paralelo (LVK y LCK combinadas).'
  }
]

const WATTAGE_RATINGS = [
  { label: '1/8 W (0.125 W)', value: 0.125 },
  { label: '1/4 W (0.250 W)', value: 0.25 },
  { label: '1/2 W (0.500 W)', value: 0.5 },
  { label: '1 W (1.000 W)', value: 1.0 },
  { label: '2 W (2.000 W)', value: 2.0 }
]

export default function CyberLabPage() {
  const [activeTab, setActiveTab] = useState('ohm_power')

  // --- Parámetros de la Plantilla 1: Ley de Ohm & Potencia ---
  const [ohmVs, setOhmVs] = useState(12)
  const [ohmR, setOhmR] = useState(300)
  const [ohmMaxWatts, setOhmMaxWatts] = useState(0.25)

  // --- Parámetros de la Plantilla 2: Divisor de Voltaje ---
  const [divVs, setDivVs] = useState(24)
  const [divR1, setDivR1] = useState(1000)
  const [divR2, setDivR2] = useState(2000)

  // --- Parámetros de la Plantilla 3: Divisor de Corriente ---
  const [currIs, setCurrIs] = useState(4.0)
  const [currR1, setCurrR1] = useState(30)
  const [currR2, setCurrR2] = useState(60)

  // --- Parámetros de la Plantilla 4: Red Mixta ---
  const [mixVs, setMixVs] = useState(20)
  const [mixR1, setMixR1] = useState(150)
  const [mixR2, setMixR2] = useState(200)
  const [mixR3, setMixR3] = useState(300)

  // ==========================================================================
  // CÁLCULOS MATEMÁTICOS EN TIEMPO REAL
  // ==========================================================================

  // 1. Plantilla Ley de Ohm
  const ohmData = useMemo(() => {
    const current = calcCurrent(ohmVs, ohmR)
    const power = calcPowerVR(ohmVs, ohmR)
    const thermal = checkComponentOverheat(power, ohmMaxWatts)
    const recommended = recommendResistorWattage(power)

    let kiloState = 'happy'
    let kiloMessage = '¡El circuito opera dentro de límites seguros y estables!'
    if (thermal.status === 'burned') {
      kiloState = 'shock'
      kiloMessage = `¡PELIGRO DE INCENDIO! La disipación (${formatEngineering(power, 'W')}) supera los ${ohmMaxWatts} W nominales.`
    } else if (thermal.status === 'warning') {
      kiloState = 'thinking'
      kiloMessage = `¡Alerta de calor! Operando al ${(thermal.ratio * 100).toFixed(0)}% del límite nominal.`
    }

    const circuitConfig = {
      template: 'single_loop_dc',
      is_energized_initially: true,
      current_speed_amps: current,
      nodes: [
        { id: 'N1', x: 60, y: 60, label: `+${ohmVs}V` },
        { id: 'N2', x: 280, y: 60, label: 'A' },
        { id: 'N3', x: 280, y: 180, label: 'B' },
        { id: 'N4', x: 60, y: 180, label: 'GND', is_ground: true }
      ],
      components: [
        { id: 'VS1', type: 'voltage_source_dc', from: 'N4', to: 'N1', label: `Vs = ${ohmVs} V`, value: ohmVs, unit: 'V' },
        { id: 'R1', type: 'resistor', from: 'N1', to: 'N2', label: `R1 = ${ohmR} Ω`, value: ohmR, unit: 'Ω', max_watts: ohmMaxWatts },
        { id: 'LED1', type: 'cyber_led', from: 'N2', to: 'N3', label: thermal.isOverheated ? 'Fallo Térmico' : 'Carga Óptica', value: 0, unit: 'V' },
        { id: 'W1', type: 'wire', from: 'N3', to: 'N4' }
      ]
    }

    return { current, power, thermal, recommended, kiloState, kiloMessage, circuitConfig }
  }, [ohmVs, ohmR, ohmMaxWatts])

  // 2. Plantilla Divisor de Voltaje
  const divData = useMemo(() => {
    const totalR = calcSeriesResistance([divR1, divR2])
    const current = calcCurrent(divVs, totalR)
    const vOut = calcVoltageDivider(divVs, divR2, totalR)
    const vR1 = divVs - vOut
    const pR1 = calcPowerVI(vR1, current)
    const pR2 = calcPowerVI(vOut, current)

    let kiloState = 'happy'
    let kiloMessage = `Divisor calibrado: Vout entrega ${vOut.toFixed(2)} V con una corriente de ${formatEngineering(current, 'A')}.`
    if (vOut > divVs * 0.9) {
      kiloState = 'thinking'
      kiloMessage = 'R2 es muy grande en comparación con R1; la mayor parte de la tensión cae en la salida.'
    } else if (vOut < divVs * 0.1) {
      kiloState = 'thinking'
      kiloMessage = 'R1 es dominante; casi todo el potencial se disipa antes del nodo de salida.'
    }

    const circuitConfig = {
      template: 'single_loop_dc',
      is_energized_initially: true,
      current_speed_amps: current,
      nodes: [
        { id: 'N1', x: 60, y: 60, label: `+${divVs}V` },
        { id: 'N_MID', x: 220, y: 60, label: `Vout = ${vOut.toFixed(1)}V` },
        { id: 'N_BOT', x: 220, y: 180, label: 'R2-' },
        { id: 'N_GND', x: 60, y: 180, label: 'GND', is_ground: true }
      ],
      components: [
        { id: 'VS1', type: 'voltage_source_dc', from: 'N_GND', to: 'N1', label: `Vs = ${divVs} V`, value: divVs, unit: 'V' },
        { id: 'R1', type: 'resistor', from: 'N1', to: 'N_MID', label: `R1 = ${divR1} Ω (${vR1.toFixed(1)}V)`, value: divR1, unit: 'Ω' },
        { id: 'R2', type: 'resistor', from: 'N_MID', to: 'N_BOT', label: `R2 = ${divR2} Ω (${vOut.toFixed(1)}V)`, value: divR2, unit: 'Ω' },
        { id: 'W1', type: 'wire', from: 'N_BOT', to: 'N_GND' }
      ]
    }

    return { totalR, current, vOut, vR1, pR1, pR2, kiloState, kiloMessage, circuitConfig }
  }, [divVs, divR1, divR2])

  // 3. Plantilla Divisor de Corriente
  const currData = useMemo(() => {
    const req = calcTwoParallel(currR1, currR2)
    const vNode = currIs * req
    const i1 = calcCurrentDividerTwo(currIs, currR1, currR2)
    const i2 = calcCurrentDividerTwo(currIs, currR2, currR1)
    const pTotal = currIs * vNode

    let kiloState = 'happy'
    let kiloMessage = `La corriente de ${currIs.toFixed(1)} A se bifurca: ${formatEngineering(i1, 'A')} por R1 y ${formatEngineering(i2, 'A')} por R2.`
    if (Math.abs(currR1 - currR2) < 2) {
      kiloMessage = '¡Ramas simétricas! La corriente se divide exactamente al 50% por cada rama.'
    } else if (currR1 < currR2) {
      kiloMessage = `R1 (${currR1} Ω) es menor que R2 (${currR2} Ω), por lo que absorbe la mayor corriente (${formatEngineering(i1, 'A')}).`
    } else {
      kiloMessage = `R2 (${currR2} Ω) es menor que R1 (${currR1} Ω), por lo que absorbe la mayor corriente (${formatEngineering(i2, 'A')}).`
    }

    const circuitConfig = {
      template: 'single_loop_dc',
      is_energized_initially: true,
      current_speed_amps: currIs,
      nodes: [
        { id: 'N_IS_T', x: 60, y: 60, label: 'Is+' },
        { id: 'N_R1_T', x: 180, y: 60, label: 'R1+' },
        { id: 'N_R2_T', x: 280, y: 60, label: 'R2+' },
        { id: 'N_IS_B', x: 60, y: 180, label: 'GND', is_ground: true },
        { id: 'N_R1_B', x: 180, y: 180, label: 'R1-' },
        { id: 'N_R2_B', x: 280, y: 180, label: 'R2-' }
      ],
      components: [
        { id: 'IS1', type: 'current_source_dc', from: 'N_IS_B', to: 'N_IS_T', label: `Is = ${currIs.toFixed(1)} A`, value: currIs, unit: 'A' },
        { id: 'W1', type: 'wire', from: 'N_IS_T', to: 'N_R1_T' },
        { id: 'W2', type: 'wire', from: 'N_R1_T', to: 'N_R2_T' },
        { id: 'R1', type: 'resistor', from: 'N_R1_T', to: 'N_R1_B', label: `R1 = ${currR1} Ω (${formatEngineering(i1, 'A')})`, value: currR1, unit: 'Ω' },
        { id: 'R2', type: 'resistor', from: 'N_R2_T', to: 'N_R2_B', label: `R2 = ${currR2} Ω (${formatEngineering(i2, 'A')})`, value: currR2, unit: 'Ω' },
        { id: 'W3', type: 'wire', from: 'N_R2_B', to: 'N_R1_B' },
        { id: 'W4', type: 'wire', from: 'N_R1_B', to: 'N_IS_B' }
      ]
    }

    return { req, vNode, i1, i2, pTotal, kiloState, kiloMessage, circuitConfig }
  }, [currIs, currR1, currR2])

  // 4. Plantilla Red Mixta
  const mixData = useMemo(() => {
    const rPar = calcTwoParallel(mixR2, mixR3)
    const rEq = mixR1 + rPar
    const iTotal = calcCurrent(mixVs, rEq)
    const vR1 = iTotal * mixR1
    const vPar = mixVs - vR1
    const iR2 = vPar / mixR2
    const iR3 = vPar / mixR3
    const pTotal = mixVs * iTotal

    const kiloState = 'happy'
    const kiloMessage = `Red resuelta: Req = ${rEq.toFixed(1)} Ω. Corriente de entrada Itot = ${formatEngineering(iTotal, 'A')}.`

    const circuitConfig = {
      template: 'single_loop_dc',
      is_energized_initially: true,
      current_speed_amps: iTotal,
      nodes: [
        { id: 'N1', x: 50, y: 60, label: `+${mixVs}V` },
        { id: 'N_MID', x: 150, y: 60, label: 'Nodo Serie' },
        { id: 'N_P2', x: 230, y: 60, label: 'R2+' },
        { id: 'N_P3', x: 310, y: 60, label: 'R3+' },
        { id: 'N_GND', x: 50, y: 180, label: 'GND', is_ground: true },
        { id: 'N_PB2', x: 230, y: 180, label: 'R2-' },
        { id: 'N_PB3', x: 310, y: 180, label: 'R3-' }
      ],
      components: [
        { id: 'VS1', type: 'voltage_source_dc', from: 'N_GND', to: 'N1', label: `Vs = ${mixVs}V`, value: mixVs, unit: 'V' },
        { id: 'R1', type: 'resistor', from: 'N1', to: 'N_MID', label: `R1 = ${mixR1} Ω`, value: mixR1, unit: 'Ω' },
        { id: 'W1', type: 'wire', from: 'N_MID', to: 'N_P2' },
        { id: 'W2', type: 'wire', from: 'N_P2', to: 'N_P3' },
        { id: 'R2', type: 'resistor', from: 'N_P2', to: 'N_PB2', label: `R2 = ${mixR2} Ω`, value: mixR2, unit: 'Ω' },
        { id: 'R3', type: 'resistor', from: 'N_P3', to: 'N_PB3', label: `R3 = ${mixR3} Ω`, value: mixR3, unit: 'Ω' },
        { id: 'W3', type: 'wire', from: 'N_PB3', to: 'N_PB2' },
        { id: 'W4', type: 'wire', from: 'N_PB2', to: 'N_GND' }
      ]
    }

    return { rPar, rEq, iTotal, vR1, vPar, iR2, iR3, pTotal, kiloState, kiloMessage, circuitConfig }
  }, [mixVs, mixR1, mixR2, mixR3])

  // Datos de la plantilla activa
  const currentLab = useMemo(() => {
    switch (activeTab) {
      case 'ohm_power':
        return {
          circuitConfig: ohmData.circuitConfig,
          currentAmps: ohmData.current,
          fault: ohmData.thermal.isOverheated ? { type: 'overheat' } : null,
          kiloState: ohmData.kiloState,
          kiloMessage: ohmData.kiloMessage
        }
      case 'voltage_divider':
        return {
          circuitConfig: divData.circuitConfig,
          currentAmps: divData.current,
          fault: null,
          kiloState: divData.kiloState,
          kiloMessage: divData.kiloMessage
        }
      case 'current_divider':
        return {
          circuitConfig: currData.circuitConfig,
          currentAmps: currData.currIs,
          fault: null,
          kiloState: currData.kiloState,
          kiloMessage: currData.kiloMessage
        }
      case 'mixed_network':
        return {
          circuitConfig: mixData.circuitConfig,
          currentAmps: mixData.iTotal,
          fault: null,
          kiloState: mixData.kiloState,
          kiloMessage: mixData.kiloMessage
        }
      default:
        return {
          circuitConfig: ohmData.circuitConfig,
          currentAmps: ohmData.current,
          fault: null,
          kiloState: 'idle',
          kiloMessage: 'Laboratorio activo.'
        }
    }
  }, [activeTab, ohmData, divData, currData, mixData])

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 py-4 sm:px-6">
      {/* ==================================================================== */}
      {/* HEADER DEL CYBERLAB */}
      {/* ==================================================================== */}
      <header className="rounded-2xl border border-neon-ohm/40 bg-pcb-panel p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neon-ohm/50 bg-neon-ohm/10 text-neon-ohm shadow-neon-ohm">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-neon-ohm">
                  Modo Libre Sandbox
                </span>
                <span className="rounded-full border border-neon-watt/40 bg-neon-watt/10 px-2 py-0.5 font-mono text-[10px] text-neon-watt">
                  Tiempo Real
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                CyberLab Simulator
              </h1>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Manipula variables eléctricas en corriente directa, observa la velocidad animada de electrones y analiza ecuaciones en vivo sin riesgo de vidas.
              </p>
            </div>
          </div>

          {/* Diálogo reactivo con Kilo */}
          <div className="flex items-center gap-3 rounded-xl border border-pcb-trace bg-pcb-base/80 p-3 sm:max-w-xs">
            <KiloMascot state={currentLab.kiloState} size="sm" />
            <p className="font-mono text-xs text-slate-200">
              {currentLab.kiloMessage}
            </p>
          </div>
        </div>

        {/* SELECTOR DE PLANTILLAS EN PESTAÑAS */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LAB_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon
            const isActive = activeTab === tpl.id
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActiveTab(tpl.id)}
                className={[
                  'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                  isActive
                    ? 'border-neon-volt bg-pcb-elevated shadow-neon-volt ring-1 ring-neon-volt'
                    : 'border-pcb-trace/60 bg-pcb-base/60 text-slate-400 hover:border-slate-500 hover:text-white'
                ].join(' ')}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-neon-volt' : 'text-slate-500'}`} />
                  <span className="font-mono text-[10px] text-slate-500">{tpl.tag}</span>
                </div>
                <span className={`mt-2 font-display text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {tpl.name}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* ÁREA PRINCIPAL: LIENZO SVG + INSTRUMENTACIÓN */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LIENZO SVG DE CIRCUITO */}
        <div className="flex flex-col rounded-2xl border border-pcb-trace bg-pcb-panel p-4 shadow-xl lg:col-span-7">
          <div className="flex items-center justify-between border-b border-pcb-trace/60 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-neon-volt animate-pulse" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                Topología Interactiva SVG
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span>Flujo de Corriente:</span>
              <span className="font-bold text-neon-amp">
                {formatEngineering(currentLab.currentAmps, 'A')}
              </span>
            </div>
          </div>

          <div className="my-auto flex min-h-[260px] items-center justify-center p-2">
            <CircuitCanvas
              config={currentLab.circuitConfig}
              isEnergized={true}
              currentAmps={currentLab.currentAmps}
              fault={currentLab.fault}
              className="max-h-[300px]"
            />
          </div>

          {/* Banner de Estado Térmico / Alerta */}
          {activeTab === 'ohm_power' && (
            <div
              className={[
                'mt-2 flex items-center justify-between rounded-xl border p-2.5 font-mono text-xs',
                ohmData.thermal.status === 'burned'
                  ? 'border-neon-short/60 bg-neon-short/15 text-neon-short animate-pulse'
                  : ohmData.thermal.status === 'warning'
                  ? 'border-neon-amp/60 bg-neon-amp/15 text-neon-amp'
                  : 'border-neon-watt/40 bg-neon-watt/10 text-neon-watt'
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                {ohmData.thermal.status === 'burned' ? (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                ) : (
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                )}
                <span>
                  Disipación: <strong>{formatEngineering(ohmData.power, 'W')}</strong> / Límite: <strong>{ohmMaxWatts} W</strong> ({((ohmData.power / ohmMaxWatts) * 100).toFixed(0)}%)
                </span>
              </div>
              <span className="text-[11px] uppercase font-bold">
                {ohmData.thermal.status === 'burned' ? '🔥 QUEMADA' : ohmData.thermal.status === 'warning' ? '⚠️ ADVERTENCIA' : '✓ SEGURA'}
              </span>
            </div>
          )}
        </div>

        {/* MULTÍMETRO DIGITAL / DASHBOARD DE MEDICIONES */}
        <div className="flex flex-col gap-4 rounded-2xl border border-pcb-trace bg-pcb-panel p-4 shadow-xl lg:col-span-5">
          <div className="flex items-center justify-between border-b border-pcb-trace/60 pb-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Gauge className="h-4 w-4 text-neon-amp" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider">
                Mediciones Virtuales
              </h2>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              True-RMS DMM
            </span>
          </div>

          {/* Displays numéricos tipo 7 segmentos */}
          <div className="grid grid-cols-2 gap-3">
            {activeTab === 'ohm_power' && (
              <>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-volt">Tensión (Vs)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-white sm:text-2xl">
                    {ohmVs.toFixed(1)} <span className="text-xs text-neon-volt">V</span>
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-amp">Corriente (I)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-amp sm:text-2xl">
                    {formatEngineering(ohmData.current, 'A')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-ohm">Resistencia (R)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-ohm sm:text-2xl">
                    {formatEngineering(ohmR, 'Ω')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-watt">Potencia (P)</span>
                  <p className={`mt-1 font-mono text-xl font-bold sm:text-2xl ${ohmData.thermal.isOverheated ? 'text-neon-short' : 'text-neon-watt'}`}>
                    {formatEngineering(ohmData.power, 'W')}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'voltage_divider' && (
              <>
                <div className="rounded-xl border border-neon-volt/40 bg-pcb-base p-3 shadow-neon-volt">
                  <span className="font-mono text-[11px] uppercase text-neon-volt">V_salida (Vout)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-volt sm:text-2xl">
                    {divData.vOut.toFixed(2)} <span className="text-xs">V</span>
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-slate-400">Caída VR1</span>
                  <p className="mt-1 font-mono text-xl font-bold text-slate-200 sm:text-2xl">
                    {divData.vR1.toFixed(2)} <span className="text-xs">V</span>
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-amp">Corriente I_lazo</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-amp sm:text-2xl">
                    {formatEngineering(divData.current, 'A')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-ohm">R_total (R1+R2)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-ohm sm:text-2xl">
                    {formatEngineering(divData.totalR, 'Ω')}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'current_divider' && (
              <>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-amp">Corriente I1 (R1)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-amp sm:text-2xl">
                    {formatEngineering(currData.i1, 'A')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-amp">Corriente I2 (R2)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-amp sm:text-2xl">
                    {formatEngineering(currData.i2, 'A')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-volt">Voltaje Nodo (V)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-volt sm:text-2xl">
                    {currData.vNode.toFixed(2)} <span className="text-xs">V</span>
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-ohm">R_paralelo (Req)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-ohm sm:text-2xl">
                    {formatEngineering(currData.req, 'Ω')}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'mixed_network' && (
              <>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-amp">Corriente Total (Itot)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-amp sm:text-2xl">
                    {formatEngineering(mixData.iTotal, 'A')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-ohm">R_equivalente Total</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-ohm sm:text-2xl">
                    {formatEngineering(mixData.rEq, 'Ω')}
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-volt">Caída VR1</span>
                  <p className="mt-1 font-mono text-xl font-bold text-slate-200 sm:text-2xl">
                    {mixData.vR1.toFixed(2)} <span className="text-xs">V</span>
                  </p>
                </div>
                <div className="rounded-xl border border-pcb-trace bg-pcb-base p-3">
                  <span className="font-mono text-[11px] uppercase text-neon-volt">Tensión Paralelo (Vp)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-neon-volt sm:text-2xl">
                    {mixData.vPar.toFixed(2)} <span className="text-xs">V</span>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ECUACIÓN EN VIVO CON SUSTITUCIÓN REAL */}
          <div className="mt-auto rounded-xl border border-pcb-trace/80 bg-pcb-base/90 p-3">
            <span className="font-mono text-[10px] uppercase text-slate-400">
              Ecuación Física en Vivo
            </span>
            <div className="mt-1 font-mono text-xs text-slate-200">
              {activeTab === 'ohm_power' && (
                <FormulaText
                  text={`$$I = \\frac{V_s}{R} = \\frac{${ohmVs}\\text{ V}}{${ohmR}\\text{ }\\Omega} = ${formatEngineering(ohmData.current, 'A')}$$`}
                />
              )}
              {activeTab === 'voltage_divider' && (
                <FormulaText
                  text={`$$V_{\\text{out}} = ${divVs}\\text{ V} \\cdot \\frac{${divR2}\\text{ }\\Omega}{${divR1 + divR2}\\text{ }\\Omega} = ${divData.vOut.toFixed(2)}\\text{ V}$$`}
                />
              )}
              {activeTab === 'current_divider' && (
                <FormulaText
                  text={`$$I_1 = ${currIs}\\text{ A} \\cdot \\frac{${currR2}\\text{ }\\Omega}{${currR1 + currR2}\\text{ }\\Omega} = ${formatEngineering(currData.i1, 'A')}$$`}
                />
              )}
              {activeTab === 'mixed_network' && (
                <FormulaText
                  text={`$$R_{eq} = ${mixR1} + (${mixR2} \\parallel ${mixR3}) = ${mixData.rEq.toFixed(1)}\\text{ }\\Omega$$`}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PANEL INFERIOR: CONTROLES DESLIZANTES (SLIDERS) */}
      {/* ==================================================================== */}
      <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-4 shadow-xl sm:p-6">
        <div className="flex items-center justify-between border-b border-pcb-trace/60 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Sliders className="h-4 w-4 text-neon-volt" />
            <h2 className="font-display text-base font-bold sm:text-lg">
              Ajuste de Parámetros Eléctricos
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'ohm_power') { setOhmVs(12); setOhmR(300); setOhmMaxWatts(0.25); }
              if (activeTab === 'voltage_divider') { setDivVs(24); setDivR1(1000); setDivR2(2000); }
              if (activeTab === 'current_divider') { setCurrIs(4.0); setCurrR1(30); setCurrR2(60); }
              if (activeTab === 'mixed_network') { setMixVs(20); setMixR1(150); setMixR2(200); setMixR3(300); }
            }}
            className="flex items-center gap-1 rounded-lg border border-pcb-trace bg-pcb-elevated px-2.5 py-1 font-mono text-xs text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* CONTROLES POR PLANTILLA */}
        <div className="mt-5 space-y-6">
          {activeTab === 'ohm_power' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Slider Vs */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-volt">Voltaje Fuente (Vs):</span>
                  <span className="font-bold text-white">{ohmVs} V</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={ohmVs}
                  onChange={(e) => setOhmVs(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-cyan-400"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>1 V</span>
                  <span>15 V</span>
                  <span>30 V</span>
                </div>
              </div>

              {/* Slider R */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-ohm">Resistencia (R1):</span>
                  <span className="font-bold text-white">{ohmR} Ω</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="10"
                  value={ohmR}
                  onChange={(e) => setOhmR(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>20 Ω</span>
                  <span>1 kΩ</span>
                  <span>2 kΩ</span>
                </div>
              </div>

              {/* Selector Potencia Comercial */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-watt">Potencia Nominal Resistencia:</span>
                  <span className="font-bold text-white">{ohmMaxWatts} W</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {WATTAGE_RATINGS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setOhmMaxWatts(w.value)}
                      className={[
                        'rounded-lg border px-2 py-1 font-mono text-[11px] transition-all',
                        ohmMaxWatts === w.value
                          ? 'border-neon-watt bg-neon-watt/20 text-white font-bold'
                          : 'border-pcb-trace bg-pcb-base text-slate-400 hover:text-white'
                      ].join(' ')}
                    >
                      {w.value} W
                    </button>
                  ))}
                </div>
                <p className="font-mono text-[10px] text-slate-400">
                  Recomendada para esta carga: <strong className="text-neon-watt">{ohmData.recommended} W</strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'voltage_divider' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-volt">Voltaje Entrada (Vs):</span>
                  <span className="font-bold text-white">{divVs} V</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="48"
                  step="1"
                  value={divVs}
                  onChange={(e) => setDivVs(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-cyan-400"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>5 V</span>
                  <span>24 V</span>
                  <span>48 V</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-slate-300">R1 (Superior):</span>
                  <span className="font-bold text-white">{divR1} Ω</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="50"
                  value={divR1}
                  onChange={(e) => setDivR1(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>100 Ω</span>
                  <span>2.5 kΩ</span>
                  <span>5 kΩ</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-volt">R2 (Inferior / Vout):</span>
                  <span className="font-bold text-neon-volt">{divR2} Ω</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="50"
                  value={divR2}
                  onChange={(e) => setDivR2(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-cyan-400"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>100 Ω</span>
                  <span>2.5 kΩ</span>
                  <span>5 kΩ</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'current_divider' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-amp">Fuente de Corriente (Is):</span>
                  <span className="font-bold text-neon-amp">{currIs.toFixed(1)} A</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={currIs}
                  onChange={(e) => setCurrIs(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-amber-400"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>0.5 A</span>
                  <span>5.0 A</span>
                  <span>10.0 A</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-ohm">Rama R1:</span>
                  <span className="font-bold text-white">{currR1} Ω</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={currR1}
                  onChange={(e) => setCurrR1(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>10 Ω</span>
                  <span>150 Ω</span>
                  <span>300 Ω</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-ohm">Rama R2:</span>
                  <span className="font-bold text-white">{currR2} Ω</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={currR2}
                  onChange={(e) => setCurrR2(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>10 Ω</span>
                  <span>150 Ω</span>
                  <span>300 Ω</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mixed_network' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-volt">Voltaje (Vs):</span>
                  <span className="font-bold text-white">{mixVs} V</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={mixVs}
                  onChange={(e) => setMixVs(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-ohm">R1 (Serie):</span>
                  <span className="font-bold text-white">{mixR1} Ω</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={mixR1}
                  onChange={(e) => setMixR1(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-ohm">R2 (Paralelo A):</span>
                  <span className="font-bold text-white">{mixR2} Ω</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={mixR2}
                  onChange={(e) => setMixR2(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neon-ohm">R3 (Paralelo B):</span>
                  <span className="font-bold text-white">{mixR3} Ω</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={mixR3}
                  onChange={(e) => setMixR3(parseInt(e.target.value, 10))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pcb-elevated accent-pink-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
