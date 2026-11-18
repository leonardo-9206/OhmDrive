import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
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
  CIRCUIT_SUCCESS: 'CIRCUIT_SUCCESS',
  SHORT_CIRCUIT_ERROR: 'SHORT_CIRCUIT_ERROR',
  GAME_OVER_MODAL: 'GAME_OVER_MODAL',
  LESSON_COMPLETED: 'LESSON_COMPLETED',
}

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
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-display text-lg font-bold text-neon-volt">
              {renderInlineBold(line.slice(2), idx)}
            </h2>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-display text-base font-bold text-white">
              {renderInlineBold(line.slice(3), idx)}
            </h3>
          )
        }
        return <p key={idx}>{renderInlineBold(line, idx)}</p>
      })}
    </div>
  )
}

/**
 * Resolves the active KiloMascot emotion for the current lesson state.
 */
function resolveKiloState(machineState, challengeEmotion, currentFuses) {
  if (machineState === STATES.CIRCUIT_SUCCESS) return 'happy'
  if (machineState === STATES.SHORT_CIRCUIT_ERROR) return 'shock'
  if (machineState === STATES.GAME_OVER_MODAL) return 'shock'
  if (machineState === STATES.LESSON_COMPLETED) return 'happy'
  if (machineState === STATES.PRESENTING_CIRCUIT && currentFuses <= 1) return 'overheat'
  if (machineState === STATES.THEORY_INTRO) return 'idle'
  return challengeEmotion || 'thinking'
}

