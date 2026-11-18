/**
 * ============================================================================
 * ⚡ OhmDrive — Circuit Solver & Electrical Math Engine (SSOT)
 * ============================================================================
 * Módulo matemático puro para cálculos eléctricos en tiempo real.
 * Autor: Joao Sanchez (Electrical Math Engine & Curriculum Content Architect)
 * Materia: Circuitos Eléctricos (Clave 31358 - UAA, ISC 5-A)
 *
 * Cumple con el estándar físico-matemático de Sadiku / Hayt / Boylestad
 * y las especificaciones de Docs nosotros/01_PROJECT_SPEC.md y 02_DATA_DICTIONARY.md.
 * ============================================================================
 */

// ============================================================================
// 1. CONSTANTES FÍSICAS Y VALORES COMERCIALES ESTÁNDAR
// ============================================================================

/** Valores estándar comerciales de potencia para resistencias (Watts) */
export const STANDARD_RESISTOR_WATTAGES = [0.125, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]

/** Constante de tolerancia por defecto en retos interactivos (±2%) */
export const DEFAULT_TOLERANCE_PERCENT = 2.0

/** Epsilon para comparaciones numéricas de punto flotante */
const EPSILON = 1e-9

// ============================================================================
// 2. LEY DE OHM (V = I * R)
// ============================================================================

/**
 * Calcula el voltaje a partir de la corriente y la resistencia (V = I * R).
 * @param {number} currentAmps - Corriente en Amperes (A)
 * @param {number} resistanceOhms - Resistencia en Ohms (Ω)
 * @returns {number} Voltaje en Volts (V)
 */
export function calcVoltage(currentAmps, resistanceOhms) {
  if (typeof currentAmps !== 'number' || typeof resistanceOhms !== 'number') {
    throw new TypeError('calcVoltage: currentAmps y resistanceOhms deben ser números')
  }
  return currentAmps * resistanceOhms
}

/**
 * Calcula la corriente a partir del voltaje y la resistencia (I = V / R).
 * Si R es 0 o cercano a 0, se considera cortocircuito (Infinity).
 * @param {number} voltageVolts - Voltaje en Volts (V)
 * @param {number} resistanceOhms - Resistencia en Ohms (Ω)
 * @returns {number} Corriente en Amperes (A)
 */
export function calcCurrent(voltageVolts, resistanceOhms) {
  if (typeof voltageVolts !== 'number' || typeof resistanceOhms !== 'number') {
    throw new TypeError('calcCurrent: voltageVolts y resistanceOhms deben ser números')
  }
  if (Math.abs(resistanceOhms) < EPSILON) {
    if (Math.abs(voltageVolts) < EPSILON) return 0
    return voltageVolts > 0 ? Infinity : -Infinity
  }
  return voltageVolts / resistanceOhms
}

/**
 * Calcula la resistencia a partir del voltaje y la corriente (R = V / I).
 * Si I es 0, representa un circuito abierto (Infinity).
 * @param {number} voltageVolts - Voltaje en Volts (V)
 * @param {number} currentAmps - Corriente en Amperes (A)
 * @returns {number} Resistencia en Ohms (Ω)
 */
export function calcResistance(voltageVolts, currentAmps) {
  if (typeof voltageVolts !== 'number' || typeof currentAmps !== 'number') {
    throw new TypeError('calcResistance: voltageVolts y currentAmps deben ser números')
  }
  if (Math.abs(currentAmps) < EPSILON) {
    return Infinity
  }
  return voltageVolts / currentAmps
}

// ============================================================================
// 3. POTENCIA ELÉCTRICA EN CD (P = V * I = I² * R = V² / R)
// ============================================================================

/**
 * Calcula la potencia a partir de Voltaje y Corriente (P = V * I).
 * @param {number} voltageVolts - Voltaje en Volts (V)
 * @param {number} currentAmps - Corriente en Amperes (A)
 * @returns {number} Potencia en Watts (W)
 */
export function calcPowerVI(voltageVolts, currentAmps) {
  if (typeof voltageVolts !== 'number' || typeof currentAmps !== 'number') {
    throw new TypeError('calcPowerVI: los parámetros deben ser numéricos')
  }
  return Math.abs(voltageVolts * currentAmps)
}

/**
 * Calcula la potencia a partir de Corriente y Resistencia (P = I² * R).
 * @param {number} currentAmps - Corriente en Amperes (A)
 * @param {number} resistanceOhms - Resistencia en Ohms (Ω)
 * @returns {number} Potencia en Watts (W)
 */
