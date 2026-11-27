import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Play,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  StopCircle,
  XCircle,
  Zap,
} from 'lucide-react'
import { sectorsList, getAllLessons } from '../data/sectors'
import { validateChallenge } from '../engine/challengeValidator'
import { useGameStore } from '../store/useGameStore'
import { recordPracticeSession } from '../services/supabaseClient'
import { FormulaText, NeonButton, NumericUnitInput } from '../components/ui'
import KiloMascot from '../components/mascot/KiloMascot'
import CircuitCanvas from '../components/circuit-svg/CircuitCanvas'

const PHASES = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  SUMMARY: 'SUMMARY',
}

const FEEDBACK = {
  NONE: 'NONE',
  HINT: 'HINT',
  CORRECT: 'CORRECT',
  WRONG: 'WRONG',
}

const TIME_ATTACK_SECONDS = 120

/**
 * Fisher-Yates shuffle returning a new array copy.
 */
function shuffleArray(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Formats seconds as MM:SS for the Time Attack timer.
 */
function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Lightweight markdown renderer with KaTeX support via FormulaText.
 */
function PracticeMarkdown({ content }) {
  if (!content) return null
  const lines = String(content).split('\n')

  const renderBold = (line, keyPrefix) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-${idx}`} className="font-semibold text-white">
            <FormulaText text={seg.slice(2, -2)} />
          </strong>
        )
      }
      return <FormulaText key={`${keyPrefix}-${idx}`} text={seg} />
    })

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-slate-200 md:text-sm">
      {lines.map((raw, idx) => {
        const line = raw.trim()
        if (!line) return <div key={idx} className="h-1" />
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-display text-xs font-bold text-neon-volt md:text-sm">
              {renderBold(line.slice(4), idx)}
            </h4>
          )
        }
        return <div key={idx}>{renderBold(line, idx)}</div>
      })}
    </div>
  )
}

export default function PracticePage() {
  const user = useGameStore((s) => s.user)
  const addWatts = useGameStore((s) => s.addWatts)

  // Build topic filters from the official 3 Units / 6 Levels
  const allLessons = useMemo(() => getAllLessons(), [])
  const topicOptions = useMemo(() => {
    const allChallenges = allLessons.flatMap((lesson) =>
      (lesson.challenges || []).map((ch) => ({
        ...ch,
        _sectorId: lesson.sector_id,
        _lessonTitle: lesson.title,
      }))
    )
    const perTopic = allLessons.map((lesson) => {
      const parentSector = sectorsList.find((s) => s.sector_id === lesson.sector_id)
      return {
        id: lesson.topic_tag,
        label: lesson.title,
        subtitle: parentSector?.title || `Unidad ${lesson.sector_id}`,
        sectorId: lesson.sector_id,
        count: (lesson.challenges || []).length,
        challenges: (lesson.challenges || []).map((ch) => ({
          ...ch,
          _sectorId: lesson.sector_id,
          _lessonTitle: lesson.title,
        })),
      }
    })
    return [
      {
        id: 'mix',
        label: 'Mix Aleatorio (Todos los Temas)',
        subtitle: 'Unidades 1, 2 y 3 · Corriente Directa',
        sectorId: null,
        count: allChallenges.length,
        challenges: allChallenges,
      },
      ...perTopic,
    ]
  }, [allLessons])

  // Lobby configuration
  const [practiceMode, setPracticeMode] = useState('topic_drill') // 'topic_drill' | 'time_attack'
  const [selectedTopicId, setSelectedTopicId] = useState('mix')

  // Session state
  const [phase, setPhase] = useState(PHASES.LOBBY)
  const [queue, setQueue] = useState([])
  const [queueIdx, setQueueIdx] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const [feedbackState, setFeedbackState] = useState(FEEDBACK.NONE)
  const [validationResult, setValidationResult] = useState(null)

  // Inputs
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [numericValue, setNumericValue] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('A')

  // Score & Timer
  const [timeLeft, setTimeLeft] = useState(TIME_ATTACK_SECONDS)
  const [questionsSolved, setQuestionsSolved] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [wattsEarned, setWattsEarned] = useState(0)

  const sessionSavedRef = useRef(false)
  const activeTopic =
    topicOptions.find((t) => t.id === selectedTopicId) || topicOptions[0]
  const challenge = queue[queueIdx] || null

  const resetInputs = useCallback((nextChallenge) => {
    setSelectedOptionId(null)
    setNumericValue('')
    setSelectedUnit(
      nextChallenge?.default_unit || nextChallenge?.unit_options?.[0] || 'A'
    )
    setAttemptCount(0)
    setFeedbackState(FEEDBACK.NONE)
    setValidationResult(null)
  }, [])

  const finishSession = useCallback(
    (finalSolved, finalCorrect, finalWatts) => {
      if (!sessionSavedRef.current && finalSolved > 0) {
        sessionSavedRef.current = true
        if (finalWatts > 0) {
          addWatts(finalWatts)
        }
        recordPracticeSession({
          userId: user?.userId,
          sectorId: activeTopic?.sectorId ?? null,
          practiceMode,
          questionsSolved: finalSolved,
          correctAnswers: finalCorrect,
          wattsEarned: finalWatts,
        }).catch(() => {})
      }
      setPhase(PHASES.SUMMARY)
    },
    [addWatts, activeTopic, practiceMode, user?.userId]
  )

  // Countdown timer for Sobrecarga Contrarreloj (120s)
  useEffect(() => {
    if (phase !== PHASES.PLAYING || practiceMode !== 'time_attack') return
    if (timeLeft <= 0) {
      finishSession(questionsSolved, correctAnswers, wattsEarned)
      return
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timerId)
  }, [
    phase,
    practiceMode,
    timeLeft,
    finishSession,
    questionsSolved,
    correctAnswers,
    wattsEarned,
  ])

  const startPractice = () => {
    const pool = activeTopic?.challenges || []
    if (!pool.length) return
    const shuffled = shuffleArray(pool)
    sessionSavedRef.current = false
    setQueue(shuffled)
    setQueueIdx(0)
    setQuestionsSolved(0)
    setCorrectAnswers(0)
    setCurrentStreak(0)
    setBestStreak(0)
    setWattsEarned(0)
    setTimeLeft(TIME_ATTACK_SECONDS)
    resetInputs(shuffled[0])
    setPhase(PHASES.PLAYING)
  }

  const handleCheckAnswer = () => {
    if (!challenge || feedbackState !== FEEDBACK.NONE) return

    const payload =
      challenge.interaction_type === 'numeric_input'
        ? { numericValue: Number(numericValue), unit: selectedUnit }
        : { optionId: selectedOptionId }

    const result = validateChallenge(challenge, payload)
    setValidationResult(result)

    if (result.isCorrect) {
      const nextStreak = currentStreak + 1
      const baseWatts = practiceMode === 'time_attack' ? 20 : 15
      const streakBonus = nextStreak >= 3 ? 5 : 0
      setQuestionsSolved((q) => q + 1)
      setCorrectAnswers((c) => c + 1)
      setCurrentStreak(nextStreak)
      setBestStreak((b) => Math.max(b, nextStreak))
      setWattsEarned((w) => w + baseWatts + streakBonus)
      setFeedbackState(FEEDBACK.CORRECT)
      return
    }

    // In Entrenamiento Libre, allow 1 hint + retry before revealing full solution
    if (practiceMode === 'topic_drill' && attemptCount === 0) {
      setAttemptCount(1)
      setFeedbackState(FEEDBACK.HINT)
      return
    }

    setQuestionsSolved((q) => q + 1)
    setCurrentStreak(0)
    setFeedbackState(FEEDBACK.WRONG)
  }

  const handleNextChallenge = () => {
    const nextIdx = queueIdx + 1
    if (nextIdx < queue.length) {
      setQueueIdx(nextIdx)
      resetInputs(queue[nextIdx])
    } else {
      // Infinite practice: reshuffle pool seamlessly
      const reshuffled = shuffleArray(activeTopic?.challenges || queue)
      setQueue(reshuffled)
      setQueueIdx(0)
      resetInputs(reshuffled[0])
    }
  }

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
    return Boolean(selectedOptionId)
  })()

  const kiloState = (() => {
    if (phase === PHASES.SUMMARY) {
      const acc = questionsSolved > 0 ? (correctAnswers / questionsSolved) * 100 : 0
      return acc >= 70 ? 'happy' : 'thinking'
    }
    if (feedbackState === FEEDBACK.CORRECT) return 'happy'
    if (feedbackState === FEEDBACK.HINT) return 'overheat'
    if (feedbackState === FEEDBACK.WRONG) return 'shock'
    if (practiceMode === 'time_attack' && timeLeft <= 15) return 'overheat'
    return challenge?.kilo_emotion || 'thinking'
  })()

  // ==================== LOBBY VIEW ====================
  if (phase === PHASES.LOBBY) {
    return (
      <section className="space-y-5">
        {/* Hero Header */}
        <div className="flex flex-col gap-3 rounded-2xl border border-neon-amp/40 bg-pcb-panel p-4 shadow-[0_0_20px_rgba(255,184,0,0.12)] md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex items-center gap-3.5">
            <KiloMascot state="idle" size="sm" className="shrink-0" />
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-neon-amp">
                <Zap className="h-4 w-4" />
                <span>Modo Práctica · Arcade &amp; Contrarreloj</span>
              </div>
              <h1 className="mt-0.5 font-display text-xl font-bold text-white md:text-2xl">
                Entrenamiento Rápido en CD
              </h1>
              <p className="mt-0.5 text-xs text-slate-300 md:text-sm">
                Practica sin bloqueos cualquier tema de los 6 niveles oficiales o compite en Sobrecarga 120s.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-mode Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5 text-neon-volt" />
            <span>1. Elige la Modalidad</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPracticeMode('topic_drill')}
              className={[
                'rounded-2xl border-2 p-4 text-left transition-all',
                practiceMode === 'topic_drill'
                  ? 'border-neon-volt bg-neon-volt/10 shadow-neon-volt'
                  : 'border-pcb-trace bg-pcb-panel hover:border-slate-500',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold text-white">
                  Entrenamiento Libre
                </span>
                <span className="rounded-lg border border-neon-watt/40 bg-neon-watt/10 px-2 py-0.5 font-mono text-[10px] font-bold text-neon-watt">
                  SIN FUSIBLES
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-300">
                Ejercicios continuos con pista ante el primer error y explicación paso a paso en KaTeX (+15 W/acierto).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPracticeMode('time_attack')}
              className={[
                'rounded-2xl border-2 p-4 text-left transition-all',
                practiceMode === 'time_attack'
                  ? 'border-neon-amp bg-neon-amp/10 shadow-[0_0_15px_rgba(255,184,0,0.3)]'
                  : 'border-pcb-trace bg-pcb-panel hover:border-slate-500',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold text-white">
                  Sobrecarga Contrarreloj
                </span>
                <span className="flex items-center gap-1 rounded-lg border border-neon-amp/50 bg-neon-amp/15 px-2 py-0.5 font-mono text-[10px] font-bold text-neon-amp">
                  <Clock className="h-3 w-3" />
                  120s
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-300">
                Resuelve la mayor cantidad de circuitos en 2 minutos para sumar Watts XP (+20 W + bono de racha).
              </p>
            </button>
          </div>
        </div>

        {/* Topic Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-slate-400">
            <Shuffle className="h-3.5 w-3.5 text-neon-amp" />
            <span>2. Selecciona el Tema a Practicar</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {topicOptions.map((topic) => {
              const isSelected = selectedTopicId === topic.id
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={[
                    'flex items-center justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition-all',
                    isSelected
                      ? 'border-neon-volt bg-neon-volt/10 text-white shadow-neon-volt'
                      : 'border-pcb-trace bg-pcb-panel text-slate-200 hover:border-slate-500',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    {/* US-18: en 360px el truncate cortaba "Nivel 1: Voltaje, Corriente y Resi…" */}
                    <div className="font-display text-sm font-bold leading-snug text-white">
                      {topic.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {topic.subtitle}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg border border-pcb-trace bg-pcb-elevated px-2.5 py-1 font-mono text-xs font-bold text-neon-volt">
                    {topic.count} retos
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Start Button */}
        <NeonButton
          variant={practiceMode === 'time_attack' ? 'amp' : 'volt'}
          size="lg"
          fullWidth
          icon={<Play className="h-4 w-4 fill-current" />}
          onClick={startPractice}
        >
          {practiceMode === 'time_attack'
            ? 'Iniciar Sobrecarga 120s'
            : 'Iniciar Entrenamiento Libre'}
        </NeonButton>
      </section>
    )
  }

  // ==================== SUMMARY VIEW ====================
  if (phase === PHASES.SUMMARY) {
    const accuracy =
      questionsSolved > 0 ? Math.round((correctAnswers / questionsSolved) * 100) : 0

    return (
      <section className="mx-auto flex max-w-xl flex-col items-center py-4 text-center">
        <KiloMascot state={kiloState} size="lg" />
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neon-amp/40 bg-neon-amp/10 px-3 py-1 font-mono text-xs text-neon-amp">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {practiceMode === 'time_attack'
              ? '¡Tiempo Agotado — Sobrecarga Completada!'
              : 'Sesión de Entrenamiento Finalizada'}
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">
          {activeTopic?.label}
        </h2>

        <div className="mt-5 grid w-full grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-3.5">
            <div className="font-mono text-[10px] uppercase text-slate-400">Resueltos</div>
            <div className="mt-1 font-display text-2xl font-bold text-white">
              {questionsSolved}
            </div>
          </div>
          <div className="rounded-2xl border border-neon-watt/40 bg-pcb-panel p-3.5">
            <div className="font-mono text-[10px] uppercase text-slate-400">Aciertos</div>
            <div className="mt-1 font-display text-2xl font-bold text-neon-watt">
              {correctAnswers} ({accuracy}%)
            </div>
          </div>
          <div className="rounded-2xl border border-neon-amp/40 bg-pcb-panel p-3.5">
            <div className="font-mono text-[10px] uppercase text-slate-400">Mejor Racha</div>
            <div className="mt-1 font-display text-2xl font-bold text-neon-amp">
              x{bestStreak}
            </div>
          </div>
          <div className="rounded-2xl border border-neon-volt/40 bg-pcb-panel p-3.5">
            <div className="font-mono text-[10px] uppercase text-slate-400">Watts XP</div>
            <div className="mt-1 font-display text-2xl font-bold text-neon-volt">
              +{wattsEarned} W
            </div>
          </div>
        </div>

        <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          <NeonButton
            variant="volt"
            fullWidth
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={startPractice}
          >
            Jugar Otra Vez
          </NeonButton>
          <NeonButton
            variant="panel"
            fullWidth
            icon={<Award className="h-4 w-4" />}
            onClick={() => setPhase(PHASES.LOBBY)}
          >
            Cambiar Tema / Modo
          </NeonButton>
        </div>
      </section>
    )
  }

  // ==================== PLAYING VIEW ====================
  const isEnergized =
    feedbackState === FEEDBACK.CORRECT
      ? true
      : feedbackState === FEEDBACK.WRONG || feedbackState === FEEDBACK.HINT
        ? false
        : challenge?.circuit_config_json?.is_energized_initially

  const activeCurrentAmps =
    feedbackState === FEEDBACK.CORRECT && validationResult?.resultingCurrentAmps
      ? validationResult.resultingCurrentAmps
      : challenge?.circuit_config_json?.current_speed_amps

  return (
    <section className="space-y-4">
      {/* Live Practice HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-pcb-trace bg-pcb-panel px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => finishSession(questionsSolved, correctAnswers, wattsEarned)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-pcb-trace bg-pcb-elevated px-3 py-1.5 font-mono text-xs font-semibold text-slate-200 transition-colors hover:border-neon-short/60 hover:text-neon-short"
          >
            <StopCircle className="h-4 w-4" />
            <span>Terminar</span>
          </button>
          <span className="hidden font-mono text-xs text-slate-400 sm:inline">
            {challenge?._lessonTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold">
          {practiceMode === 'time_attack' && (
            <div
              className={[
                'flex items-center gap-1 rounded-xl border px-2.5 py-1',
                timeLeft <= 15
                  ? 'animate-pulse border-neon-short bg-neon-short/15 text-neon-short'
                  : 'border-neon-amp/50 bg-neon-amp/10 text-neon-amp',
              ].join(' ')}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatClock(timeLeft)}</span>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-xl border border-pcb-trace bg-pcb-elevated px-2.5 py-1 text-neon-watt">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {correctAnswers}/{questionsSolved}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-pcb-trace bg-pcb-elevated px-2.5 py-1 text-neon-amp">
            <Flame className="h-3.5 w-3.5" />
            <span>x{currentStreak}</span>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-pcb-trace bg-pcb-elevated px-2.5 py-1 text-neon-volt">
            <Zap className="h-3.5 w-3.5" />
            <span>+{wattsEarned} W</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Practice Grid */}
      {challenge && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start">
          {/* Left: SVG Circuit */}
          <div className="rounded-2xl border border-pcb-trace bg-pcb-panel/60 p-3 md:col-span-7">
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
              className="w-full"
            />
          </div>

          {/* Right: Kilo + Prompt + Controls */}
          <div className="space-y-3 md:col-span-5">
            <div className="flex items-start gap-2.5 rounded-2xl border border-pcb-trace bg-pcb-panel p-3.5">
              <KiloMascot state={kiloState} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-snug text-neon-volt">
                  {challenge.kilo_dialogue}
                </p>
                <div className="mt-1 text-xs font-semibold leading-snug text-white md:text-sm">
                  <FormulaText text={challenge.prompt_text} />
                </div>
              </div>
            </div>

            {challenge.interaction_type === 'numeric_input' ? (
              <div className="rounded-2xl border border-pcb-trace bg-pcb-panel p-3.5">
                <NumericUnitInput
                  value={numericValue}
                  unit={selectedUnit}
                  onValueChange={setNumericValue}
                  onUnitChange={setSelectedUnit}
                  unitOptions={challenge.unit_options}
                  tolerancePercent={challenge.solution_json?.tolerance_percent ?? 3}
                  disabled={feedbackState !== FEEDBACK.NONE}
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
                      disabled={feedbackState !== FEEDBACK.NONE}
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

            {feedbackState === FEEDBACK.NONE && (
              <NeonButton
                variant="watt"
                fullWidth
                disabled={!hasSelection}
                icon={<Zap className="h-4 w-4" />}
                onClick={handleCheckAnswer}
              >
                Comprobar / Energizar
              </NeonButton>
            )}

            {/* Inline Animated Feedback Card */}
            <AnimatePresence mode="wait">
              {feedbackState !== FEEDBACK.NONE && (
                <motion.div
                  key={feedbackState}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={[
                    'space-y-3 rounded-2xl border-2 bg-pcb-panel p-4',
                    feedbackState === FEEDBACK.CORRECT
                      ? 'border-neon-watt shadow-neon-watt'
                      : feedbackState === FEEDBACK.HINT
                        ? 'border-neon-amp'
                        : 'border-neon-short shadow-neon-short',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    {feedbackState === FEEDBACK.CORRECT ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-neon-watt" />
                        <span className="font-display text-sm font-bold text-neon-watt">
                          ¡Correcto! +{practiceMode === 'time_attack' ? 20 : 15} W
                        </span>
                      </>
                    ) : feedbackState === FEEDBACK.HINT ? (
                      <>
                        <Lightbulb className="h-5 w-5 text-neon-amp" />
                        <span className="font-display text-sm font-bold text-neon-amp">
                          Respuesta Incorrecta — Pista de K-1L0
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-neon-short" />
                        <span className="font-display text-sm font-bold text-neon-short">
                          Incorrecto — Procedimiento Correcto
                        </span>
                      </>
                    )}
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-xl border border-pcb-trace/70 bg-pcb-base/70 p-3">
                    {feedbackState === FEEDBACK.HINT ? (
                      <div className="space-y-2">
                        {validationResult?.unitError && (
                          <div className="rounded-lg border border-neon-amp/40 bg-neon-amp/10 px-2.5 py-1 font-mono text-xs text-neon-amp">
                            {validationResult.unitError}
                          </div>
                        )}
                        <PracticeMarkdown
                          content={
                            challenge.hint_markdown ||
                            '💡 Revisa las unidades y la fórmula principal antes de volver a intentar.'
                          }
                        />
                      </div>
                    ) : (
                      <PracticeMarkdown content={challenge.explanation_markdown} />
                    )}
                  </div>

                  {feedbackState === FEEDBACK.HINT ? (
                    <NeonButton
                      variant="amp"
                      fullWidth
                      icon={<RotateCcw className="h-4 w-4" />}
                      onClick={() => {
                        setValidationResult(null)
                        setFeedbackState(FEEDBACK.NONE)
                      }}
                    >
                      Intentar de Nuevo
                    </NeonButton>
                  ) : (
                    <NeonButton
                      variant={feedbackState === FEEDBACK.CORRECT ? 'watt' : 'volt'}
                      fullWidth
                      onClick={handleNextChallenge}
                    >
                      Siguiente Circuito
                    </NeonButton>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </section>
  )
}
