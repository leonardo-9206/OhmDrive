/**
 * Test de verificación física y matemática para circuitSolver.js
 * Ejecutar con: node src/engine/circuitSolver.test.js
 */

import circuitSolver, {
  calcVoltage,
  calcCurrent,
  calcResistance,
  calcPowerVI,
  calcPowerIR,
  calcPowerVR,
  checkComponentOverheat,
  calcSeriesResistance,
  calcParallelResistance,
  calcTwoParallel,
  calcVoltageDivider,
  calcCurrentDividerTwo,
  calcCurrentDividerMulti,
  verifyKCL,
  verifyKVL,
  isWithinTolerance,
  formatEngineering,
  parseEngineering,
  calcRCTau,
  calcRLTau,
  calcTheveninResistance
} from './circuitSolver.js'

let passed = 0
let failed = 0

function assert(description, condition) {
  if (condition) {
    passed++
    console.log(`  ✓ ${description}`)
  } else {
    failed++
    console.error(`  ✗ FAIL: ${description}`)
  }
}

function assertClose(description, actual, expected, tol = 1e-4) {
  const diff = Math.abs(actual - expected)
  assert(`${description} [esperado: ${expected}, obtenido: ${actual}]`, diff <= tol)
}

console.log('⚡ Iniciando pruebas de circuitSolver.js...')

// 1. Ley de Ohm
console.log('\n--- 1. Ley de Ohm ---')
assertClose('V = 0.02 A * 500 Ω = 10 V', calcVoltage(0.02, 500), 10)
assertClose('I = 12 V / 1000 Ω = 0.012 A', calcCurrent(12, 1000), 0.012)
assertClose('R = 5 V / 0.01 A = 500 Ω', calcResistance(5, 0.01), 500)
assert('Cortocircuito I -> Infinity cuando R = 0', calcCurrent(10, 0) === Infinity)
assert('Circuito abierto R -> Infinity cuando I = 0', calcResistance(10, 0) === Infinity)

// 2. Potencia en CD
console.log('\n--- 2. Potencia en CD ---')
assertClose('P(V, I) = 10 V * 0.02 A = 0.2 W', calcPowerVI(10, 0.02), 0.2)
assertClose('P(I, R) = (0.02)^2 * 500 = 0.2 W', calcPowerIR(0.02, 500), 0.2)
assertClose('P(V, R) = (10)^2 / 500 = 0.2 W', calcPowerVR(10, 500), 0.2)

const safeCheck = checkComponentOverheat(0.2, 0.25)
assert('0.2 W en resistencia de 1/4 W está seguro', !safeCheck.isOverheated && safeCheck.status === 'warning')

const burnCheck = checkComponentOverheat(0.5, 0.25)
assert('0.5 W en resistencia de 1/4 W está quemado', burnCheck.isOverheated && burnCheck.status === 'burned')

// 3. Resistencias Equivalentes
console.log('\n--- 3. Resistencias en Serie y Paralelo ---')
assertClose('Serie [100, 220, 470] = 790 Ω', calcSeriesResistance([100, 220, 470]), 790)
assertClose('Paralelo [1000, 1000] = 500 Ω', calcParallelResistance([1000, 1000]), 500)
assertClose('Paralelo [100, 200, 200] = 50 Ω', calcParallelResistance([100, 200, 200]), 50)
assertClose('TwoParallel(100, 100) = 50 Ω', calcTwoParallel(100, 100), 50)
assert('Cortocircuito en rama paralelo domina (Req = 0)', calcParallelResistance([100, 0, 200]) === 0)

// 4. Divisores
console.log('\n--- 4. Divisores de Voltaje y Corriente ---')
// Vs = 12V, R1 = 1k, R2 = 2k -> V(R2) = 12 * (2 / 3) = 8V
assertClose('Divisor de voltaje 12V con 1k y 2k -> Vx = 8V', calcVoltageDivider(12, 2000, [1000, 2000]), 8)
// Is = 10A, R1 = 100, R2 = 100 -> I1 = 5A
assertClose('Divisor de corriente 2 ramas 10A [100, 100] -> Ix = 5A', calcCurrentDividerTwo(10, 100, 100), 5)
// Is = 6A, R1 = 30, R2 = 60 -> I1 = 6 * (60 / 90) = 4A
assertClose('Divisor de corriente 6A con 30Ω y 60Ω -> I(30Ω) = 4A', calcCurrentDividerTwo(6, 30, 60), 4)

// 5. Kirchhoff
console.log('\n--- 5. Leyes de Kirchhoff ---')
const kclResult = verifyKCL([2, 3], [5])
assert('LCK: 2A + 3A = 5A es válido', kclResult.isValid)
const kvlResult = verifyKVL([-12, 4, 8])
assert('LVK: -12V + 4V + 8V = 0 es válido', kvlResult.isValid)

// 6. Tolerancia
console.log('\n--- 6. Tolerancia ±2% ---')
assert('505 Ω vs 500 Ω está dentro de ±2%', isWithinTolerance(505, 500, 2.0))
assert('515 Ω vs 500 Ω está fuera de ±2%', !isWithinTolerance(515, 500, 2.0))

// 7. Unidades de Ingeniería
console.log('\n--- 7. Unidades de Ingeniería ---')
assert('0.02 A -> "20 mA"', formatEngineering(0.02, 'A') === '20 mA')
assert('4700 Ω -> "4.7 kΩ"', formatEngineering(4700, 'Ω') === '4.7 kΩ')
assert('0.000001 F -> "1 µF"', formatEngineering(0.000001, 'F') === '1 µF')
assertClose('parseEngineering("20 mA") = 0.02', parseEngineering('20 mA'), 0.02)
assertClose('parseEngineering("4.7 kΩ") = 4700', parseEngineering('4.7 kΩ'), 4700)
assertClose('parseEngineering("10 uF") = 1e-5', parseEngineering('10 uF'), 1e-5)

// 8. Transitorios y Thévenin
console.log('\n--- 8. Transitorios y Thévenin ---')
assertClose('RC Tau: 1kΩ * 100µF = 0.1 s', calcRCTau(1000, 0.0001), 0.1)
assertClose('RL Tau: 2H / 100Ω = 0.02 s', calcRLTau(2, 100), 0.02)
assertClose('Thévenin: Voc = 10V, Isc = 2A -> Rth = 5Ω', calcTheveninResistance(10, 2), 5)

console.log(`\n========================================`)
console.log(`Pruebas completadas: ${passed} pasadas, ${failed} falladas`)
console.log(`========================================`)

if (failed > 0) {
  process.exit(1)
}
