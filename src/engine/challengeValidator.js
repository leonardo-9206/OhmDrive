import { isWithinTolerance } from './circuitSolver.js'

/**
 * Fallback SI unit multipliers table per 02_DATA_DICTIONARY.md Section 4.2.
 */
const SI_UNIT_GROUPS = {
  V: { V: 1, mV: 0.001, kV: 1000 },
  A: { A: 1, mA: 0.001, 'μA': 0.000001, uA: 0.000001 },
  'Ω': { 'Ω': 1, Ohm: 1, 'kΩ': 1000, 'MΩ': 1000000 },
  W: { W: 1, mW: 0.001, kW: 1000 },
  C: { C: 1, mC: 0.001 },
  J: { J: 1, kJ: 1000 },
}

/**
 * Finds the first slot component ID in a circuit_config_json (e.g. resistor_slot).
 *
 * @param {object} circuitConfig
 * @returns {string|undefined}
 */
function findSlotComponentId(circuitConfig) {
  const slotComp = circuitConfig?.components?.find((c) =>
    String(c.type || '').endsWith('_slot')
  )
  return slotComp?.id
}

/**
 * Validates a numeric_input response by converting userValue * unitMultiplier
 * to the base SI unit and checking tolerance_percent (default ±3%).
 */
function validateNumericInput(challenge, userResponse, slotId) {
  const solution = challenge.solution_json || {}
  const tolerance = solution.tolerance_percent ?? 3.0
  const rawVal = Number(userResponse.numericValue)
  const chosenUnit = String(userResponse.unit || '').trim()

  if (!Number.isFinite(rawVal)) {
    return {
      isCorrect: false,
      fault: { type: 'short', ...(slotId ? { componentId: slotId } : {}) },
      resultingCurrentAmps: null,
      selectedOption: null,
      unitError: 'Ingresa un valor numérico válido antes de comprobar.',
    }
  }

  const baseUnit = solution.base_si_unit || ''
  const acceptedUnits =
    solution.accepted_units && Object.keys(solution.accepted_units).length > 0
      ? solution.accepted_units
      : SI_UNIT_GROUPS[baseUnit] || {}

  const multiplier = acceptedUnits[chosenUnit]
  if (multiplier == null) {
    const validList = Object.keys(acceptedUnits).join(', ') || baseUnit
    return {
      isCorrect: false,
      fault: { type: 'short', ...(slotId ? { componentId: slotId } : {}) },
      resultingCurrentAmps: null,
      selectedOption: null,
      unitError: `Revisar unidades: se esperaba una unidad compatible (${validList}).`,
    }
  }

  const targetBase =
    solution.target_base_si_value != null
      ? Number(solution.target_base_si_value)
      : Number(solution.target_numeric_value)

  const userBaseValue = rawVal * Number(multiplier)
  const isCorrect =
    Number.isFinite(targetBase) && isWithinTolerance(userBaseValue, targetBase, tolerance)

  return {
    isCorrect,
    fault: isCorrect
      ? null
      : {
          type: userBaseValue > targetBase * 1.5 ? 'overheat' : 'short',
          ...(slotId ? { componentId: slotId } : {}),
        },
    resultingCurrentAmps: isCorrect
      ? (solution.resulting_current_amps ?? challenge.circuit_config_json?.current_speed_amps ?? 0.5)
      : null,
    selectedOption: null,
    unitError: null,
  }
}

/**
 * Validates a user's response against a challenge's solution_json.
 * Supports multiple_choice, component_slot, numeric_input, slider_tuning,
 * multimeter_probe, and superposition_toggle.
 *
 * @param {object} challenge - Challenge object following ChallengeSchema
 * @param {object} userResponse - User's selection/input payload
 * @returns {{
 *   isCorrect: boolean,
 *   fault: { type: 'short' | 'overheat', componentId?: string } | null,
 *   resultingCurrentAmps: number | null,
 *   selectedOption: object | null,
 *   unitError?: string | null
 * }}
 */
