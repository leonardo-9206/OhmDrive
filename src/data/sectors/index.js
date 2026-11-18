/**
 * OhmDrive — Sectors Data Registry
 * Exporta los sectores de Modo Historia para carga modular en StoryMapPage y LessonRunnerPage.
 */
import sector1 from './sector1.json' with { type: 'json' }

export { sector1 }

export const sectorsList = [sector1]

export function getSectorById(sectorId) {
  return sectorsList.find((s) => s.sector_id === Number(sectorId)) || null
}

export function getLessonById(lessonId) {
  for (const s of sectorsList) {
    const found = s.lessons.find((l) => l.lesson_id === Number(lessonId))
    if (found) return { sector: s, lesson: found }
  }
  return null
}

export default {
  sector1,
  sectorsList,
  getSectorById,
  getLessonById
}
