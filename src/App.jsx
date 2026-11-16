import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import StoryMapPage from './pages/StoryMapPage'
import PracticePage from './pages/PracticePage'
import CyberLabPage from './pages/CyberLabPage'
import CodexPage from './pages/CodexPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LessonRunnerPage from './pages/LessonRunnerPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<StoryMapPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/cyberlab" element={<CyberLabPage />} />
          <Route path="/codex" element={<CodexPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>
        <Route path="/lesson/:lessonId" element={<LessonRunnerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
