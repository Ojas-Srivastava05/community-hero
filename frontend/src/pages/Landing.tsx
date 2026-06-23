import { Bell, Camera, ChevronRight, MapPin, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard, SeverityDot } from '../components/GlassCard'

const trending = [
  {
    id: '1',
    title: 'Large pothole near metro pillar',
    category: 'Pothole',
    distance: '0.3 km',
    severity: 'high' as const,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&h=120&fit=crop',
  },
  {
    id: '2',
    title: 'Garbage blackspot on 12th Main',
    category: 'Waste',
    distance: '0.8 km',
    severity: 'medium' as const,
    image: 'https://images.unsplash.com/photo-1530587191325-3db28176de87?w=200&h=120&fit=crop',
  },
  {
    id: '3',
    title: 'Broken streetlight at junction',
    category: 'Streetlight',
    distance: '1.2 km',
    severity: 'low' as const,
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=200&h=120&fit=crop',
  },
]

const quickLinks = [
  { to: '/map', label: 'Map Explorer', icon: MapPin },
  { to: '/my-reports', label: 'My Reports', icon: ChevronRight },
  { to: '/dashboard', label: 'Dashboard', icon: TrendingUp },
]

export function LandingPage() {
  return (
    <div className="min-h-full pb-32">
      {/* Top bar */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-mist">CIVICPULSE AI</p>
          <h1 className="text-lg font-semibold tracking-tight">Community Hero</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full glass">
            <Bell size={18} className="text-mist" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal" />
          </button>
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/20 text-sm font-semibold text-teal">
            CH
          </Link>
        </div>
      </header>

      <main className="space-y-6 px-6 pt-4">
        {/* Bento grid */}
        <section className="stagger grid grid-cols-2 gap-4">
          <GlassCard className="col-span-2 relative overflow-hidden p-0">
            <div className="relative h-36 bg-gradient-to-br from-elevated to-midnight p-4">
              <div className="absolute inset-0 opacity-30">
                <svg className="h-full w-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                  <path d="M0 80 Q100 40 200 70 T400 50 L400 140 L0 140 Z" fill="#14B8A6" opacity="0.15" />
                  <path d="M0 100 Q150 60 300 90 L400 85 L400 140 L0 140 Z" fill="#2DD4BF" opacity="0.1" />
                </svg>
              </div>
              {[20, 55, 75].map((left, i) => (
                <span
                  key={left}
                  className="pulse-ring absolute h-3 w-3 rounded-full bg-teal"
                  style={{ left: `${left}%`, top: `${30 + i * 12}%` }}
                />
              ))}
              <div className="relative">
                <p className="text-[11px] font-medium uppercase tracking-wider text-mist">Nearby</p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">247</p>
                <p className="text-sm text-mist">open issues nearby</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-[11px] font-medium uppercase tracking-wider text-mist">This week</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">12</p>
            <p className="text-xs text-mist">resolved</p>
            <div className="mt-3 flex h-8 items-end gap-0.5">
              {[4, 6, 3, 8, 5, 9, 12].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-teal/30" style={{ height: `${h * 3}px` }} />
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-[11px] font-medium uppercase tracking-wider text-mist">Your ward</p>
            <p className="mt-2 text-lg font-semibold">Koramangala</p>
            <span className="mt-2 inline-block rounded-full bg-teal/15 px-2.5 py-0.5 text-[11px] font-medium text-teal">
              Ward 12 · Bengaluru
            </span>
          </GlassCard>
        </section>

        {/* Primary CTA */}
        <Link to="/report" className="btn-primary flex items-center justify-center gap-2">
          <Camera size={20} />
          Report an Issue
        </Link>

        {/* Trending */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trending near you</h2>
            <Link to="/map" className="text-sm text-teal">See all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {trending.map((item) => (
              <Link
                key={item.id}
                to={`/issues/${item.id}`}
                className="glass-card w-44 shrink-0 overflow-hidden rounded-2xl"
              >
                <img src={item.image} alt="" className="h-20 w-full object-cover" />
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <SeverityDot level={item.severity} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-mist">{item.category}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
                  <p className="mt-1 text-xs text-mist">{item.distance}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section className="grid grid-cols-3 gap-3">
          {quickLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="glass-card flex flex-col items-center gap-2 rounded-2xl py-4 text-center"
            >
              <Icon size={20} className="text-teal" />
              <span className="text-xs font-medium text-mist">{label}</span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
