import { useEffect, useRef, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'
import { errorText } from './api'
import { card, control } from './lib'
import type { usePaged } from './lib'

// ---- Icons ----
// Line icons drawn on a 24x24 grid, coloured by the surrounding text colour.

const icons = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  building: <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />,
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M16 4.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-4-6.3" />
    </>
  ),
  file: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" />,
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
}

export type IconName = keyof typeof icons

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {icons[name]}
    </svg>
  )
}

const buttonStyles = {
  primary:
    'bg-linear-to-b from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-900/30 hover:from-teal-700 hover:to-teal-800',
  secondary: 'border border-stone-300 bg-white text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.98] disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

// Small text button used in table rows
export function Action({ danger, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-md px-2 py-1 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${danger ? 'text-red-700 hover:bg-red-50' : 'text-teal-700 hover:bg-teal-50'}`}
      {...props}
    />
  )
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-1">{children}</div>
}

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input className={`mt-1 block w-full ${control}`} {...props} />
    </label>
  )
}

export function Select({ label, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <select className={`mt-1 block w-full ${control}`} {...props} />
    </label>
  )
}

export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <textarea rows={4} className={`mt-1 block w-full ${control}`} {...props} />
    </label>
  )
}

const badgeTones: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Paid: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Open: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  High: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  InProgress: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  Overdue: 'bg-red-50 text-red-800 ring-red-600/20',
  Urgent: 'bg-red-50 text-red-800 ring-red-600/20',
}

// Status and priority values from the API, e.g. "InProgress" is shown as "In Progress"
export function Badge({ children }: { children: string }) {
  const tone = badgeTones[children] ?? 'bg-stone-100 text-stone-700 ring-stone-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${tone}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {children.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </span>
  )
}

export function Brand({ dark }: { dark?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 font-bold tracking-tight ${dark ? 'text-white' : 'text-stone-900'}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-teal-500 to-teal-700 text-white shadow-sm shadow-teal-900/40">
        <Icon name="home" />
      </span>
      Apartment Manager
    </Link>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-600/10 ring-inset">
      <Icon name="alert" className="mt-0.5 size-4" />
      {children}
    </p>
  )
}

// ---- Table ----

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
}

export function Table<T extends { id: number }>({
  query,
  columns,
  empty = 'Nothing here yet.',
}: {
  query: ReturnType<typeof usePaged<T>>
  columns: Column<T>[]
  empty?: string
}) {
  const { data, error, loading, page, setPage } = query

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-busy={loading}>
          <thead className="border-b border-stone-200 bg-stone-50/80 text-xs tracking-wider text-stone-500 uppercase">
            <tr>
              {columns.map((c) => (
                <th key={c.header} scope="col" className="px-5 py-3.5 font-semibold whitespace-nowrap">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {/* Grey placeholder rows while the first page loads */}
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.header} className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                    </td>
                  ))}
                </tr>
              ))}
            {data?.items.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-teal-50/40">
                {columns.map((c) => (
                  <td key={c.header} className="px-5 py-3.5">
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="sr-only">Loading…</p>}
      {error && (
        <div className="p-4">
          <Notice>{error}</Notice>
        </div>
      )}
      {data?.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-14 text-center text-sm text-stone-500">
          <span className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400">
            <Icon name="inbox" className="size-6" />
          </span>
          {empty}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-stone-200 bg-stone-50/50 px-5 py-3 text-sm text-stone-500">
          <span>
            Page {data.page} of {data.totalPages} · {data.totalCount} total
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!data.hasPreviousPage} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Modals ----
// Built on the native <dialog>: it traps focus, closes on Esc and dims the page for us.

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/5 backdrop:bg-stone-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-stone-900">{title}</h2>
        <button
          type="button"
          aria-label="Close"
          onClick={() => ref.current?.close()}
          className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  )
}

// A modal with a form. onSubmit gets the fields by their "name"; if it throws, the message is shown
// and the modal stays open.
export function FormModal({
  title,
  submitLabel = 'Save',
  onSubmit,
  onClose,
  children,
}: {
  title: string
  submitLabel?: string
  onSubmit: (fields: Record<string, string>) => Promise<unknown>
  onClose: () => void
  children: ReactNode
}) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="mt-4 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const fields = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
          setBusy(true)
          setError('')
          try {
            await onSubmit(fields)
            onClose()
          } catch (err) {
            setError(errorText(err))
            setBusy(false)
          }
        }}
      >
        {children}
        {error && <Notice>{error}</Notice>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
        </div>
      </form>
    </Modal>
  )
}
