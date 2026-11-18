import assert from 'node:assert/strict'
import sector1 from '../data/sectors/sector1.json' with { type: 'json' }
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

console.log('⚡ Iniciando pruebas de challengeValidator.js...')

// 1. Validate every challenge in Sector 1
for (const lesson of sector1.lessons) {
  for (const ch of lesson.challenges) {
    test(`${ch.challenge_id} (${ch.interaction_type}) acepta opción correcta`, () => {
      const res = validateChallenge(ch, { optionId: ch.solution_json.correct_option_id })
      assert.equal(res.isCorrect, true)
      assert.equal(res.fault, null)
    })

    const wrongOpt = ch.options.find((o) => o.id !== ch.solution_json.correct_option_id)
    if (wrongOpt) {
      test(`${ch.challenge_id} rechaza opción incorrecta`, () => {
        const res = validateChallenge(ch, { optionId: wrongOpt.id })
        assert.equal(res.isCorrect, false)
        assert.equal(res.fault?.type, wrongOpt.causes_overheat ? 'overheat' : 'short')
      })
    }
  }
}

// 2. Slider tuning (±2% tolerance)
test('slider_tuning acepta dentro de ±2%', () => {
  const mock = {
    interaction_type: 'slider_tuning',
    solution_json: { target_numeric_value: 3.3, tolerance_percent: 2.0, resulting_current_amps: 0.01 },
  }
  assert.equal(validateChallenge(mock, { numericValue: 3.35 }).isCorrect, true)
  assert.equal(validateChallenge(mock, { numericValue: 4.0 }).isCorrect, false)
})

// 3. Multimeter probe
test('multimeter_probe valida modo y nodos', () => {
  const mock = {
    interaction_type: 'multimeter_probe',
    solution_json: { expected_mode: 'V_PARALLEL', expected_nodes: ['A', 'GND'] },
  }
  assert.equal(validateChallenge(mock, { mode: 'V_PARALLEL', redNodeId: 'GND', blackNodeId: 'A' }).isCorrect, true)
  assert.equal(validateChallenge(mock, { mode: 'A_SERIES', redNodeId: 'A', blackNodeId: 'GND' }).isCorrect, false)
})

// 4. Superposition toggle
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
