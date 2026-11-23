/**
 * Test de verificación física y matemática para circuitSolver.js y Sectores 1 a 4
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
  calcTheveninResistance,
  calcMaxPowerTransfer,
  calcRMS,
  calcPeak,
  calcInductiveReactance,
  calcCapacitiveReactance,
  calcImpedanceMagnitude,
  calcApparentPower,
  calcPowerFactor
} from './circuitSolver.js'

import { sectorsList, getSectorById, getLessonById, getAllLessons } from '../data/sectors/index.js'
import { validateChallenge } from './challengeValidator.js'

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

console.log('⚡ Iniciando pruebas de circuitSolver.js y Sectores 1-4...')

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
assert('0.2 W en resistencia de 1/4 W está en advertencia 80%', !safeCheck.isOverheated && safeCheck.status === 'warning')

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
assertClose('Divisor de voltaje 12V con 1k y 2k -> Vx = 8V', calcVoltageDivider(12, 2000, [1000, 2000]), 8)
assertClose('Divisor de corriente 2 ramas 10A [100, 100] -> Ix = 5A', calcCurrentDividerTwo(10, 100, 100), 5)
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

// 8. Transitorios, Thévenin y CA
console.log('\n--- 8. Transitorios, Thévenin y CA ---')
assertClose('RC Tau: 1kΩ * 100µF = 0.1 s', calcRCTau(1000, 0.0001), 0.1)
assertClose('RL Tau: 2H / 100Ω = 0.02 s', calcRLTau(2, 100), 0.02)
assertClose('Thévenin: Voc = 10V, Isc = 2A -> Rth = 5Ω', calcTheveninResistance(10, 2), 5)
assertClose('Máxima Transferencia: Vth = 12V, Rth = 6Ω -> Pmax = 6W', calcMaxPowerTransfer(12, 6), 6)
assertClose('RMS: Vm = 170V -> Vrms ≈ 120.2V', calcRMS(170), 120.208, 0.01)
assertClose('Pico: Vrms = 120.208V -> Vm ≈ 170V', calcPeak(120.208), 170, 0.01)
assertClose('Reactancia inductiva: ω = 1000, L = 50mH -> XL = 50Ω', calcInductiveReactance(1000, 0.05, true), 50)
assertClose('Reactancia capacitiva: ω = 1000, C = 20µF -> XC = 50Ω', calcCapacitiveReactance(1000, 0.00002, true), 50)
assertClose('Impedancia |Z|: R = 30Ω, X = 40Ω -> |Z| = 50Ω', calcImpedanceMagnitude(30, 40), 50)
assertClose('Potencia Aparente: P = 400 kW, Q = 300 kVAR -> S = 500 kVA', calcApparentPower(400, 300), 500)
assertClose('Factor de Potencia: P = 400, S = 500 -> FP = 0.80', calcPowerFactor(400, 500), 0.8)

// 9. Validación Curricular Oficial de la Rúbrica (3 Unidades · 6 Niveles · 24 Retos)
console.log('\n--- 9. Validación de Datos Curriculares Oficiales (3 Unidades · 6 Niveles · 24 Retos) ---')
assert('Existen exactamente 3 Unidades en la lista', sectorsList.length === 3)

sectorsList.forEach((sec, sIdx) => {
  const expectedSectorId = sIdx + 1
  assert(`Unidad ${expectedSectorId} (${sec.slug}): ID correcto`, sec.sector_id === expectedSectorId)
  assert(`Unidad ${expectedSectorId}: Tiene exactamente 2 niveles`, sec.lessons.length === 2)

  sec.lessons.forEach((les) => {
    assert(`Nivel ${les.lesson_id} (${les.title}): Tiene theory_markdown`, Boolean(les.theory_markdown && les.theory_markdown.length > 50))
    assert(`Nivel ${les.lesson_id}: Tiene formulas_markdown`, Boolean(les.formulas_markdown && les.formulas_markdown.length > 30))
    assert(`Nivel ${les.lesson_id}: Tiene solved_example_json completo`, Boolean(les.solved_example_json?.title && les.solved_example_json?.steps_markdown && les.solved_example_json?.final_result))
    assert(`Nivel ${les.lesson_id}: Tiene exactamente 4 ejercicios`, les.challenges.length === 4)

    const mcCount = les.challenges.filter((c) => c.interaction_type === 'multiple_choice').length
    const numCount = les.challenges.filter((c) => c.interaction_type === 'numeric_input').length
    assert(`Nivel ${les.lesson_id}: Combina 2 opción múltiple y 2 respuesta numérica`, mcCount === 2 && numCount === 2)

    les.challenges.forEach((ch) => {
      assert(`Reto ${ch.challenge_id}: Tiene solution_json válido`, Boolean(ch.solution_json))
      assert(`Reto ${ch.challenge_id}: Tiene hint_markdown para reintento`, Boolean(ch.hint_markdown && ch.hint_markdown.length > 10))
      assert(`Reto ${ch.challenge_id}: Tiene explanation_markdown paso a paso`, Boolean(ch.explanation_markdown && ch.explanation_markdown.length > 15))
      assert(`Reto ${ch.challenge_id}: Tiene circuit_config_json con nodos`, Boolean(ch.circuit_config_json?.nodes?.length))

      if (ch.interaction_type === 'numeric_input') {
        assert(`Reto numérico ${ch.challenge_id}: Tiene unit_options y default_unit`, Boolean(ch.unit_options?.length && ch.default_unit))
        assert(`Reto numérico ${ch.challenge_id}: Tiene target_base_si_value`, Number.isFinite(ch.solution_json?.target_base_si_value))
      }
    })
  })
})

const allLessons = getAllLessons()
assert(`Total global de niveles = 6 (3 unidades x 2 niveles)`, allLessons.length === 6)
const totalChallenges = allLessons.flatMap((l) => l.challenges)
assert(`Total oficial de ejercicios = 24 (6 niveles x 4 ejercicios)`, totalChallenges.length === 24)

assert(`getLessonById(1) encuentra Distrito Ohm Nivel 1`, getLessonById(1)?.sector?.slug === 'distrito-ohm')
assert(`getLessonById(2) encuentra Distrito Ohm Nivel 2`, getLessonById(2)?.lesson?.lesson_id === 2)
assert(`getLessonById(3) encuentra Red de Distribución Nivel 3`, getLessonById(3)?.sector?.slug === 'red-distribucion')
assert(`getLessonById(4) encuentra Red de Distribución Nivel 4`, getLessonById(4)?.lesson?.lesson_id === 4)
assert(`getLessonById(5) encuentra Núcleo Kirchhoff Nivel 5`, getLessonById(5)?.sector?.slug === 'nucleo-kirchhoff')
assert(`getLessonById(6) encuentra Núcleo Kirchhoff Nivel 6`, getLessonById(6)?.lesson?.lesson_id === 6)

// 10. Validación Física de los 24 Retos con challengeValidator
console.log('\n--- 10. Validación Física de los 24 Retos (challengeValidator) ---')
totalChallenges.forEach((ch) => {
  if (ch.interaction_type === 'multiple_choice') {
    const correctRes = validateChallenge(ch, { optionId: ch.solution_json.correct_option_id })
    assert(`Reto ${ch.challenge_id} (MC): opción correcta valida isCorrect: true`, correctRes.isCorrect === true)

    const incorrectOpt = ch.options?.find((o) => o.id !== ch.solution_json.correct_option_id)
    if (incorrectOpt) {
      const wrongRes = validateChallenge(ch, { optionId: incorrectOpt.id })
      assert(`Reto ${ch.challenge_id} (MC): opción incorrecta valida isCorrect: false`, wrongRes.isCorrect === false)
    }
  } else if (ch.interaction_type === 'numeric_input') {
    const resDisplay = validateChallenge(ch, {
      numericValue: ch.solution_json.display_target_value,
      unit: ch.solution_json.display_unit
    })
    assert(`Reto ${ch.challenge_id} (Num): valor display (${ch.solution_json.display_target_value} ${ch.solution_json.display_unit}) -> isCorrect: true`, resDisplay.isCorrect === true)

    const resBase = validateChallenge(ch, {
      numericValue: ch.solution_json.target_base_si_value,
      unit: ch.solution_json.base_si_unit
    })
    assert(`Reto ${ch.challenge_id} (Num): valor base SI (${ch.solution_json.target_base_si_value} ${ch.solution_json.base_si_unit}) -> isCorrect: true`, resBase.isCorrect === true)

    const wrongValRes = validateChallenge(ch, {
      numericValue: Number(ch.solution_json.target_base_si_value) * 10,
      unit: ch.solution_json.base_si_unit
    })
    assert(`Reto ${ch.challenge_id} (Num): valor erróneo -> isCorrect: false`, wrongValRes.isCorrect === false)
  }
})

console.log(`\n========================================`)
console.log(`Pruebas completadas: ${passed} pasadas, ${failed} falladas`)
console.log(`========================================`)

if (failed > 0) {
  process.exit(1)
}
