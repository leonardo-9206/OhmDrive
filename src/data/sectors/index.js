/**
 * OhmDrive — Sectors Data Registry (Official Rubric: 3 Units · 6 Levels · 24 Exercises)
 * Exporta las 3 unidades de Modo Historia para carga modular en StoryMapPage y LessonRunnerPage.
 *
 * Unidad 1: Distrito Ohm (Nivel 1: V, I, R · Nivel 2: Ley de Ohm y Potencia)
 * Unidad 2: Red de Distribución (Nivel 3: Serie y Paralelo · Nivel 4: Divisores de Tensión y Corriente)
 * Unidad 3: Núcleo Kirchhoff (Nivel 5: Leyes de Kirchhoff · Nivel 6: Introducción a Nodos y Mallas)
 */
import sector1 from './sector1.json' with { type: 'json' }
import sector2 from './sector2.json' with { type: 'json' }
import sector3 from './sector3.json' with { type: 'json' }

export { sector1, sector2, sector3 }

export const sectorsList = [sector1, sector2, sector3]

/**
 * Obtiene un sector por su ID (1 a 3).
 * @param {number|string} sectorId
 * @returns {object|null}
 */
export function getSectorById(sectorId) {
  return sectorsList.find((s) => s.sector_id === Number(sectorId)) || null
}

/**
 * Busca una lección por su ID global (1 a 6) a través de los 3 sectores.
 * @param {number|string} lessonId
 * @returns {{ sector: object, lesson: object }|null}
 */
export function getLessonById(lessonId) {
  for (const s of sectorsList) {
    const found = s.lessons.find((l) => l.lesson_id === Number(lessonId))
    if (found) return { sector: s, lesson: found }
  }
  return null
}

/**
 * Obtiene todas las lecciones de los 3 sectores aplanadas en un solo arreglo (6 niveles).
 * @returns {object[]}
 */
export function getAllLessons() {
  return sectorsList.flatMap((s) => s.lessons)
}

export default {
  sector1,
  sector2,
  sector3,
  sectorsList,
  getSectorById,
  getLessonById,
  getAllLessons
}
