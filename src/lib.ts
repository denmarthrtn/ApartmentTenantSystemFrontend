import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { api, errorText, parseUser, session } from './api'
import type { Paged } from './api'

// ---- Formatting ----

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
export const money = (amount: number) => peso.format(amount)

export const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export const month = (value: string) =>
  new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })

// For <input type="date">: YYYY-MM-DD in local time
export const today = () => new Date().toLocaleDateString('en-CA')
export const dateInput = (value?: string | null) => value?.slice(0, 10) ?? ''

// ---- Shared Tailwind classes ----

export const card = 'rounded-2xl border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5'
export const control =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none'

// ---- Hooks ----

export function useUser() {
  const raw = useSyncExternalStore(session.subscribe, session.raw)
  return useMemo(() => parseUser(raw), [raw])
}

// GET a path and keep the result. The previous data stays on screen while a new page loads.
export function useFetch<T>(path: string) {
  const [state, setState] = useState<{ data?: T; error?: string }>({})
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let current = true
    api<T>(path).then(
      (data) => current && setState({ data }),
      (e) => current && setState({ error: errorText(e) }),
    )
    return () => {
      current = false
    }
  }, [path, version])

  return { ...state, loading: !state.data && !state.error, reload: () => setVersion((v) => v + 1) }
}

export function usePaged<T>(path: string, pageSize = 10) {
  const [at, setAt] = useState({ path, page: 1 })
  const page = at.path === path ? at.page : 1 // a new filter starts again from page 1
  const query = useFetch<Paged<T>>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=${pageSize}`)
  return { ...query, page, setPage: (next: number) => setAt({ path, page: next }) }
}

// For buttons that change data outside a form (delete, cancel, status changes)
export async function run(action: () => Promise<unknown>, then?: () => void) {
  try {
    await action()
    then?.()
  } catch (e) {
    alert(errorText(e))
  }
}
