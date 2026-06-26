import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { LocationProvider } from './lib/location'
import { PointsToastProvider } from './components/civic/PointsToast'
import { ErrorBoundary } from './components/ErrorBoundary'
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
import { LoginPage } from './pages/Login'
import { GamificationRulesPage } from './pages/GamificationRules'
import { TermsPage } from './pages/Terms'
import { PrivacyPage } from './pages/Privacy'
import { WaitingPage } from './pages/Waiting'
import { AdminAnalyticsPage } from './pages/AdminAnalytics'
import { ThreadDetailPage } from './pages/ThreadDetail'
import { NotFoundPage } from './pages/NotFound'
import { GoogleMapsProvider } from './components/civic/GoogleMapsProvider'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <GoogleMapsProvider>
        <PointsToastProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/map" element={<MapExplorerPage />} />
            <Route path="/report" element={<ReportWizardPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/gamification-rules" element={<GamificationRulesPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/waiting" element={<WaitingPage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            <Route path="/threads/:id" element={<ThreadDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
        </PointsToastProvider>
        </GoogleMapsProvider>
      </LocationProvider>
    </AuthProvider>
  )
}
