import assert from 'node:assert/strict'
import {
  useGameStore,
  initialSectorProgress,
  initialLevelStats,
  calculateLeagueTier,
  LESSON_TO_SECTOR
} from './useGameStore.js'

console.log('🧪 Ejecutando pruebas unitarias de useGameStore (Rodrigo - US-10R)...')

// 1. Validar tiers de liga
assert.equal(calculateLeagueTier(0), 'silicon')
assert.equal(calculateLeagueTier(500), 'copper')
assert.equal(calculateLeagueTier(1500), 'gold')
assert.equal(calculateLeagueTier(3000), 'superconductor')

// 2. Validar estructura de 3 Unidades y libre navegación (Criterios 2, 9 y 10)
assert.equal(Object.keys(initialSectorProgress).length, 3, 'Deben existir exactamente 3 Unidades')
assert.equal(initialSectorProgress[1].isUnlocked, true, 'Unidad 1 debe estar desbloqueada')
assert.equal(initialSectorProgress[2].isUnlocked, true, 'Unidad 2 debe estar desbloqueada')
assert.equal(initialSectorProgress[3].isUnlocked, true, 'Unidad 3 debe estar desbloqueada')

// 3. Validar estructura de los 6 Niveles oficiales
assert.equal(Object.keys(initialLevelStats).length, 6, 'Deben existir exactamente 6 Niveles')
for (let i = 1; i <= 6; i++) {
  assert.equal(initialLevelStats[i].status, 'pending', `Nivel ${i} debe iniciar pendiente`)
  assert.equal(initialLevelStats[i].isCompleted, false, `Nivel ${i} debe iniciar no completado`)
  assert.equal(initialLevelStats[i].bestScorePoints, 0)
}

// 4. Probar registro de resultados de nivel (recordLevelResults)
useGameStore.getState().resetAllProgress()
const store = useGameStore.getState()

assert.equal(store.getLevelStatus(1), 'pending')
assert.equal(store.isLevelCompleted(1), false)

// Registrar nivel 1 completado con 3 aciertos y 1 error (85 pts)
store.recordLevelResults({
  lessonId: 1,
  correctCount: 3,
  errorCount: 1,
  scorePoints: 85,
  durationSeconds: 45
})

const stateAfter = useGameStore.getState()
assert.equal(stateAfter.getLevelStatus(1), 'completed')
assert.equal(stateAfter.isLevelCompleted(1), true)
assert.equal(stateAfter.levelStats[1].lastCorrectCount, 3)
assert.equal(stateAfter.levelStats[1].lastErrorCount, 1)
assert.equal(stateAfter.levelStats[1].bestScorePoints, 85)
assert.equal(stateAfter.levelStats[1].attemptsCount, 1)
assert.equal(stateAfter.user.totalWattsXp, 85)

// Si se vuelve a jugar y se saca menor puntuación (ej. 50), debe conservar la mejor (85)
stateAfter.recordLevelResults({
  lessonId: 1,
  correctCount: 2,
  errorCount: 2,
  scorePoints: 50,
  durationSeconds: 30
})
const stateRetry = useGameStore.getState()
assert.equal(stateRetry.levelStats[1].bestScorePoints, 85, 'bestScorePoints debe ser el máximo')
assert.equal(stateRetry.levelStats[1].attemptsCount, 2)

// Probar progreso general
const progress = stateRetry.getOverallProgress()
assert.equal(progress.completedLevels, 1)
assert.equal(progress.totalLevels, 6)
assert.equal(progress.completedExercises, 4)
assert.equal(progress.totalExercises, 24)
assert.equal(progress.percentage, Math.round((1 / 6) * 100))

// Completar los otros 5 niveles y validar 100%
for (let l = 2; l <= 6; l++) {
  useGameStore.getState().recordLevelResults({
    lessonId: l,
    correctCount: 4,
    errorCount: 0,
    scorePoints: 100
  })
}

const stateFull = useGameStore.getState()
const progressFull = stateFull.getOverallProgress()
assert.equal(progressFull.completedLevels, 6)
assert.equal(progressFull.totalLevels, 6)
assert.equal(progressFull.completedExercises, 24)
assert.equal(progressFull.totalExercises, 24)
assert.equal(progressFull.percentage, 100)
assert.equal(stateFull.sectorProgress[1].completedNodes, 2)
assert.equal(stateFull.sectorProgress[2].completedNodes, 2)
assert.equal(stateFull.sectorProgress[3].completedNodes, 2)

// Probar reseteo total
stateFull.resetAllProgress()
const stateReset = useGameStore.getState()
assert.equal(stateReset.user.totalWattsXp, 0)
assert.equal(stateReset.getLevelStatus(1), 'pending')
assert.equal(stateReset.getOverallProgress().completedLevels, 0)

console.log('✅ ¡Todas las pruebas de useGameStore pasaron exitosamente (100% aprobado)!')
