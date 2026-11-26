import assert from 'node:assert/strict'
import { sectorsList } from '../data/sectors/index.js'
import { validateChallenge } from './challengeValidator.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message)
    failed++
  }
}

console.log('⚡ Iniciando pruebas de challengeValidator.js (3 Unidades · 6 Niveles · 24 Retos)...')

// 1. Validate all 24 official rubric challenges across all 3 sectors
for (const sector of sectorsList) {
  for (const lesson of sector.lessons) {
    for (const ch of lesson.challenges) {
      if (ch.interaction_type === 'numeric_input') {
        test(`${ch.challenge_id} (numeric_input) acepta respuesta correcta con unidad`, () => {
          const res = validateChallenge(ch, {
            numericValue: ch.solution_json.display_target_value,
            unit: ch.solution_json.display_unit,
          })
          assert.equal(res.isCorrect, true)
          assert.equal(res.fault, null)
          assert.equal(res.unitError, null)
        })

        test(`${ch.challenge_id} (numeric_input) rechaza valor erróneo`, () => {
          const res = validateChallenge(ch, {
            numericValue: Number(ch.solution_json.display_target_value) * 3 + 7,
            unit: ch.solution_json.display_unit,
          })
          assert.equal(res.isCorrect, false)
        })
      } else {
        test(`${ch.challenge_id} (${ch.interaction_type}) acepta opción correcta`, () => {
          const res = validateChallenge(ch, { optionId: ch.solution_json.correct_option_id })
          assert.equal(res.isCorrect, true)
          assert.equal(res.fault, null)
        })

        const wrongOpt = (ch.options || []).find(
          (o) => o.id !== ch.solution_json.correct_option_id
        )
        if (wrongOpt) {
          test(`${ch.challenge_id} rechaza opción incorrecta`, () => {
            const res = validateChallenge(ch, { optionId: wrongOpt.id })
            assert.equal(res.isCorrect, false)
            assert.equal(res.fault?.type, wrongOpt.causes_overheat ? 'overheat' : 'short')
          })
        }
      }
    }
  }
}

// 2. Numeric input unit conversion & ±3% rounding tolerance edge cases
const numericMock = {
  interaction_type: 'numeric_input',
  solution_json: {
    target_base_si_value: 0.02,
    base_si_unit: 'A',
    accepted_units: { A: 1, mA: 0.001 },
    tolerance_percent: 3.0,
    resulting_current_amps: 0.02,
  },
}

test('numeric_input acepta 20 mA equivalente a 0.02 A', () => {
  const res = validateChallenge(numericMock, { numericValue: 20, unit: 'mA' })
  assert.equal(res.isCorrect, true)
  assert.equal(res.unitError, null)
})

test('numeric_input acepta 0.02 A en unidad base', () => {
  const res = validateChallenge(numericMock, { numericValue: 0.02, unit: 'A' })
  assert.equal(res.isCorrect, true)
})

test('numeric_input acepta redondeo dentro de ±3% (20.5 mA)', () => {
  const res = validateChallenge(numericMock, { numericValue: 20.5, unit: 'mA' })
  assert.equal(res.isCorrect, true)
})

test('numeric_input rechaza valor fuera de ±3% (22 mA)', () => {
  const res = validateChallenge(numericMock, { numericValue: 22, unit: 'mA' })
  assert.equal(res.isCorrect, false)
  assert.equal(res.unitError, null)
})

test('numeric_input rechaza unidad incompatible con unitError', () => {
  const res = validateChallenge(numericMock, { numericValue: 20, unit: 'V' })
  assert.equal(res.isCorrect, false)
  assert.ok(res.unitError && res.unitError.includes('Revisar unidades'))
})

// 3. Other interaction types
test('slider_tuning acepta dentro de tolerancia', () => {
  const mock = {
    interaction_type: 'slider_tuning',
    solution_json: { target_numeric_value: 3.3, tolerance_percent: 2.0, resulting_current_amps: 0.01 },
  }
  assert.equal(validateChallenge(mock, { numericValue: 3.35 }).isCorrect, true)
  assert.equal(validateChallenge(mock, { numericValue: 4.0 }).isCorrect, false)
})

test('multimeter_probe valida modo y nodos', () => {
  const mock = {
    interaction_type: 'multimeter_probe',
    solution_json: { expected_mode: 'V_PARALLEL', expected_nodes: ['A', 'GND'] },
  }
  assert.equal(validateChallenge(mock, { mode: 'V_PARALLEL', redNodeId: 'GND', blackNodeId: 'A' }).isCorrect, true)
  assert.equal(validateChallenge(mock, { mode: 'A_SERIES', redNodeId: 'A', blackNodeId: 'GND' }).isCorrect, false)
})

test('superposition_toggle valida estado de fuentes', () => {
  const mock = {
    interaction_type: 'superposition_toggle',
    solution_json: { expected_source_states: { VS1: 'short_circuit', IS1: 'active' } },
  }
  assert.equal(validateChallenge(mock, { sourceStates: { VS1: 'short_circuit', IS1: 'active' } }).isCorrect, true)
  assert.equal(validateChallenge(mock, { sourceStates: { VS1: 'active', IS1: 'active' } }).isCorrect, false)
})

console.log(`\nResultados challengeValidator: ${passed} pasadas, ${failed} falladas`)
if (failed > 0) process.exit(1)
