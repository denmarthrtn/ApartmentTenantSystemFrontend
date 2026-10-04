import type { ReactNode } from 'react'
import { BrowserRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { logout } from './api'
import Apartments from './pages/Apartments'
import Billing from './pages/Billing'
import Dashboard from './pages/Dashboard'
import { LeasePage, Leases, MyLeases } from './pages/Leases'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Maintenance from './pages/Maintenance'
import Tenants from './pages/Tenants'
import { useUser } from './lib'
import { Brand, Icon } from './ui'
import type { IconName } from './ui'

const adminLinks: { to: string; label: string; icon: IconName }[] = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard' },
  { to: '/app/apartments', label: 'Apartments', icon: 'building' },
  { to: '/app/tenants', label: 'Tenants', icon: 'users' },
  { to: '/app/leases', label: 'Leases', icon: 'file' },
  { to: '/app/billing', label: 'Billing', icon: 'card' },
  { to: '/app/maintenance', label: 'Maintenance', icon: 'wrench' },
]

const tenantLinks: typeof adminLinks = [
  { to: '/app', label: 'My lease', icon: 'file' },
  { to: '/app/maintenance', label: 'Maintenance', icon: 'wrench' },
]

// Everything under /app: needs a signed-in user, shows the menu for their role
function Shell() {
  const user = useUser()
  const { pathname } = useLocation()
  if (!user) return <Navigate to="/login" replace />

  const signOut = (
    <button
      onClick={logout}
      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-stone-400 transition hover:bg-white/5 hover:text-white"
    >
      <Icon name="logout" className="size-4" />
      Sign out
    </button>
  )

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-stone-950 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center justify-between p-4 md:p-5">
          <Brand dark />
          <span className="md:hidden">{signOut}</span>
        </div>

        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 md:mt-4 md:flex-col">
          {(user.role === 'Admin' ? adminLinks : tenantLinks).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white/10 text-white [&>svg]:text-teal-400'
                    : 'text-stone-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon name={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-white/10 p-4 md:block">
          <div className="mb-2 flex items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-600 text-sm font-bold text-white uppercase">
              {user.email[0]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white" title={user.email}>
                {user.email}
              </p>
              <p className="text-xs text-stone-400">{user.role === 'Admin' ? 'Property manager' : 'Tenant'}</p>
            </div>
          </div>
          {signOut}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        {/* The key replays the entrance animation on every page change */}
        <div key={pathname} className="mx-auto max-w-6xl animate-rise">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// Tenants who type an admin URL go back to their own home page. (The API would refuse them anyway.)
function AdminOnly({ children }: { children: ReactNode }) {
  return useUser()?.role === 'Admin' ? children : <Navigate to="/app" replace />
}

function Home() {
  return useUser()?.role === 'Admin' ? <Dashboard /> : <MyLeases />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="apartments" element={<AdminOnly><Apartments /></AdminOnly>} />
          <Route path="tenants" element={<AdminOnly><Tenants /></AdminOnly>} />
          <Route path="leases" element={<AdminOnly><Leases /></AdminOnly>} />
          <Route path="leases/:id" element={<LeasePage />} />
          <Route path="billing" element={<AdminOnly><Billing /></AdminOnly>} />
          <Route path="maintenance" element={<Maintenance />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