export function calcPowerIR(currentAmps, resistanceOhms) {
  if (typeof currentAmps !== 'number' || typeof resistanceOhms !== 'number') {
    throw new TypeError('calcPowerIR: los parámetros deben ser numéricos')
  }
  return Math.pow(currentAmps, 2) * resistanceOhms
}

/**
 * Calcula la potencia a partir de Voltaje y Resistencia (P = V² / R).
 * @param {number} voltageVolts - Voltaje en Volts (V)
 * @param {number} resistanceOhms - Resistencia en Ohms (Ω)
 * @returns {number} Potencia en Watts (W)
 */
export function calcPowerVR(voltageVolts, resistanceOhms) {
  if (typeof voltageVolts !== 'number' || typeof resistanceOhms !== 'number') {
    throw new TypeError('calcPowerVR: los parámetros deben ser numéricos')
  }
  if (Math.abs(resistanceOhms) < EPSILON) {
    return Math.abs(voltageVolts) < EPSILON ? 0 : Infinity
  }
  return Math.pow(voltageVolts, 2) / resistanceOhms
}

/**
 * Evalúa si una resistencia se sobrecalienta o quema según su disipación nominal.
 * @param {number} powerWatts - Potencia calculada que disipa la resistencia (W)
 * @param {number} [maxRatingWatts=0.25] - Potencia nominal máxima de la resistencia (ej. 0.25 W = 1/4 W)
 * @returns {{ isOverheated: boolean, ratio: number, powerWatts: number, maxRatingWatts: number, status: 'safe'|'warning'|'burned' }}
 */
export function checkComponentOverheat(powerWatts, maxRatingWatts = 0.25) {
  const safeRating = Math.max(maxRatingWatts, EPSILON)
  const ratio = powerWatts / safeRating
  let status = 'safe'
  if (ratio > 1.0) {
    status = 'burned'
  } else if (ratio >= 0.8) {
    status = 'warning'
  }
  return {
    isOverheated: ratio > 1.0,
    ratio: Number(ratio.toFixed(4)),
    powerWatts: Number(powerWatts.toFixed(6)),
    maxRatingWatts: safeRating,
    status
  }
}

/**
 * Recomienda la potencia comercial mínima de una resistencia con factor de seguridad del 50%.
 * @param {number} powerWatts - Potencia real disipada
 * @returns {number} Potencia comercial recomendada en Watts
 */
export function recommendResistorWattage(powerWatts) {
  const target = powerWatts * 1.5
  for (const w of STANDARD_RESISTOR_WATTAGES) {
    if (w >= target) return w
  }
  return STANDARD_RESISTOR_WATTAGES[STANDARD_RESISTOR_WATTAGES.length - 1]
}

// ============================================================================
// 4. RESISTENCIAS EN SERIE Y PARALELO (Req)
// ============================================================================

/**
 * Calcula la resistencia equivalente de un arreglo de resistencias en serie.
 * Req = R1 + R2 + ... + Rn
 * @param {number[]} resistors - Lista de valores de resistencia en Ohms
 * @returns {number} Resistencia equivalente en Ohms (Ω)
 */
export function calcSeriesResistance(resistors) {
  if (!Array.isArray(resistors) || resistors.length === 0) return 0
  return resistors.reduce((sum, r) => {
    if (typeof r !== 'number' || isNaN(r)) {
      throw new TypeError('calcSeriesResistance: cada elemento debe ser un número válido')
    }
    return sum + Math.max(0, r)
  }, 0)
}

/**
 * Calcula la resistencia equivalente de un arreglo de resistencias en paralelo.
 * 1 / Req = 1/R1 + 1/R2 + ... + 1/Rn
 * Si alguna resistencia es 0 Ω, el equivalente es 0 Ω (cortocircuito que absorbe toda la corriente).
 * @param {number[]} resistors - Lista de valores de resistencia en Ohms
 * @returns {number} Resistencia equivalente en Ohms (Ω)
 */
export function calcParallelResistance(resistors) {
  if (!Array.isArray(resistors) || resistors.length === 0) return 0
  const valid = resistors.filter((r) => typeof r === 'number' && !isNaN(r))
  if (valid.length === 0) return 0

  // Si alguna rama tiene 0 Ohms, el cortocircuito domina y Req = 0
  if (valid.some((r) => Math.abs(r) < EPSILON)) {
    return 0
  }

  const reciprocalSum = valid.reduce((sum, r) => sum + 1 / r, 0)
  if (Math.abs(reciprocalSum) < EPSILON) return Infinity
  return 1 / reciprocalSum
}

