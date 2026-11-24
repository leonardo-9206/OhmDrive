import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Play, RotateCcw, Award, Cpu } from 'lucide-react'
import { NeonButton, FormulaText } from '../components/ui'
import KiloMascot from '../components/mascot/KiloMascot'
import {
  readLocalProgress,
  isLevelCompleted,
  LOCAL_STORAGE_KEY,
} from '../utils/localProgress'

const OFFICIAL_UNITS = [
  {
    sector_id: 1,
    title: 'Unidad 1: Fundamentos y Potencia en CD',
    subtitle: 'Distrito Ohm',
    accentBorder: 'border-neon-volt/40',
    accentBadge: 'bg-neon-volt/15 text-neon-volt border-neon-volt/40',
    buttonVariant: 'volt',
    levels: [
      {
        lesson_id: 1,
        title: 'Nivel 1: Voltaje, corriente y resistencia',
        formulaPreview: '$I = \\frac{q}{t}, \\; V = \\frac{W}{q}$',
        description: 'Carga eléctrica, corriente directa, diferencia de potencial, resistencia y conexión de multímetro.',
      },
      {
        lesson_id: 2,
        title: 'Nivel 2: Ley de Ohm y potencia',
        formulaPreview: '$V = I \\cdot R, \\; P = V \\cdot I$',
        description: 'Relación lineal tensión-corriente, Efecto Joule y potencia nominal en resistores.',
      },
    ],
  },
  {
    sector_id: 2,
    title: 'Unidad 2: Redes Resistivas y Divisores',
    subtitle: 'Red de Distribución',
    accentBorder: 'border-neon-amp/40',
    accentBadge: 'bg-neon-amp/15 text-neon-amp border-neon-amp/40',
    buttonVariant: 'amp',
    levels: [
      {
        lesson_id: 3,
        title: 'Nivel 3: Serie y paralelo',
        formulaPreview: '$R_{eq} = \\sum R_i, \\; \\frac{1}{R_{eq}} = \\sum \\frac{1}{R_i}$',
        description: 'Reducción de resistencias en serie, paralelo y redes mixtas en corriente directa.',
      },
      {
        lesson_id: 4,
        title: 'Nivel 4: Divisores de voltaje y corriente',
        formulaPreview: '$V_x = V_s \\frac{R_x}{R_{eq}}, \\; I_x = I_s \\frac{R_{eq}}{R_x}$',
        description: 'Cálculo directo de caídas de tensión en serie y reparto de corriente en ramas paralelas.',
      },
    ],
  },
  {
    sector_id: 3,
    title: 'Unidad 3: Kirchhoff y Análisis Sistemático',
    subtitle: 'Núcleo Kirchhoff',
    accentBorder: 'border-neon-ohm/40',
    accentBadge: 'bg-neon-ohm/15 text-neon-ohm border-neon-ohm/40',
    buttonVariant: 'ohm',
    levels: [
      {
        lesson_id: 5,
        title: 'Nivel 5: Leyes de Kirchhoff (LCK y LVK)',
        formulaPreview: '$\\sum I_{entran} = \\sum I_{salen}, \\; \\sum V = 0$',
        description: 'Conservación de carga en nodos y conservación de energía en lazos cerrados.',
      },
      {
        lesson_id: 6,
        title: 'Nivel 6: Introducción a nodos y mallas',
        formulaPreview: '$\\frac{V_A - V_s}{R_1} + \\frac{V_A}{R_2} = 0$',
        description: 'Planteamiento de ecuaciones nodales y corrientes de malla en circuitos de 2 lazos.',
      },
    ],
  },
]

const TOTAL_LEVELS = 6
const EXERCISES_PER_LEVEL = 4

