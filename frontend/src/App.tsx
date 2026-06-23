import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { BottomNav } from './components/BottomNav'
import { LandingPage } from './pages/Landing'
import { ProfilePage } from './pages/Profile'
import { PlaceholderPage } from './pages/Placeholder'
import './index.css'

function AppShell() {
  return (
    <div className="mx-auto min-h-full max-w-lg bg-midnight">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<PlaceholderPage title="Map Explorer" phase={3} description="Full-bleed map with clustered severity markers and filter sheet." />} />
        <Route path="/report" element={<PlaceholderPage title="Report Wizard" phase={2} description="3-step capture → AI pre-fill → confirm & submit." />} />
        <Route path="/activity" element={<PlaceholderPage title="Activity" phase={4} description="Notifications and community updates." />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-reports" element={<PlaceholderPage title="My Reports" phase={4} description="Track your submitted issues with SLA countdowns." />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Impact Dashboard" phase={5} description="Ward-level KPIs and AI insight cards." />} />
        <Route path="/issues/:id" element={<PlaceholderPage title="Issue Detail" phase={3} description="Photo carousel, status timeline, and community upvote." />} />
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
