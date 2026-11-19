/**
 * OhmDrive — Sectors Data Registry
 * Exporta los 4 sectores de Modo Historia para carga modular en StoryMapPage y LessonRunnerPage.
 *
 * Sector 1: Distrito Ohm (Unidad I - Básicos, Ohm y Potencia)
 * Sector 2: Nodos de Kirchhoff (Unidad I - Serie/Paralelo, LCK, LVK y Divisores)
 * Sector 3: El Núcleo Thévenin (Unidad II - Nodos, Superposición, Transformación y Thévenin)
 * Sector 4: Pulso Reactivo & CA (Unidades III-V - RC/RL, Fasores e Impedancia, y Potencia CA)
 */
import sector1 from './sector1.json' with { type: 'json' }
import sector2 from './sector2.json' with { type: 'json' }
import sector3 from './sector3.json' with { type: 'json' }
import sector4 from './sector4.json' with { type: 'json' }

export { sector1, sector2, sector3, sector4 }

export const sectorsList = [sector1, sector2, sector3, sector4]

/**
 * Obtiene un sector por su ID (1 a 4).
 * @param {number|string} sectorId
 * @returns {object|null}
 */
export function getSectorById(sectorId) {
  return sectorsList.find((s) => s.sector_id === Number(sectorId)) || null
}

/**
 * Busca una lección por su ID global (1 a 16) a través de todos los sectores.
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
 * Obtiene todas las lecciones de todos los sectores aplanadas en un solo arreglo.
 * @returns {object[]}
 */
export function getAllLessons() {
  return sectorsList.flatMap((s) => s.lessons)
}

export default {
  sector1,
  sector2,
  sector3,
  sector4,
  sectorsList,
  getSectorById,
  getLessonById,
  getAllLessons
}