/**
 * Atajo para 2 resistencias en paralelo: (R1 * R2) / (R1 + R2)
 * @param {number} r1 - Resistencia 1 en Ohms (Ω)
 * @param {number} r2 - Resistencia 2 en Ohms (Ω)
 * @returns {number} Resistencia equivalente en Ohms (Ω)
 */
export function calcTwoParallel(r1, r2) {
  if (typeof r1 !== 'number' || typeof r2 !== 'number') {
    throw new TypeError('calcTwoParallel: r1 y r2 deben ser números')
  }
  if (Math.abs(r1) < EPSILON || Math.abs(r2) < EPSILON) return 0
  return (r1 * r2) / (r1 + r2)
}

// ============================================================================
// 5. DIVISORES DE VOLTAJE Y CORRIENTE
// ============================================================================

/**
 * Divisor de Voltaje: Vx = Vs * (Rx / Rtotal)
 * Aplica para resistencias en serie alimentadas por una fuente de voltaje Vs.
 * @param {number} sourceVoltage - Voltaje de la fuente Vs en Volts (V)
 * @param {number} targetResistor - Resistencia de interés Rx en Ohms (Ω)
 * @param {number|number[]} totalResistanceOrList - Resistencia total equivalente serie o lista de resistencias
 * @returns {number} Voltaje Vx en la resistencia de interés en Volts (V)
 */
export function calcVoltageDivider(sourceVoltage, targetResistor, totalResistanceOrList) {
  if (typeof sourceVoltage !== 'number' || typeof targetResistor !== 'number') {
    throw new TypeError('calcVoltageDivider: sourceVoltage y targetResistor deben ser números')
  }

  let totalR = 0
  if (Array.isArray(totalResistanceOrList)) {
    totalR = calcSeriesResistance(totalResistanceOrList)
  } else if (typeof totalResistanceOrList === 'number') {
    totalR = totalResistanceOrList
  } else {
    throw new TypeError('calcVoltageDivider: totalResistanceOrList debe ser un número o arreglo')
  }

  if (Math.abs(totalR) < EPSILON) return 0
  return sourceVoltage * (targetResistor / totalR)
}

/**
 * Divisor de Corriente para dos ramas en paralelo:
 * Ix = Is * (Ropuesta / (Rtarget + Ropuesta))
 * @param {number} sourceCurrent - Corriente total que entra al par paralelo Is en Amperes (A)
 * @param {number} targetResistor - Resistencia de la rama donde medimos Ix en Ohms (Ω)
 * @param {number} opposingResistor - Resistencia de la rama opuesta en Ohms (Ω)
 * @returns {number} Corriente Ix en Amperes (A)
 */
export function calcCurrentDividerTwo(sourceCurrent, targetResistor, opposingResistor) {
  if (
    typeof sourceCurrent !== 'number' ||
    typeof targetResistor !== 'number' ||
    typeof opposingResistor !== 'number'
  ) {
    throw new TypeError('calcCurrentDividerTwo: todos los parámetros deben ser números')
  }

  const sumR = targetResistor + opposingResistor
  if (Math.abs(sumR) < EPSILON) return 0
  return sourceCurrent * (opposingResistor / sumR)
}

/**
 * Divisor de Corriente general para múltiples ramas en paralelo:
 * Ix = Is * (Req_paralelo / Rx)
 * @param {number} sourceCurrent - Corriente total Is en Amperes (A)
 * @param {number} targetResistor - Resistencia de la rama de interés Rx en Ohms (Ω)
 * @param {number[]} parallelResistors - Lista completa de todas las ramas en paralelo
 * @returns {number} Corriente Ix en Amperes (A)
 */
export function calcCurrentDividerMulti(sourceCurrent, targetResistor, parallelResistors) {
  if (typeof sourceCurrent !== 'number' || typeof targetResistor !== 'number') {
    throw new TypeError('calcCurrentDividerMulti: sourceCurrent y targetResistor deben ser números')
  }
  if (!Array.isArray(parallelResistors) || parallelResistors.length === 0) return 0
  if (Math.abs(targetResistor) < EPSILON) return sourceCurrent

  const req = calcParallelResistance(parallelResistors)
  return sourceCurrent * (req / targetResistor)
}

// ============================================================================
// 6. LEYES DE KIRCHHOFF (LCK y LVK)
// ============================================================================

/**
 * Verifica la Ley de Corrientes de Kirchhoff (LCK): ∑ I_entran = ∑ I_salen.
 * @param {number[]} currentsIn - Arreglo de corrientes entrantes al nodo en Amperes (A)
 * @param {number[]} currentsOut - Arreglo de corrientes salientes del nodo en Amperes (A)
 * @param {number} [tolerance=1e-4] - Tolerancia absoluta permitida
 * @returns {{ isValid: boolean, sumIn: number, sumOut: number, diff: number }}
 */