export default function LessonRunnerPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()

  const lessonData = useMemo(() => getLessonById(lessonId), [lessonId])
  const currentFuses = useGameStore((s) => s.user.currentFuses)
  const consumeFuse = useGameStore((s) => s.consumeFuse)
  const refillFuses = useGameStore((s) => s.refillFuses)
  const completeLessonNode = useGameStore((s) => s.completeLessonNode)

  const lesson = lessonData?.lesson || null
  const sector = lessonData?.sector || null
  const challenges = lesson?.challenges || []

  const [machineState, setMachineState] = useState(() => {
    if (!lesson) return STATES.THEORY_INTRO
    if (currentFuses <= 0) return STATES.GAME_OVER_MODAL
    return lesson.theory_markdown ? STATES.THEORY_INTRO : STATES.PRESENTING_CIRCUIT
  })
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [sliderValue, setSliderValue] = useState(0)
  const [validationResult, setValidationResult] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [fusesLostRun, setFusesLostRun] = useState(0)

  const startedAtRef = useRef(Date.now())
  const completionRecordedRef = useRef(false)

  if (!lesson || !sector) {
    return (
      <div className="bg-pcb-grid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center border-x border-pcb-trace/40 bg-pcb-base px-6 text-center text-slate-100">
        <KiloMascot state="shock" size="lg" />
        <h1 className="mt-4 font-display text-xl font-bold text-white">
          Lección #{lessonId} no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Este nodo aún no está disponible en el banco local de sectores.
        </p>
        <div className="mt-6 w-full">
          <NeonButton variant="volt" fullWidth onClick={() => navigate('/')}>
            Volver al Mapa
          </NeonButton>
        </div>
      </div>
    )
  }

  const challenge = challenges[challengeIdx] || null
  const kiloState = resolveKiloState(machineState, challenge?.kilo_emotion, currentFuses)

  const selectedOption =
    challenge?.options?.find((opt) => opt.id === selectedOptionId) || null

  // Map selected option numeric_value into any *_slot component for live SVG preview
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

  const hasSelection =
    challenge?.interaction_type === 'slider_tuning'
      ? true
      : Boolean(selectedOptionId)

  const resetChallengeInputs = () => {
    setSelectedOptionId(null)
    setSliderValue(0)
    setValidationResult(null)
  }

  const handleRestartLesson = () => {
    refillFuses()
    setChallengeIdx(0)
    setCorrectCount(0)
    setFusesLostRun(0)
    startedAtRef.current = Date.now()
    completionRecordedRef.current = false
    resetChallengeInputs()
    setMachineState(STATES.PRESENTING_CIRCUIT)
  }

  const handleEnergize = () => {
    if (!challenge || machineState !== STATES.PRESENTING_CIRCUIT) return

    const payload =
      challenge.interaction_type === 'slider_tuning'
        ? { numericValue: sliderValue }
        : { optionId: selectedOptionId }

    const result = validateChallenge(challenge, payload)
    setValidationResult(result)

    if (result.isCorrect) {
      setCorrectCount((c) => c + 1)
      setMachineState(STATES.CIRCUIT_SUCCESS)
    } else {
      consumeFuse()
      setFusesLostRun((f) => f + 1)
      setMachineState(STATES.SHORT_CIRCUIT_ERROR)
    }
  }

  const handleContinue = () => {
    if (machineState === STATES.SHORT_CIRCUIT_ERROR && currentFuses <= 0) {
      setMachineState(STATES.GAME_OVER_MODAL)
      return
    }

    const nextIdx = challengeIdx + 1
    if (nextIdx < challenges.length) {
      setChallengeIdx(nextIdx)
      resetChallengeInputs()
      setMachineState(STATES.PRESENTING_CIRCUIT)
      return
    }

    // Completed all challenges in the lesson
    if (!completionRecordedRef.current) {
      completionRecordedRef.current = true
      const total = Math.max(1, challenges.length)
      const scorePercentage = Math.round((correctCount / total) * 100)
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000)
      )
      completeLessonNode({
        sectorId: sector.sector_id,
        nodeOrder: lesson.node_order,
        lessonId: lesson.lesson_id,
        wattsEarned: lesson.xp_reward || 50,
        fusesLost: fusesLostRun,
        scorePercentage,
        durationSeconds,
      })
    }
    setMachineState(STATES.LESSON_COMPLETED)
  }

  const progressPercent =
    challenges.length > 0
      ? Math.round(
          ((challengeIdx + (machineState === STATES.CIRCUIT_SUCCESS ? 1 : 0)) /
            challenges.length) *
            100
        )
      : 0

  const isEnergized =
    machineState === STATES.CIRCUIT_SUCCESS
      ? true
      : machineState === STATES.SHORT_CIRCUIT_ERROR
        ? false
        : challenge?.circuit_config_json?.is_energized_initially

  const activeCurrentAmps =
    machineState === STATES.CIRCUIT_SUCCESS && validationResult?.resultingCurrentAmps
      ? validationResult.resultingCurrentAmps
      : challenge?.circuit_config_json?.current_speed_amps

  return (
    <motion.div
      animate={
        machineState === STATES.SHORT_CIRCUIT_ERROR
          ? { x: [0, -8, 8, -6, 6, -3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.35 }}
      className="bg-pcb-grid relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden border-x border-pcb-trace/40 bg-pcb-base text-slate-100"
    >
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-pcb-trace/60 bg-pcb-panel/90 px-4 py-2.5 backdrop-blur-md">
        <Link
          to="/"
          aria-label="Salir de la lección"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-pcb-trace bg-pcb-elevated text-slate-300 transition-colors hover:border-neon-volt/50 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="flex-1">
          <div className="h-3 w-full overflow-hidden rounded-full bg-pcb-elevated">
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

      {/* THEORY INTRO STATE */}
      {machineState === STATES.THEORY_INTRO && (
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-neon-volt/30 bg-pcb-panel p-3">
              <KiloMascot state="idle" size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-neon-volt">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Cápsula de Teoría · Nodo {sector.sector_order}.{lesson.node_order}</span>
                </div>
                <h1 className="mt-0.5 font-display text-base font-bold text-white">
                  {lesson.title}
                </h1>
              </div>
            </div>

            <div className="rounded-2xl border border-pcb-trace bg-pcb-panel/95 p-4">
              <RichEngineeringText content={lesson.theory_markdown} />
            </div>
          </div>

          <div className="mt-4 pt-2">
            <NeonButton
              variant="volt"
              fullWidth
              icon={<Zap className="h-4 w-4" />}
              onClick={() => setMachineState(STATES.PRESENTING_CIRCUIT)}
            >
              Entendido — Iniciar Retos
            </NeonButton>
          </div>
        </div>
      )}

      {/* ACTIVE CHALLENGE STATES (100dvh no-scroll mobile layout) */}
      {(machineState === STATES.PRESENTING_CIRCUIT ||
        machineState === STATES.CIRCUIT_SUCCESS ||
        machineState === STATES.SHORT_CIRCUIT_ERROR) &&
        challenge && (
          <div className="flex flex-1 flex-col justify-between gap-2 overflow-hidden px-4 py-3">
            {/* Kilo + Mission Bubble */}
            <div className="flex shrink-0 items-start gap-2.5">
              <KiloMascot state={kiloState} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1 rounded-2xl border border-pcb-trace bg-pcb-panel px-3 py-2">
                <p className="text-[11px] font-medium leading-snug text-neon-volt">
                  {challenge.kilo_dialogue}
                </p>
                <div className="mt-1 text-xs font-semibold leading-snug text-white">
                  <FormulaText text={challenge.prompt_text} />
                </div>
              </div>
            </div>

            {/* Interactive SVG Circuit Canvas */}
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <CircuitCanvas
                config={challenge.circuit_config_json}
                isEnergized={isEnergized}
                currentAmps={activeCurrentAmps}
                fault={validationResult?.fault || null}
                slotValues={slotValues}
                onComponentClick={
                  challenge.interaction_type === 'component_slot'
                    ? (comp) => {
                        if (String(comp.type).endsWith('_slot') && challenge.options?.length && !selectedOptionId) {
                          setSelectedOptionId(challenge.options[0].id)
                        }
                      }
                    : undefined
                }
                className="max-h-full w-full"
              />
            </div>

            {/* Action Panel: Options / Slider + Energize Button */}
            <div className="shrink-0 space-y-2.5">
              {challenge.interaction_type === 'slider_tuning' ? (
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
                Energizar Circuito
              </NeonButton>
            </div>
          </div>
        )}

      {/* GAME OVER MODAL (0 Fuses) */}
      {machineState === STATES.GAME_OVER_MODAL && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <KiloMascot state="shock" size="lg" />
          <div className="mt-4 flex items-center gap-2 text-neon-short">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-widest">
              Fusibles Agotados
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">
            ¡Se fundieron tus 5 fusibles!
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Recarga tus fusibles de protección o repasa la cápsula de teoría antes de volver a energizar la red.
          </p>
          <div className="mt-6 w-full space-y-2.5">
            <NeonButton
              variant="volt"
              fullWidth
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleRestartLesson}
            >
              Recargar Fusibles y Reintentar
            </NeonButton>
            <NeonButton
              variant="panel"
              fullWidth
              icon={<BookOpen className="h-4 w-4" />}
              onClick={() => {
                refillFuses()
                setChallengeIdx(0)
                setCorrectCount(0)
                setFusesLostRun(0)
                resetChallengeInputs()
                setMachineState(STATES.THEORY_INTRO)
              }}
            >
              Repasar Teoría
            </NeonButton>
            <NeonButton variant="panel" fullWidth onClick={() => navigate('/')}>
              Volver al Mapa
            </NeonButton>
          </div>
        </div>
      )}

      {/* LESSON COMPLETED VIEW */}
      {machineState === STATES.LESSON_COMPLETED && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <KiloMascot state="happy" size="lg" />
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-neon-watt/40 bg-neon-watt/10 px-3 py-1 font-mono text-xs text-neon-watt">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nodo Restaurado</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">
            ¡Lección Completada!
          </h2>
          <p className="mt-1 text-sm text-slate-300">{lesson.title}</p>

          <div className="mt-5 grid w-full grid-cols-3 gap-2">
            <div className="rounded-xl border border-pcb-trace bg-pcb-panel p-3">
              <div className="font-mono text-[10px] uppercase text-slate-400">Watts XP</div>
              <div className="mt-1 font-display text-lg font-bold text-neon-volt">
                +{lesson.xp_reward || 50}
              </div>
            </div>
            <div className="rounded-xl border border-pcb-trace bg-pcb-panel p-3">
              <div className="font-mono text-[10px] uppercase text-slate-400">Precisión</div>
              <div className="mt-1 font-display text-lg font-bold text-neon-watt">
                {Math.round((correctCount / Math.max(1, challenges.length)) * 100)}%
              </div>
            </div>
            <div className="rounded-xl border border-pcb-trace bg-pcb-panel p-3">
              <div className="font-mono text-[10px] uppercase text-slate-400">Fusibles</div>
              <div className="mt-1 font-display text-lg font-bold text-neon-amp">
                -{fusesLostRun}
              </div>
            </div>
          </div>

          <div className="mt-6 w-full">
            <NeonButton
              variant="watt"
              fullWidth
              icon={<Award className="h-4 w-4" />}
              onClick={() => navigate('/')}
            >
              Volver al Mapa
            </NeonButton>
          </div>
        </div>
      )}

      {/* FEEDBACK BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {(machineState === STATES.CIRCUIT_SUCCESS ||
          machineState === STATES.SHORT_CIRCUIT_ERROR) &&
          challenge && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={[
                'absolute inset-x-0 bottom-0 z-50 rounded-t-3xl border-t-2 bg-pcb-panel p-4 shadow-2xl',
                machineState === STATES.CIRCUIT_SUCCESS
                  ? 'border-neon-watt shadow-neon-watt'
                  : 'border-neon-short shadow-neon-short',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                {machineState === STATES.CIRCUIT_SUCCESS ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-neon-watt" />
                    <span className="font-display text-base font-bold text-neon-watt">
                      ¡Circuito Energizado!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-neon-short" />
                    <span className="font-display text-base font-bold text-neon-short">
                      {validationResult?.fault?.type === 'overheat'
                        ? '¡Resistencia Quemada! (-1 Fusible)'
                        : '¡Cortocircuito Detectado! (-1 Fusible)'}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-2.5 max-h-40 overflow-y-auto rounded-xl border border-pcb-trace/70 bg-pcb-base/70 p-3">
                <RichEngineeringText content={challenge.explanation_markdown} />
              </div>

              <div className="mt-3">
                <NeonButton
                  variant={machineState === STATES.CIRCUIT_SUCCESS ? 'watt' : 'short'}
                  fullWidth
                  onClick={handleContinue}
                >
                  Continuar
                </NeonButton>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  )
}