export function validateChallenge(challenge, userResponse) {
  if (!challenge || !challenge.solution_json || !userResponse) {
    return {
      isCorrect: false,
      fault: { type: 'short' },
      resultingCurrentAmps: null,
      selectedOption: null,
      unitError: null,
    }
  }

  const {
    interaction_type: type,
    solution_json: solution,
    options = [],
    circuit_config_json: config,
  } = challenge
  const tolerance = solution.tolerance_percent ?? 3.0
  const slotId = findSlotComponentId(config)

  if (type === 'numeric_input') {
    return validateNumericInput(challenge, userResponse, slotId)
  }

  if (type === 'multiple_choice' || type === 'component_slot') {
    const selectedOption = options.find((opt) => opt.id === userResponse.optionId) || null

    let isCorrect = false
    if (selectedOption && solution.correct_option_id) {
      isCorrect = selectedOption.id === solution.correct_option_id
    } else if (
      userResponse.numericValue != null &&
      solution.target_numeric_value != null
    ) {
      isCorrect = isWithinTolerance(
        Number(userResponse.numericValue),
        Number(solution.target_numeric_value),
        tolerance
      )
    }

    if (isCorrect) {
      return {
        isCorrect: true,
        fault: null,
        resultingCurrentAmps: solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5,
        selectedOption,
        unitError: null,
      }
    }

    const faultType = selectedOption?.causes_overheat ? 'overheat' : 'short'
    return {
      isCorrect: false,
      fault: {
        type: faultType,
        ...(slotId ? { componentId: slotId } : {}),
      },
      resultingCurrentAmps: null,
      selectedOption,
      unitError: null,
    }
  }

  if (type === 'slider_tuning') {
    const val = Number(userResponse.numericValue)
    const target = Number(solution.target_numeric_value)
    const isCorrect =
      Number.isFinite(val) && Number.isFinite(target) && isWithinTolerance(val, target, tolerance)

    return {
      isCorrect,
      fault: isCorrect
        ? null
        : {
            type: val > target * 1.5 ? 'overheat' : 'short',
            ...(slotId ? { componentId: slotId } : {}),
          },
      resultingCurrentAmps: isCorrect
        ? (solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5)
        : null,
      selectedOption: null,
      unitError: null,
    }
  }

  if (type === 'multimeter_probe') {
    const expectedMode = solution.expected_mode
    const modeOk = !expectedMode || userResponse.mode === expectedMode

    let nodesOk = true
    if (Array.isArray(solution.expected_nodes) && solution.expected_nodes.length === 2) {
      const pair = [userResponse.redNodeId, userResponse.blackNodeId]
      nodesOk =
        solution.expected_nodes.every((n) => pair.includes(n)) &&
        userResponse.redNodeId !== userResponse.blackNodeId
    } else if (solution.expected_red_node && solution.expected_black_node) {
      nodesOk =
        userResponse.redNodeId === solution.expected_red_node &&
        userResponse.blackNodeId === solution.expected_black_node
    }

    const isCorrect = Boolean(modeOk && nodesOk)
    return {
      isCorrect,
      fault: isCorrect ? null : { type: 'short' },
      resultingCurrentAmps: isCorrect
        ? (solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5)
        : null,
      selectedOption: null,
      unitError: null,
    }
  }

  if (type === 'superposition_toggle') {
    const expected = solution.expected_source_states || {}
    const actual = userResponse.sourceStates || {}
    const keys = Object.keys(expected)
    const isCorrect = keys.length > 0 && keys.every((k) => actual[k] === expected[k])

    return {
      isCorrect,
      fault: isCorrect ? null : { type: 'short' },
      resultingCurrentAmps: isCorrect
        ? (solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5)
        : null,
      selectedOption: null,
      unitError: null,
    }
  }

  return {
    isCorrect: false,
    fault: { type: 'short' },
    resultingCurrentAmps: null,
    selectedOption: null,
    unitError: null,
  }
}

export default validateChallenge