export function verifyKCL(currentsIn = [], currentsOut = [], tolerance = 1e-4) {
  const sumIn = (Array.isArray(currentsIn) ? currentsIn : []).reduce((a, b) => a + (Number(b) || 0), 0)
  const sumOut = (Array.isArray(currentsOut) ? currentsOut : []).reduce((a, b) => a + (Number(b) || 0), 0)
  const diff = Math.abs(sumIn - sumOut)
  return {
    isValid: diff <= tolerance,
    sumIn: Number(sumIn.toFixed(6)),
    sumOut: Number(sumOut.toFixed(6)),
    diff: Number(diff.toFixed(6))
  }
}

/**
 * Verifica la Ley de Voltajes de Kirchhoff (LVK): ∑ V_lazo = 0.
 * Las fuentes elevan el potencial (+V o -V según sentido del lazo) y las cargas lo reducen.
 * @param {number[]} voltagesInLoop - Voltajes con signo a lo largo del lazo cerrado
 * @param {number} [tolerance=1e-4] - Tolerancia absoluta permitida
 * @returns {{ isValid: boolean, sumVoltages: number, diff: number }}
 */
export function verifyKVL(voltagesInLoop = [], tolerance = 1e-4) {
  const sumVoltages = (Array.isArray(voltagesInLoop) ? voltagesInLoop : []).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )
  const diff = Math.abs(sumVoltages)
  return {
    isValid: diff <= tolerance,
    sumVoltages: Number(sumVoltages.toFixed(6)),
    diff: Number(diff.toFixed(6))
  }
}

// ============================================================================
// 7. VALIDADOR DE TOLERANCIA FÍSICA (±2% Estándar del Proyecto)
// ============================================================================

/**
 * Valida si un valor calculado o ingresado por el usuario cae dentro de la tolerancia permitida.
 * @param {number} actual - Valor propuesto o medido
 * @param {number} expected - Valor teórico esperado
 * @param {number} [tolerancePercent=DEFAULT_TOLERANCE_PERCENT] - Porcentaje de tolerancia (por defecto 2.0%)
 * @returns {boolean} True si el valor es aceptado
 */
export function isWithinTolerance(actual, expected, tolerancePercent = DEFAULT_TOLERANCE_PERCENT) {
  if (typeof actual !== 'number' || typeof expected !== 'number') return false
  if (isNaN(actual) || isNaN(expected)) return false

  // Caso cero exacto
  if (Math.abs(expected) < EPSILON) {
    return Math.abs(actual) <= 1e-4
  }

  const allowedDelta = Math.abs(expected) * (tolerancePercent / 100)
  return Math.abs(actual - expected) <= allowedDelta + EPSILON
}

/**
 * Obtiene el error porcentual relativo entre el valor obtenido y el esperado.
 * @param {number} actual - Valor obtenido
 * @param {number} expected - Valor esperado
 * @returns {number} Error en porcentaje (%)
 */
export function getRelativeErrorPercent(actual, expected) {
  if (Math.abs(expected) < EPSILON) {
    return Math.abs(actual) < EPSILON ? 0 : 100
  }
  return Math.abs((actual - expected) / expected) * 100
}

// ============================================================================
// 8. FORMATEO Y PARSEO DE UNIDADES DE INGENIERÍA (SI PREFIXES)
// ============================================================================

const SI_PREFIXES = [
  { factor: 1e9, prefix: 'G' },
  { factor: 1e6, prefix: 'M' },
  { factor: 1e3, prefix: 'k' },
  { factor: 1, prefix: '' },
  { factor: 1e-3, prefix: 'm' },
  { factor: 1e-6, prefix: 'µ' },
  { factor: 1e-9, prefix: 'n' },
  { factor: 1e-12, prefix: 'p' }
]

/**
 * Formatea un valor numérico con prefijos del Sistema Internacional (SI) y su unidad.
 * Ejemplos:
 *  0.02, 'A' -> "20 mA"
 *  4700, 'Ω' -> "4.7 kΩ"
 *  0.000001, 'F' -> "1 µF"
 * @param {number} value - Magnitud numérica
 * @param {string} [unit=''] - Símbolo de la unidad ('V', 'A', 'Ω', 'W', 'F', 'H', 'Hz')
 * @param {number} [decimals=2] - Número máximo de decimales
 * @returns {string} Texto formateado
 */
