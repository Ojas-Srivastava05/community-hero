import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { BottomNav } from './components/BottomNav'
import { LandingPage } from './pages/Landing'
import { ProfilePage } from './pages/Profile'
import { ReportWizardPage } from './pages/ReportWizard'
import { MapExplorerPage } from './pages/MapExplorer'
import { IssueDetailPage } from './pages/IssueDetail'
import { MyReportsPage } from './pages/MyReports'
import { DashboardPage } from './pages/Dashboard'
import { AdminPage } from './pages/Admin'
import { AssistantPage } from './pages/Assistant'
import { ActivityPage } from './pages/Activity'
import { LeaderboardPage } from './pages/Leaderboard'
import './index.css'

function AppShell() {
  return (
    <div className="mx-auto min-h-full max-w-lg bg-midnight">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapExplorerPage />} />
        <Route path="/report" element={<ReportWizardPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