export default function StoryMapPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(() => readLocalProgress())

  useEffect(() => {
    const sync = () => setProgress(readLocalProgress())
    const onStorage = (e) => {
      if (!e.key || e.key === LOCAL_STORAGE_KEY) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const completedLevelsCount = OFFICIAL_UNITS.reduce(
    (acc, unit) =>
      acc +
      unit.levels.filter((lvl) => isLevelCompleted(progress.levelStats, lvl.lesson_id)).length,
    0
  )
  const completedExercisesEstimate = completedLevelsCount * EXERCISES_PER_LEVEL
  const progressPercent = Math.round((completedLevelsCount / TOTAL_LEVELS) * 100)

  return (
    <div className="space-y-6">
      {/* Hero Banner + Global Progress Bar */}
      <section className="rounded-2xl border border-neon-volt/40 bg-pcb-panel p-4 shadow-neon-volt md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <KiloMascot
              state={completedLevelsCount === TOTAL_LEVELS ? 'happy' : 'idle'}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-neon-volt">
                <Cpu className="h-4 w-4" />
                <span>Circuitos Eléctricos en CD · 3 Unidades</span>
              </div>
              <h1 className="mt-1 font-display text-xl font-bold text-white md:text-2xl">
                Ruta de Aprendizaje OhmDrive
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Elige libremente cualquiera de los <strong>6 niveles</strong>. Cada nivel incluye
                explicación, fórmulas, ejemplo resuelto y 4 ejercicios verificados.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-pcb-trace bg-pcb-base/80 px-4 py-3 md:min-w-[230px]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">AVANCE GLOBAL</span>
              <span className="font-bold text-neon-watt">
                {completedLevelsCount}/{TOTAL_LEVELS} Niveles
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-pcb-elevated">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-neon-watt shadow-neon-watt"
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-400">
              <span>{completedExercisesEstimate}/24 Ejercicios</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Units & 6 Free-Choice Levels */}
      <div className="space-y-6">
        {OFFICIAL_UNITS.map((unit) => (
          <section
            key={unit.sector_id}
            className={[
              'rounded-2xl border bg-pcb-panel/90 p-4 md:p-5',
              unit.accentBorder,
            ].join(' ')}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-pcb-trace pb-3">
              <div>
                <span
                  className={[
                    'inline-block rounded-lg border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider',
                    unit.accentBadge,
                  ].join(' ')}
                >
                  {unit.subtitle}
                </span>
                <h2 className="mt-1.5 font-display text-lg font-bold text-white md:text-xl">
                  {unit.title}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-400">
                2 Niveles · 8 Ejercicios
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {unit.levels.map((level) => {
                const stats = progress.levelStats?.[String(level.lesson_id)]
                const completed = isLevelCompleted(progress.levelStats, level.lesson_id)
                const hasStats = stats && (stats.attemptsCount > 0 || completed)

                return (
                  <article
                    key={level.lesson_id}
                    className={[
                      'flex flex-col justify-between rounded-2xl border bg-pcb-base/85 p-4 transition-colors',
                      completed
                        ? 'border-neon-watt/50 shadow-[0_0_14px_rgba(0,255,102,0.12)]'
                        : 'border-pcb-trace hover:border-neon-volt/50',
                    ].join(' ')}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-white">
                          {level.title}
                        </h3>
                        {completed ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-watt/50 bg-neon-watt/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-neon-watt">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            COMPLETADO
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-amp/40 bg-neon-amp/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-neon-amp">
                            <Clock className="h-3.5 w-3.5" />
                            PENDIENTE
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-300">{level.description}</p>

                      <div className="mt-3 rounded-xl border border-pcb-trace bg-pcb-panel px-3 py-2 text-xs text-neon-volt">
                        <FormulaText text={level.formulaPreview} />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {hasStats ? (
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-pcb-trace bg-pcb-panel/80 px-3 py-2 text-center font-mono text-xs">
                          <div>
                            <span className="block text-[10px] text-slate-400">ACIERTOS</span>
                            <span className="font-bold text-neon-watt">
                              {stats.lastCorrectCount ?? 0}/4
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400">ERRORES</span>
                            <span className="font-bold text-neon-short">
                              {stats.lastErrorCount ?? 0}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400">PUNTOS</span>
                            <span className="inline-flex items-center gap-1 font-bold text-neon-volt">
                              <Award className="h-3 w-3" />
                              {stats.bestScorePoints ?? 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="font-mono text-[11px] text-slate-400">
                          Teoría + Fórmulas + Ejemplo Resuelto · 4 Ejercicios
                        </p>
                      )}

                      <NeonButton
                        variant={completed ? 'watt' : unit.buttonVariant}
                        size="md"
                        fullWidth
                        icon={
                          completed ? (
                            <RotateCcw className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 fill-current" />
                          )
                        }
                        onClick={() => navigate(`/lesson/${level.lesson_id}`)}
                      >
                        {completed ? 'Repasar Nivel' : 'Iniciar Nivel'}
                      </NeonButton>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
