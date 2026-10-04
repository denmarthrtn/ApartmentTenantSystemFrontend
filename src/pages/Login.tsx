import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { errorText, login } from '../api'
import { useUser } from '../lib'
import { Brand, Button, Field, Icon, Notice } from '../ui'

const highlights = [
  'Property managers see every unit, bill and repair request.',
  'Tenants see their lease, what they owe and how their repairs are going.',
  'Rent is billed monthly and overdue charges are flagged for you.',
]

// The API's public demo accounts (see its README). Only offered in development or when VITE_DEMO is on.
const showDemo = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true'
const demoAccounts = [
  { label: 'Property manager', email: 'demo.admin@apartments.local', password: 'Demo#Admin2026' },
  { label: 'Tenant', email: 'juan.delacruz@example.com', password: 'Tenant#2026x' },
]

export default function Login() {
  const user = useUser()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/app" replace />

  async function signIn(email: string, password: string) {
    setBusy(true)
    setError('')
    try {
      await login(email, password)
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-stone-950 p-12 text-stone-300 lg:flex">
        <div className="absolute -top-32 -right-32 size-[30rem] rounded-full bg-teal-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-emerald-500/15 blur-3xl" />

        <p className="relative text-sm font-semibold tracking-widest text-teal-300 uppercase">Apartment Manager</p>
        <div className="relative">
          <p className="max-w-md text-4xl leading-tight font-bold tracking-tight text-white">
            Rent, leases and repairs, all in one place.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((text) => (
              <li key={text} className="flex max-w-md items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-teal-500/20 text-teal-300">
                  <Icon name="check" className="size-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-stone-500">Built with React, TypeScript and Tailwind on an ASP.NET Core API.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-rise">
          <Brand />
          <h1 className="mt-10 text-2xl font-bold tracking-tight text-stone-900">Sign in</h1>
          <p className="mt-1 text-sm text-stone-500">Use the email and password your property manager gave you.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              signIn(String(form.get('email')), String(form.get('password')))
            }}
          >
            <Field label="Email" name="email" type="email" autoComplete="username" required autoFocus />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
            {error && <Notice>{error}</Notice>}
            <Button className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {showDemo && (
            <div className="mt-8 border-t border-stone-200 pt-6">
              <p className="text-sm text-stone-500">Just looking around? Sign in with a demo account:</p>
              <div className="mt-3 flex gap-3">
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    variant="secondary"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => signIn(account.email, account.password)}
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
