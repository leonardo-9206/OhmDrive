import { isWithinTolerance } from './circuitSolver.js'

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
 * Validates a user's response against a challenge's solution_json.
 * Supports all 5 interaction types defined in 02_DATA_DICTIONARY.md.
 *
 * @param {object} challenge - Challenge object following ChallengeSchema
 * @param {object} userResponse - User's selection/input payload
 * @returns {{
 *   isCorrect: boolean,
 *   fault: { type: 'short' | 'overheat', componentId?: string } | null,
 *   resultingCurrentAmps: number | null,
 *   selectedOption: object | null
 * }}
 */
export function validateChallenge(challenge, userResponse) {
  if (!challenge || !challenge.solution_json || !userResponse) {
    return {
      isCorrect: false,
      fault: { type: 'short' },
      resultingCurrentAmps: null,
      selectedOption: null,
    }
  }

  const { interaction_type: type, solution_json: solution, options = [], circuit_config_json: config } = challenge
  const tolerance = solution.tolerance_percent ?? 2.0
  const slotId = findSlotComponentId(config)

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
    }
  }

  if (type === 'slider_tuning') {
    const val = Number(userResponse.numericValue)
    const target = Number(solution.target_numeric_value)
    const isCorrect = Number.isFinite(val) && Number.isFinite(target) && isWithinTolerance(val, target, tolerance)

    return {
      isCorrect,
      fault: isCorrect ? null : { type: val > target * 1.5 ? 'overheat' : 'short', ...(slotId ? { componentId: slotId } : {}) },
      resultingCurrentAmps: isCorrect ? (solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5) : null,
      selectedOption: null,
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
      resultingCurrentAmps: isCorrect ? (solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5) : null,
      selectedOption: null,
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
      resultingCurrentAmps: isCorrect ? (solution.resulting_current_amps ?? config?.current_speed_amps ?? 0.5) : null,
      selectedOption: null,
    }
  }

  return {
    isCorrect: false,
    fault: { type: 'short' },
    resultingCurrentAmps: null,
    selectedOption: null,
  }
}

export default validateChallenge
