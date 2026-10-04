import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Summary } from '../api'
import { card, money, month, useFetch } from '../lib'
import { Icon, Notice, PageHeader } from '../ui'
import type { IconName } from '../ui'

const tones = {
  teal: 'bg-teal-50 text-teal-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
}

function Stat({
  label,
  value,
  icon,
  tone,
  children,
}: {
  label: string
  value: string
  icon: IconName
  tone: keyof typeof tones
  children?: ReactNode
}) {
  return (
    <div className={`${card} p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900 xl:text-2xl 2xl:text-3xl">{value}</p>
      {children && <div className="mt-3 text-sm text-stone-500">{children}</div>}
    </div>
  )
}

const shortcuts: { to: string; icon: IconName; title: string; text: string }[] = [
  { to: '/app/apartments', icon: 'building', title: 'Apartments', text: 'Add a unit or change its rent.' },
  { to: '/app/billing', icon: 'card', title: 'Billing', text: 'See who still owes rent and record payments.' },
  { to: '/app/maintenance', icon: 'wrench', title: 'Maintenance', text: 'Work through the open repair requests.' },
]

function Meter({ percent, label }: { percent: number; label: string }) {
  const value = Math.min(100, Math.max(0, percent))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="mb-2 h-2 overflow-hidden rounded-full bg-stone-100"
    >
      <div className="h-full rounded-full bg-linear-to-r from-teal-500 to-teal-700 transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  )
}

export default function Dashboard() {
  const { data: s, error, loading } = useFetch<Summary>('/reports/summary')

  return (
    <>
      <PageHeader title="Dashboard" subtitle={s ? `How things stand for ${month(s.month)}.` : undefined} />
      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      {error && <Notice>{error}</Notice>}

      {s && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Occupancy" value={`${Math.round(s.occupancyRate)}%`} icon="building" tone="teal">
            <Meter percent={s.occupancyRate} label="Occupancy" />
            {s.occupiedApartments} of {s.totalApartments} apartments leased · {s.vacantApartments} vacant
          </Stat>

          <Stat label="Rent collected this month" value={money(s.rentCollectedThisMonth)} icon="card" tone="emerald">
            <Meter
              percent={s.rentBilledThisMonth ? (s.rentCollectedThisMonth / s.rentBilledThisMonth) * 100 : 0}
              label="Rent collected against rent billed"
            />
            of {money(s.rentBilledThisMonth)} billed
          </Stat>

          <Stat label="Overdue rent" value={money(s.totalOverdue)} icon="alert" tone={s.overdueCharges ? 'red' : 'emerald'}>
            {s.overdueCharges === 0 ? (
              'Nobody is behind on rent.'
            ) : (
              <Link to="/app/billing" className="font-semibold text-teal-700 hover:underline">
                {s.overdueCharges} overdue {s.overdueCharges === 1 ? 'charge' : 'charges'}
              </Link>
            )}
          </Stat>

          <Stat
            label="Open maintenance"
            value={String(s.openMaintenanceRequests + s.inProgressMaintenanceRequests)}
            icon="wrench"
            tone="amber"
          >
            {s.openMaintenanceRequests} waiting · {s.inProgressMaintenanceRequests} in progress
            {s.urgentMaintenanceRequests > 0 && (
              <>
                {' · '}
                <Link to="/app/maintenance" className="font-semibold text-red-700 hover:underline">
                  {s.urgentMaintenanceRequests} urgent
                </Link>
              </>
            )}
          </Stat>
        </div>
      )}

      <h2 className="mt-10 mb-4 text-sm font-semibold tracking-wider text-stone-500 uppercase">Jump to</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {shortcuts.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`${card} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-teal-600/40 hover:shadow-md`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-stone-900 text-white">
              <Icon name={s.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-stone-900">{s.title}</span>
              <span className="block text-sm text-stone-500">{s.text}</span>
            </span>
            <Icon name="arrow" className="size-4 text-stone-300 transition group-hover:translate-x-1 group-hover:text-teal-700" />
          </Link>
        ))}
      </div>
    </>
  )
}
