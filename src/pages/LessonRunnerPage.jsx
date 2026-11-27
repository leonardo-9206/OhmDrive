import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { getLessonById } from '../data/sectors'
import { validateChallenge } from '../engine/challengeValidator'
import { useGameStore } from '../store/useGameStore'
import { FormulaText, FuseBar, NeonButton } from '../components/ui'
import KiloMascot from '../components/mascot/KiloMascot'
import CircuitCanvas from '../components/circuit-svg/CircuitCanvas'

const STATES = {
  THEORY_INTRO: 'THEORY_INTRO',
  PRESENTING_CIRCUIT: 'PRESENTING_CIRCUIT',
  HINT_RETRY: 'HINT_RETRY',
  CIRCUIT_SUCCESS: 'CIRCUIT_SUCCESS',
  SHORT_CIRCUIT_ERROR: 'SHORT_CIRCUIT_ERROR',
  LESSON_COMPLETED: 'LESSON_COMPLETED',
}

const DEFAULT_UNITS = ['V', 'mV', 'A', 'mA', 'Ω', 'kΩ', 'W', 'mW']

/**
 * Renders lightweight markdown (headings, bold, newlines) with KaTeX math via FormulaText.
 */
function RichEngineeringText({ content, className = '' }) {
  if (!content) return null
  const lines = String(content).split('\n')

  const renderInlineBold = (line, keyPrefix) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g)
    return segments.map((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-${idx}`} className="font-semibold text-white">
            <FormulaText text={seg.slice(2, -2)} />
          </strong>
        )
      }
      return <FormulaText key={`${keyPrefix}-${idx}`} text={seg} />
    })
  }

  return (
    <div className={`space-y-2 text-sm leading-relaxed text-slate-200 ${className}`}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim()
        if (!line) return <div key={idx} className="h-1" />
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-display text-sm font-bold text-neon-volt">
              {renderInlineBold(line.slice(4), idx)}
            </h4>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-display text-base font-bold text-white">
              {renderInlineBold(line.slice(3), idx)}
            </h3>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-display text-lg font-bold text-neon-volt">
              {renderInlineBold(line.slice(2), idx)}
            </h2>
          )
        }
        // US-18: viñetas Markdown ("* texto" / "- texto") se mostraban con el asterisco crudo
        const bullet = line.match(/^[*-]\s+(.*)$/)
        if (bullet) {
          return (
            <div key={idx} className="flex gap-2">
              <span aria-hidden="true" className="select-none text-neon-volt">•</span>
              <div className="min-w-0 flex-1">{renderInlineBold(bullet[1], idx)}</div>
            </div>
          )
        }
        return <div key={idx}>{renderInlineBold(line, idx)}</div>
      })}
    </div>
  )
}

/**
 * Resolves the active KiloMascot emotion for the current lesson state.
 */
function resolveKiloState(machineState, challengeEmotion, currentFuses) {
  if (machineState === STATES.CIRCUIT_SUCCESS) return 'happy'
  if (machineState === STATES.HINT_RETRY) return 'overheat'
  if (machineState === STATES.SHORT_CIRCUIT_ERROR) return 'shock'
  if (machineState === STATES.LESSON_COMPLETED) return 'happy'
  if (machineState === STATES.PRESENTING_CIRCUIT && currentFuses <= 1) return 'overheat'
  if (machineState === STATES.THEORY_INTRO) return 'idle'
  return challengeEmotion || 'thinking'
}

/**
 * Pre-level view presenting the 3 rubric blocks:
 * 1) Brief explanation, 2) Required formulas, 3) Step-by-step solved example.
 */
function TheoryIntroView({ lesson, sector, onStart }) {
  const [activeTab, setActiveTab] = useState('explanation')
  const hasFormulas = Boolean(lesson.formulas_markdown)
  const hasExample = Boolean(lesson.solved_example_json)

  const tabs = [
    { id: 'explanation', label: '1. Explicación', icon: BookOpen },
    ...(hasFormulas ? [{ id: 'formulas', label: '2. Fórmulas', icon: Calculator }] : []),
    ...(hasExample ? [{ id: 'example', label: '3. Ejemplo Resuelto', icon: Lightbulb }] : []),
  ]

  return (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4 md:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-neon-volt/30 bg-pcb-panel p-3.5">
          <KiloMascot state="idle" size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] uppercase tracking-wider text-neon-volt">
              Unidad {sector.sector_order} · Nivel {lesson.lesson_id}
            </div>
            <h1 className="mt-0.5 font-display text-lg font-bold text-white md:text-xl">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* 3-Block Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={[
                  'flex flex-1 min-w-[130px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 font-display text-xs font-bold transition-all',
                  isActive
                    ? 'border-neon-volt bg-neon-volt/15 text-neon-volt shadow-neon-volt'
                    : 'border-pcb-trace bg-pcb-panel text-slate-300 hover:border-slate-500',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Block 1: Brief Explanation */}
        {activeTab === 'explanation' && (
          <div className="rounded-2xl border border-pcb-trace bg-pcb-panel/95 p-4 md:p-5">
            <RichEngineeringText content={lesson.theory_markdown} />
          </div>
        )}

        {/* Block 2: Formulas */}
        {activeTab === 'formulas' && hasFormulas && (
          <div className="rounded-2xl border border-neon-volt/30 bg-pcb-panel/95 p-4 md:p-5">
            <RichEngineeringText content={lesson.formulas_markdown} />
          </div>
        )}

        {/* Block 3: Solved Example */}
        {activeTab === 'example' && hasExample && (
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-neon-watt/30 bg-pcb-panel/95 p-4 md:grid-cols-12 md:p-5">
            <div className="space-y-3 md:col-span-6">
              <div className="font-mono text-xs uppercase tracking-wider text-neon-watt">
                {lesson.solved_example_json.title || 'Ejemplo Resuelto Paso a Paso'}
              </div>
              <p className="text-sm font-medium text-white">
                {lesson.solved_example_json.problem_statement}
              </p>
              {lesson.solved_example_json.circuit_config_json && (
                <CircuitCanvas
                  config={lesson.solved_example_json.circuit_config_json}
                  isEnergized
                  className="w-full"
                />
              )}
            </div>
            <div className="flex flex-col justify-between space-y-3 md:col-span-6">
              <RichEngineeringText content={lesson.solved_example_json.steps_markdown} />
              {lesson.solved_example_json.final_result && (
                <div className="rounded-xl border border-neon-watt/50 bg-neon-watt/10 px-3.5 py-2.5 font-mono text-xs font-bold text-neon-watt">
                  Resultado: {lesson.solved_example_json.final_result}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto mt-4 w-full max-w-4xl pt-2">
        <NeonButton
          variant="volt"
          fullWidth
          icon={<Zap className="h-4 w-4" />}
          onClick={onStart}
        >
          Iniciar los {lesson.challenges?.length || 4} Ejercicios
        </NeonButton>
      </div>
    </div>
  )
}

export default function LessonRunnerPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()

  const lessonData = useMemo(() => getLessonById(lessonId), [lessonId])
  const currentFuses = useGameStore((s) => s.user.currentFuses)
  const consumeFuse = useGameStore((s) => s.consumeFuse)
  const recordLevelResults = useGameStore((s) => s.recordLevelResults)

  const lesson = lessonData?.lesson || null
  const sector = lessonData?.sector || null
  const challenges = lesson?.challenges || []

  const [machineState, setMachineState] = useState(() => {
    if (!lesson) return STATES.THEORY_INTRO
    return lesson.theory_markdown ? STATES.THEORY_INTRO : STATES.PRESENTING_CIRCUIT
  })
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [numericValue, setNumericValue] = useState('')
  const [selectedUnit, setSelectedUnit] = useState(
    () => challenges[0]?.default_unit || challenges[0]?.unit_options?.[0] || 'A'
  )
  const [sliderValue, setSliderValue] = useState(0)
  const [validationResult, setValidationResult] = useState(null)

  const [correctCount, setCorrectCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [scorePoints, setScorePoints] = useState(0)

  const startedAtRef = useRef(Date.now())
  const completionRecordedRef = useRef(false)

  if (!lesson || !sector) {
    return (
      <div className="bg-pcb-grid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center border-x border-pcb-trace/40 bg-pcb-base px-6 text-center text-slate-100 md:max-w-5xl">
        <KiloMascot state="shock" size="lg" />
        <h1 className="mt-4 font-display text-xl font-bold text-white">
          Nivel #{lessonId} no encontrado
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Este nivel aún no está disponible en el banco local de unidades.
        </p>
        <div className="mt-6 w-full max-w-xs">
          <NeonButton variant="volt" fullWidth onClick={() => navigate('/')}>
            Volver al Selector
          </NeonButton>
        </div>
      </div>
    )
  }

  const challenge = challenges[challengeIdx] || null
  const kiloState = resolveKiloState(machineState, challenge?.kilo_emotion, currentFuses)

  const selectedOption =
    challenge?.options?.find((opt) => opt.id === selectedOptionId) || null

  const slotValues = useMemo(() => {
    if (!challenge || challenge.interaction_type !== 'component_slot' || !selectedOption) {
      return {}
    }
    const slotComp = challenge.circuit_config_json?.components?.find((c) =>
      String(c.type || '').endsWith('_slot')
    )
    if (!slotComp || selectedOption.numeric_value == null) return {}
    return { [slotComp.id]: selectedOption.numeric_value }
  }, [challenge, selectedOption])

  const hasSelection = (() => {
    if (!challenge) return false
    if (challenge.interaction_type === 'numeric_input') {
      return numericValue !== '' && Number.isFinite(Number(numericValue)) && Boolean(selectedUnit)
    }
    if (challenge.interaction_type === 'slider_tuning') return true
    return Boolean(selectedOptionId)
  })()

  const resetInputsForChallenge = (nextChallenge) => {
    setSelectedOptionId(null)
    setNumericValue('')
    setSelectedUnit(
      nextChallenge?.default_unit || nextChallenge?.unit_options?.[0] || 'A'
    )
    setSliderValue(0)
    setValidationResult(null)
    setAttemptCount(0)
  }

  const handleEnergize = () => {
    if (!challenge || machineState !== STATES.PRESENTING_CIRCUIT) return

    let payload = { optionId: selectedOptionId }
    if (challenge.interaction_type === 'numeric_input') {
      payload = { numericValue: Number(numericValue), unit: selectedUnit }
    } else if (challenge.interaction_type === 'slider_tuning') {
      payload = { numericValue: sliderValue }
    }

    const result = validateChallenge(challenge, payload)
    setValidationResult(result)

    if (result.isCorrect) {
      const earned = attemptCount === 0 ? 25 : 15
      setCorrectCount((c) => c + 1)
      setScorePoints((p) => p + earned)
      setMachineState(STATES.CIRCUIT_SUCCESS)
      return
    }

    // First error -> HINT_RETRY (Criterion 7: show hint and allow another try)
    if (attemptCount === 0) {
      setAttemptCount(1)
      setMachineState(STATES.HINT_RETRY)
      return
    }

    // Second error -> finalize exercise and show full procedure
    setAttemptCount(2)
    setErrorCount((e) => e + 1)
    consumeFuse()
    setMachineState(STATES.SHORT_CIRCUIT_ERROR)
  }

  const handleRetryAfterHint = () => {
    setValidationResult(null)
    setMachineState(STATES.PRESENTING_CIRCUIT)
  }

  const handleContinue = () => {
    const nextIdx = challengeIdx + 1
    if (nextIdx < challenges.length) {
      const nextCh = challenges[nextIdx]
      setChallengeIdx(nextIdx)
      resetInputsForChallenge(nextCh)
      setMachineState(STATES.PRESENTING_CIRCUIT)
      return
    }

    // Completed all exercises in the level (Criterion 8)
    if (!completionRecordedRef.current) {
      completionRecordedRef.current = true
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000)
      )
      recordLevelResults({
        lessonId: lesson.lesson_id,
        correctCount,
        errorCount,
        scorePoints,
        fusesLost: errorCount,
        durationSeconds,
      })
    }
    setMachineState(STATES.LESSON_COMPLETED)
  }

  const progressPercent =
    challenges.length > 0
      ? Math.round(
          ((challengeIdx +
            (machineState === STATES.CIRCUIT_SUCCESS ||
            machineState === STATES.SHORT_CIRCUIT_ERROR
              ? 1
              : 0)) /
            challenges.length) *
            100
        )
      : 0

  const isEnergized =
    machineState === STATES.CIRCUIT_SUCCESS
      ? true
      : machineState === STATES.SHORT_CIRCUIT_ERROR || machineState === STATES.HINT_RETRY
        ? false
        : challenge?.circuit_config_json?.is_energized_initially

  const activeCurrentAmps =
    machineState === STATES.CIRCUIT_SUCCESS && validationResult?.resultingCurrentAmps
      ? validationResult.resultingCurrentAmps
      : challenge?.circuit_config_json?.current_speed_amps

  const unitOptions = challenge?.unit_options || DEFAULT_UNITS

  return (
    <motion.div
      animate={
        machineState === STATES.SHORT_CIRCUIT_ERROR || machineState === STATES.HINT_RETRY
          ? { x: [0, -7, 7, -5, 5, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.3 }}
      className="bg-pcb-grid relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden border-x border-pcb-trace/40 bg-pcb-base text-slate-100 md:max-w-5xl"
    >
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-pcb-trace/60 bg-pcb-panel/90 px-4 py-2.5 backdrop-blur-md">
        <Link
          to="/"
          aria-label="Salir del nivel"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-pcb-trace bg-pcb-elevated text-slate-300 transition-colors hover:border-neon-volt/50 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2 font-mono text-[10px] text-slate-400">
            {/* US-18: en 360px el título completo se partía en 4 líneas; el título completo ya está en la tarjeta */}
            <span className="min-w-0 truncate" title={lesson.title}>
              <span className="md:hidden">{String(lesson.title).split(':')[0]}</span>
              <span className="hidden md:inline">{lesson.title}</span>
            </span>
            <span className="shrink-0">
              <span className="hidden sm:inline">Ejercicio </span>
              {Math.min(challengeIdx + 1, challenges.length)} / {challenges.length}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-pcb-elevated">
            <motion.div
              className="h-full rounded-full bg-neon-watt shadow-neon-watt"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <FuseBar fuses={currentFuses} maxFuses={5} compact />
      </header>

      {/* THEORY INTRO (3 Blocks: Explanation, Formulas, Solved Example) */}
      {machineState === STATES.THEORY_INTRO && (
        <TheoryIntroView
          lesson={lesson}
          sector={sector}
          onStart={() => setMachineState(STATES.PRESENTING_CIRCUIT)}
        />
      )}

      {/* ACTIVE CHALLENGE (Responsive: 1 col mobile, 2 cols md:grid-cols-12 desktop) */}
      {(machineState === STATES.PRESENTING_CIRCUIT ||
        machineState === STATES.HINT_RETRY ||
        machineState === STATES.CIRCUIT_SUCCESS ||
        machineState === STATES.SHORT_CIRCUIT_ERROR) &&
        challenge && (
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto px-4 py-3 md:grid-cols-12 md:items-center md:gap-6 md:px-6">
            {/* Left Column (Desktop): Interactive SVG Circuit */}
            <div className="flex min-h-[180px] items-center justify-center md:col-span-7 md:h-full">
              <CircuitCanvas
                config={challenge.circuit_config_json}
                isEnergized={isEnergized}
                currentAmps={activeCurrentAmps}
                fault={validationResult?.fault || null}
                slotValues={slotValues}
                onComponentClick={
                  challenge.interaction_type === 'component_slot'
                    ? (comp) => {
                        if (
                          String(comp.type).endsWith('_slot') &&
                          challenge.options?.length &&
                          !selectedOptionId
                        ) {
                          setSelectedOptionId(challenge.options[0].id)
                        }
                      }
                    : undefined
                }
                className="max-h-full w-full"
              />
            </div>

            {/* Right Column (Desktop): Kilo + Prompt + Controls */}
            <div className="flex flex-col justify-between gap-3 md:col-span-5">
              <div className="flex items-start gap-2.5">
                <KiloMascot state={kiloState} size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1 rounded-2xl border border-pcb-trace bg-pcb-panel px-3.5 py-2.5">
                  <p className="text-[11px] font-medium leading-snug text-neon-volt">
                    {challenge.kilo_dialogue}
                  </p>
                  <div className="mt-1 text-xs font-semibold leading-snug text-white md:text-sm">
                    <FormulaText text={challenge.prompt_text} />
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-2.5">
                {challenge.interaction_type === 'numeric_input' ? (
                  <div className="space-y-2.5 rounded-2xl border border-pcb-trace bg-pcb-panel p-3.5">
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                      Respuesta Numérica + Unidad
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="Ej. 20 o 0.02"
                      value={numericValue}
                      disabled={machineState !== STATES.PRESENTING_CIRCUIT}
                      onChange={(e) => setNumericValue(e.target.value)}
                      className="w-full rounded-xl border border-pcb-trace bg-pcb-base px-3.5 py-2.5 font-mono text-lg text-white placeholder:text-slate-500 focus:border-neon-volt focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {unitOptions.map((unit) => {
                        const isUnitActive = selectedUnit === unit
                        return (
                          <button
                            key={unit}
                            type="button"
                            disabled={machineState !== STATES.PRESENTING_CIRCUIT}
                            onClick={() => setSelectedUnit(unit)}
                            className={[
                              'min-w-[44px] rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold transition-all',
                              isUnitActive
                                ? 'border-neon-volt bg-neon-volt/20 text-neon-volt shadow-neon-volt'
                                : 'border-pcb-trace bg-pcb-elevated text-slate-300 hover:border-slate-500',
                            ].join(' ')}
                          >
                            {unit}
                          </button>
                        )
                      })}
                    </div>
                    <p className="font-mono text-[10px] text-slate-400">
                      Tolerancia de redondeo aceptada: ±{challenge.solution_json?.tolerance_percent ?? 3}% · Verifica la unidad seleccionada.
                    </p>
                  </div>
                ) : challenge.interaction_type === 'slider_tuning' ? (
                  <div className="rounded-xl border border-pcb-trace bg-pcb-panel p-3">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-slate-400">Valor ajustado</span>
                      <span className="text-base font-bold text-neon-volt">{sliderValue}</span>
                    </div>
                    <input
                      type="range"
                      min={challenge.slider_min ?? 0}
                      max={challenge.slider_max ?? 100}
                      step={challenge.slider_step ?? 0.1}
                      value={sliderValue}
                      disabled={machineState !== STATES.PRESENTING_CIRCUIT}
                      onChange={(e) => setSliderValue(Number(e.target.value))}
                      className="mt-2 w-full accent-neon-volt"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(challenge.options || []).map((opt) => {
                      const isSelected = selectedOptionId === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={machineState !== STATES.PRESENTING_CIRCUIT}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={[
                            'min-h-[48px] rounded-xl border-2 border-b-4 px-2.5 py-2 text-center font-mono text-xs font-semibold transition-all',
                            'active:translate-y-0.5 active:border-b-2',
                            isSelected
                              ? 'border-neon-volt bg-neon-volt/15 text-neon-volt shadow-neon-volt'
                              : 'border-pcb-trace bg-pcb-panel text-slate-200 hover:border-slate-500',
                          ].join(' ')}
                        >
                          <FormulaText text={opt.label} />
                        </button>
                      )
                    })}
                  </div>
                )}

                <NeonButton
                  variant="watt"
                  fullWidth
                  disabled={!hasSelection || machineState !== STATES.PRESENTING_CIRCUIT}
                  icon={<Zap className="h-4 w-4" />}
                  onClick={handleEnergize}
                >
                  Comprobar / Energizar
                </NeonButton>
              </div>
            </div>
          </div>
        )}

      {/* LEVEL RESULTS VIEW (Criterion 8: Aciertos, Errores, Puntuación Obtenida) */}
      {machineState === STATES.LESSON_COMPLETED && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <KiloMascot state="happy" size="lg" />
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-neon-watt/40 bg-neon-watt/10 px-3 py-1 font-mono text-xs text-neon-watt">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nivel Completado</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">
            {lesson.title}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Resultados registrados en tu navegador
          </p>

          <div className="mt-5 grid w-full max-w-lg grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neon-watt/40 bg-pcb-panel p-4">
              <div className="font-mono text-[11px] uppercase text-slate-400">Aciertos</div>
              <div className="mt-1 font-display text-2xl font-bold text-neon-watt">
                {correctCount} / {challenges.length}
              </div>
            </div>
            <div className="rounded-2xl border border-neon-short/40 bg-pcb-panel p-4">
              <div className="font-mono text-[11px] uppercase text-slate-400">Errores</div>
              <div className="mt-1 font-display text-2xl font-bold text-neon-short">
                {errorCount}
              </div>
            </div>
            <div className="rounded-2xl border border-neon-volt/40 bg-pcb-panel p-4">
              <div className="font-mono text-[11px] uppercase text-slate-400">Puntuación</div>
              <div className="mt-1 font-display text-2xl font-bold text-neon-volt">
                {scorePoints} pts
              </div>
            </div>
          </div>

          <div className="mt-6 w-full max-w-sm">
            <NeonButton
              variant="watt"
              fullWidth
              icon={<Award className="h-4 w-4" />}
              onClick={() => navigate('/')}
            >
              Volver al Selector de Niveles
            </NeonButton>
          </div>
        </div>
      )}

      {/* FEEDBACK BOTTOM SHEET DRAWER (HINT_RETRY vs SUCCESS/ERROR) */}
      <AnimatePresence>
        {(machineState === STATES.HINT_RETRY ||
          machineState === STATES.CIRCUIT_SUCCESS ||
          machineState === STATES.SHORT_CIRCUIT_ERROR) &&
          challenge && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={[
                'absolute inset-x-0 bottom-0 z-50 rounded-t-3xl border-t-2 bg-pcb-panel p-4 shadow-2xl md:p-5',
                machineState === STATES.CIRCUIT_SUCCESS
                  ? 'border-neon-watt shadow-neon-watt'
                  : machineState === STATES.HINT_RETRY
                    ? 'border-neon-amp shadow-[0_0_20px_rgba(255,184,0,0.35)]'
                    : 'border-neon-short shadow-neon-short',
              ].join(' ')}
            >
              <div className="mx-auto max-w-4xl">
                <div className="flex items-center gap-2">
                  {machineState === STATES.CIRCUIT_SUCCESS ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-neon-watt" />
                      <span className="font-display text-base font-bold text-neon-watt">
                        ¡Correcto! Circuito Energizado
                      </span>
                    </>
                  ) : machineState === STATES.HINT_RETRY ? (
                    <>
                      <Lightbulb className="h-5 w-5 text-neon-amp" />
                      <span className="font-display text-base font-bold text-neon-amp">
                        Respuesta Incorrecta — ¡Tienes otro intento!
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-neon-short" />
                      <span className="font-display text-base font-bold text-neon-short">
                        Incorrecto — Revisa el procedimiento correcto
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-2.5 max-h-44 overflow-y-auto rounded-xl border border-pcb-trace/70 bg-pcb-base/70 p-3">
                  {machineState === STATES.HINT_RETRY ? (
                    <div className="space-y-2">
                      {validationResult?.unitError && (
                        <div className="rounded-lg border border-neon-amp/40 bg-neon-amp/10 px-2.5 py-1.5 font-mono text-xs text-neon-amp">
                          {validationResult.unitError}
                        </div>
                      )}
                      <RichEngineeringText
                        content={
                          challenge.hint_markdown ||
                          '💡 **Pista de K-1L0:** Revisa las fórmulas de la cápsula previa, verifica tus unidades y vuelve a intentarlo.'
                        }
                      />
                    </div>
                  ) : (
                    <RichEngineeringText content={challenge.explanation_markdown} />
                  )}
                </div>

                <div className="mt-3">
                  {machineState === STATES.HINT_RETRY ? (
                    <NeonButton
                      variant="amp"
                      fullWidth
                      icon={<RotateCcw className="h-4 w-4" />}
                      onClick={handleRetryAfterHint}
                    >
                      Intentar de Nuevo
                    </NeonButton>
                  ) : (
                    <NeonButton
                      variant={machineState === STATES.CIRCUIT_SUCCESS ? 'watt' : 'short'}
                      fullWidth
                      onClick={handleContinue}
                    >
                      {challengeIdx + 1 < challenges.length
                        ? 'Siguiente Ejercicio'
                        : 'Ver Resultados del Nivel'}
                    </NeonButton>
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  )
}
