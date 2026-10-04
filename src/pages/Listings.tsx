import { Link } from 'react-router-dom'
import type { Apartment } from '../api'
import { card, money, usePaged, useUser } from '../lib'
import { Brand, Button, Icon, Notice } from '../ui'

// Card banner colours, picked by apartment id so each unit keeps its own
const covers = [
  'from-teal-600 to-teal-900',
  'from-sky-600 to-indigo-900',
  'from-amber-500 to-rose-700',
  'from-emerald-600 to-cyan-900',
]

// Public page: the vacant apartments, no login needed
export default function Listings() {
  const user = useUser()
  const { data, error, loading, page, setPage } = usePaged<Apartment>('/apartments/available', 9)

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-stone-950">
        <div className="absolute -top-40 -right-20 size-[32rem] rounded-full bg-teal-600/30 blur-3xl" />
        <div className="absolute -bottom-52 -left-20 size-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Brand dark />
          <Link
            to={user ? '/app' : '/login'}
            className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-teal-50"
          >
            {user ? 'Open dashboard' : 'Sign in'}
          </Link>
        </header>

        <div className="relative mx-auto max-w-6xl animate-rise px-4 pt-14 pb-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest text-teal-200 uppercase ring-1 ring-white/15 ring-inset">
            <span className="size-1.5 rounded-full bg-teal-400" />
            Available now
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
            Find an apartment that's ready to move into.
          </h1>
          <p className="mt-4 max-w-2xl text-stone-300">
            These units are vacant today. Already a tenant? Sign in to see your lease, your bills and your repair
            requests.
          </p>
        </div>
      </div>

      {/* The cards overlap the bottom edge of the dark banner */}
      <main className="relative mx-auto -mt-14 max-w-6xl px-4 pb-16">
        <div>
          {loading && <p className="text-sm text-stone-300">Loading apartments…</p>}
          {error && <Notice>{error}</Notice>}
          {data?.items.length === 0 && (
            <p className={`${card} p-8 text-center text-sm text-stone-500`}>Every apartment is taken right now.</p>
          )}

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((apartment) => (
              <li key={apartment.id} className={`${card} group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl`}>
                <div className={`relative flex h-32 items-end overflow-hidden bg-linear-to-br p-4 ${covers[apartment.id % covers.length]}`}>
                  <Icon name="building" className="absolute -top-4 -right-4 size-32 text-white/10 transition group-hover:scale-110" />
                  <span className="relative rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {apartment.location}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-stone-900">{apartment.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                    <span className="rounded-md bg-stone-100 px-2 py-1">
                      {apartment.rooms} {apartment.rooms === 1 ? 'room' : 'rooms'}
                    </span>
                    <span className="rounded-md bg-stone-100 px-2 py-1">
                      {apartment.hasParking ? 'Parking included' : 'No parking'}
                    </span>
                  </div>
                  <p className="mt-5 border-t border-stone-100 pt-4 text-xl font-bold text-stone-900">
                    {money(apartment.rent)}
                    <span className="text-sm font-medium text-stone-500"> / month</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {data && data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm text-stone-500">
              <Button variant="secondary" disabled={!data.hasPreviousPage} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              Page {data.page} of {data.totalPages}
              <Button variant="secondary" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
