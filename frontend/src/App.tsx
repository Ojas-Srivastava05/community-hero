import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { I18nProvider } from './lib/i18n'
import { LocationProvider } from './lib/location'
import { PointsToastProvider } from './components/civic/PointsToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouteBoundary } from './components/RouteBoundary'
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
import { ScorecardsPage } from './pages/Scorecards'
import { NotificationsPage } from './pages/Notifications'
import { EmbedMapPage } from './pages/EmbedMap'
import { NotFoundPage } from './pages/NotFound'
import { AdminModeProvider, AdminRouteGuard } from './lib/admin-mode'
import { AdminRegionProvider } from './lib/admin-region'
import { RoleOnboardingHost } from './components/civic/RoleOnboardingHost'
import { GoogleMapsProvider } from './components/civic/GoogleMapsProvider'
import './index.css'

export default function App() {
  return (
    <I18nProvider>
    <AuthProvider>
      <AdminModeProvider>
      <AdminRegionProvider>
      <LocationProvider>
        <GoogleMapsProvider>
        <PointsToastProvider>
        <BrowserRouter>
          <AdminRouteGuard />
          <RoleOnboardingHost />
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<RouteBoundary><LandingPage /></RouteBoundary>} />
            <Route path="/map" element={<RouteBoundary><MapExplorerPage /></RouteBoundary>} />
            <Route path="/report" element={<RouteBoundary><ReportWizardPage /></RouteBoundary>} />
            <Route path="/activity" element={<RouteBoundary><ActivityPage /></RouteBoundary>} />
            <Route path="/profile" element={<RouteBoundary><ProfilePage /></RouteBoundary>} />
            <Route path="/login" element={<RouteBoundary><LoginPage /></RouteBoundary>} />
            <Route path="/terms" element={<RouteBoundary><TermsPage /></RouteBoundary>} />
            <Route path="/gamification-rules" element={<RouteBoundary><GamificationRulesPage /></RouteBoundary>} />
            <Route path="/privacy" element={<RouteBoundary><PrivacyPage /></RouteBoundary>} />
            <Route path="/waiting" element={<RouteBoundary><WaitingPage /></RouteBoundary>} />
            <Route path="/my-reports" element={<RouteBoundary><MyReportsPage /></RouteBoundary>} />
            <Route path="/dashboard" element={<RouteBoundary><DashboardPage /></RouteBoundary>} />
            <Route path="/issues/:id" element={<RouteBoundary><IssueDetailPage /></RouteBoundary>} />
            <Route path="/threads/:id" element={<RouteBoundary><ThreadDetailPage /></RouteBoundary>} />
            <Route path="/admin" element={<RouteBoundary><AdminPage /></RouteBoundary>} />
            <Route path="/admin/analytics" element={<RouteBoundary><AdminAnalyticsPage /></RouteBoundary>} />
            <Route path="/assistant" element={<RouteBoundary><AssistantPage /></RouteBoundary>} />
            <Route path="/leaderboard" element={<RouteBoundary><LeaderboardPage /></RouteBoundary>} />
            <Route path="/scorecards" element={<RouteBoundary><ScorecardsPage /></RouteBoundary>} />
            <Route path="/notifications" element={<RouteBoundary><NotificationsPage /></RouteBoundary>} />
            <Route path="/embed" element={<RouteBoundary><EmbedMapPage /></RouteBoundary>} />
            <Route path="/embed/map" element={<RouteBoundary><EmbedMapPage /></RouteBoundary>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
        </PointsToastProvider>
        </GoogleMapsProvider>
      </LocationProvider>
      </AdminRegionProvider>
      </AdminModeProvider>
    </AuthProvider>
    </I18nProvider>
  )
}