export function formatEngineering(value, unit = '', decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return `0 ${unit}`.trim()
  if (value === 0) return `0 ${unit}`.trim()

  const sign = value < 0 ? '-' : ''
  const absVal = Math.abs(value)

  // Encontrar el prefijo adecuado
  for (const p of SI_PREFIXES) {
    if (absVal >= p.factor * 0.9999 || p.factor === 1e-12) {
      const scaled = absVal / p.factor
      const formatted = Number(scaled.toFixed(decimals)).toString()
      const sep = p.prefix || unit ? ' ' : ''
      return `${sign}${formatted}${sep}${p.prefix}${unit}`.trim()
    }
  }

  return `${sign}${absVal.toFixed(decimals)} ${unit}`.trim()
}

/**
 * Parsea un texto con prefijos de ingeniería a un valor numérico estándar en unidades base.
 * Soporta "20 mA", "4.7k", "10 uF", "1.5 MΩ", etc.
 * @param {string|number} input - Cadena a parsear
 * @returns {number|null} Valor numérico en unidades base o null si no es válido
 */
export function parseEngineering(input) {
  if (typeof input === 'number') return isNaN(input) ? null : input
  if (typeof input !== 'string') return null

  const cleaned = input.trim().replace(/\s+/g, '')
  const match = cleaned.match(/^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*([GMkKmuµnp]?)(?:[a-zA-ZΩ\u03A9\u2126]*)$/)

  if (!match) return null

  const baseNum = parseFloat(match[1])
  const prefix = match[2]

  const multipliers = {
    G: 1e9,
    M: 1e6,
    k: 1e3,
    K: 1e3,
    '': 1,
    m: 1e-3,
    u: 1e-6,
    'µ': 1e-6,
    n: 1e-9,
    p: 1e-12
  }

  const mult = multipliers[prefix] !== undefined ? multipliers[prefix] : 1
  return baseNum * mult
}

// ============================================================================
// 9. FUNCIONES DE EXPANSIÓN (TRANSITORIOS RC/RL Y THÉVENIN - UNIDADES II-IV)
// ============================================================================

/**
 * Calcula la constante de tiempo tau (τ = R * C) de un circuito RC.
 * @param {number} resistanceOhms - Resistencia en Ohms (Ω)
 * @param {number} capacitanceFarads - Capacitancia en Faradios (F)
 * @returns {number} Constante de tiempo τ en segundos (s)
 */
export function calcRCTau(resistanceOhms, capacitanceFarads) {
  return Math.max(0, resistanceOhms) * Math.max(0, capacitanceFarads)
}

/**
 * Calcula la constante de tiempo tau (τ = L / R) de un circuito RL.
 * @param {number} inductanceHenrys - Inductancia en Henrys (H)
 * @param {number} resistanceOhms - Resistencia en Ohms (Ω)
 * @returns {number} Constante de tiempo τ en segundos (s)
 */
export function calcRLTau(inductanceHenrys, resistanceOhms) {
  if (Math.abs(resistanceOhms) < EPSILON) return Infinity
  return Math.max(0, inductanceHenrys) / resistanceOhms
}

/**
 * Calcula la resistencia equivalente de Thévenin / Norton: Rth = Voc / Isc.
 * @param {number} openCircuitVoltage - Voltaje de circuito abierto Voc (V)
 * @param {number} shortCircuitCurrent - Corriente de cortocircuito Isc (A)
 * @returns {number} Resistencia de Thévenin Rth en Ohms (Ω)
 */
export function calcTheveninResistance(openCircuitVoltage, shortCircuitCurrent) {
  if (Math.abs(shortCircuitCurrent) < EPSILON) return Infinity
  return Math.abs(openCircuitVoltage / shortCircuitCurrent)
}

// ============================================================================
// 10. EXPORTACIÓN POR DEFECTO DEL SOLVER
// ============================================================================

const circuitSolver = {
  // Constantes
  STANDARD_RESISTOR_WATTAGES,
  DEFAULT_TOLERANCE_PERCENT,

  // Ley de Ohm
  calcVoltage,
  calcCurrent,
  calcResistance,

  // Potencia
  calcPowerVI,
  calcPowerIR,
  calcPowerVR,
  checkComponentOverheat,
  recommendResistorWattage,

  // Resistencias equivalentes
  calcSeriesResistance,
  calcParallelResistance,
  calcTwoParallel,

  // Divisores
  calcVoltageDivider,
  calcCurrentDividerTwo,
  calcCurrentDividerMulti,

  // Kirchhoff
  verifyKCL,
  verifyKVL,

  // Tolerancia y formato
  isWithinTolerance,
  getRelativeErrorPercent,
  formatEngineering,
  parseEngineering,

  // Transitorios y Thévenin
  calcRCTau,
  calcRLTau,
  calcTheveninResistance
}

export default circuitSolver
