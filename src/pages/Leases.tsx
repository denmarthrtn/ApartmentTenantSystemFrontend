import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { Apartment, Charge, Lease, LeaseBalance, Paged, Tenant } from '../api'
import { card, date, money, month, today, useFetch, usePaged, useUser } from '../lib'
import { Action, Actions, Badge, Button, Field, FormModal, Notice, PageHeader, Select, Table } from '../ui'
import { PaymentModal } from './Billing'

// ---- Admin: all leases ----

export function Leases() {
  const query = usePaged<Lease>('/lease')
  const [creating, setCreating] = useState(false)
  const [terminating, setTerminating] = useState<Lease | null>(null)

  return (
    <>
      <PageHeader title="Leases" subtitle="Who rents which apartment, and until when.">
        <Button onClick={() => setCreating(true)}>New lease</Button>
      </PageHeader>

      <Table
        query={query}
        empty="No leases yet."
        columns={[
          { header: 'Tenant', cell: (l) => <span className="font-semibold text-stone-900">{l.tenantName}</span> },
          { header: 'Apartment', cell: (l) => l.apartmentName },
          { header: 'Period', cell: (l) => `${date(l.startDate)} – ${date(l.terminatedDate ?? l.endDate)}` },
          { header: 'Monthly rent', cell: (l) => money(l.monthlyRent) },
          { header: 'Status', cell: (l) => <Badge>{l.status}</Badge> },
          {
            header: '',
            cell: (l) => (
              <Actions>
                <Link to={`/app/leases/${l.id}`} className="text-sm font-semibold whitespace-nowrap text-teal-700 hover:underline">
                  Charges
                </Link>
                {l.status === 'Active' && (
                  <Action danger onClick={() => setTerminating(l)}>
                    End early
                  </Action>
                )}
              </Actions>
            ),
          },
        ]}
      />

      {creating && <NewLeaseModal onClose={() => setCreating(false)} onCreated={query.reload} />}

      {terminating && (
        <FormModal
          title={`End ${terminating.tenantName}'s lease early`}
          submitLabel="End lease"
          onClose={() => setTerminating(null)}
          onSubmit={async (f) => {
            await api(`/lease/${terminating.id}/terminate`, { method: 'POST', body: { terminatedDate: f.terminatedDate } })
            query.reload()
          }}
        >
          <p className="text-sm text-stone-500">
            {terminating.apartmentName} becomes available again and no more rent is billed. This can't be undone.
          </p>
          <Field label="Last day of the lease" name="terminatedDate" type="date" defaultValue={today()} required />
        </FormModal>
      )}
    </>
  )
}

function NewLeaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  // The API returns at most 50 per page, so these dropdowns top out at 50 tenants and 50 vacant
  // apartments. Past that they need a search box instead of a plain <select>.
  const tenants = useFetch<Paged<Tenant>>('/tenant?pageSize=50')
  const apartments = useFetch<Paged<Apartment>>('/apartments/available?pageSize=50')
  const [apartmentId, setApartmentId] = useState('')
  const [rent, setRent] = useState('')

  return (
    <FormModal
      title="New lease"
      submitLabel="Create lease"
      onClose={onClose}
      onSubmit={async (f) => {
        await api('/lease', {
          method: 'POST',
          body: {
            tenantId: Number(f.tenantId),
            apartmentId: Number(apartmentId),
            startDate: f.startDate,
            endDate: f.endDate,
            monthlyRent: Number(rent),
            securityDeposit: Number(f.securityDeposit),
          },
        })
        onCreated()
      }}
    >
      {(tenants.error || apartments.error) && <Notice>{tenants.error || apartments.error}</Notice>}
      <Select label="Tenant" name="tenantId" defaultValue="" required key={tenants.data ? 'loaded' : 'loading'}>
        <option value="" disabled>
          Choose a tenant
        </option>
        {tenants.data?.items.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      <Select
        label="Apartment (vacant only)"
        value={apartmentId}
        required
        onChange={(e) => {
          setApartmentId(e.target.value)
          // Start from the apartment's listed rent; it can still be changed for this lease
          const picked = apartments.data?.items.find((a) => String(a.id) === e.target.value)
          if (picked) setRent(String(picked.rent))
        }}
      >
        <option value="" disabled>
          Choose an apartment
        </option>
        {apartments.data?.items.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.location}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" name="startDate" type="date" defaultValue={today()} required />
        <Field label="End date" name="endDate" type="date" required />
        <Field
          label="Monthly rent"
          type="number"
          min="0.01"
          step="0.01"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          required
        />
        <Field label="Security deposit" name="securityDeposit" type="number" min="0" step="0.01" defaultValue="0" required />
      </div>
    </FormModal>
  )
}

// ---- One lease: details, balance and rent charges (admins and the tenant who owns it) ----

function LeaseView({ id }: { id: number }) {
  const admin = useUser()?.role === 'Admin'
  const lease = useFetch<Lease>(`/lease/${id}`)
  const balance = useFetch<LeaseBalance>(`/billing/leases/${id}/balance`)
  const charges = usePaged<Charge>(`/billing/leases/${id}/charges`)
  const [paying, setPaying] = useState<Charge | null>(null)

  if (lease.error) return <Notice>{lease.error}</Notice>
  if (!lease.data) return <p className="text-sm text-stone-500">Loading…</p>
  const l = lease.data

  const figures = [
    { label: 'Monthly rent', value: money(l.monthlyRent) },
    { label: 'Total billed', value: balance.data ? money(balance.data.totalCharged) : '…' },
    { label: 'Total paid', value: balance.data ? money(balance.data.totalPaid) : '…' },
    { label: 'Balance due', value: balance.data ? money(balance.data.balance) : '…' },
  ]

  return (
    <section className="mb-10">
      <div className={`${card} mb-5 p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-stone-900">{l.apartmentName}</h2>
          <Badge>{l.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {admin && `${l.tenantName} · `}
          {date(l.startDate)} – {date(l.endDate)}
          {l.terminatedDate && ` · ended early on ${date(l.terminatedDate)}`} · deposit {money(l.securityDeposit)}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label}>
              <dt className="text-sm text-stone-500">{f.label}</dt>
              <dd className="mt-1 text-xl font-bold tracking-tight text-stone-900">{f.value}</dd>
            </div>
          ))}
        </dl>

        {balance.data && balance.data.overdueCount > 0 && (
          <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {money(balance.data.overdueAmount)} is overdue across {balance.data.overdueCount}{' '}
            {balance.data.overdueCount === 1 ? 'charge' : 'charges'}.
          </p>
        )}
      </div>

      <Table
        query={charges}
        empty="No rent has been billed yet."
        columns={[
          { header: 'Month', cell: (c) => <span className="font-semibold text-stone-900">{month(c.billingMonth)}</span> },
          { header: 'Due', cell: (c) => date(c.dueDate) },
          { header: 'Billed', cell: (c) => money(c.amount) },
          { header: 'Paid', cell: (c) => money(c.amountPaid) },
          { header: 'Still owed', cell: (c) => money(c.balance) },
          { header: 'Status', cell: (c) => <Badge>{c.status}</Badge> },
          {
            header: '',
            cell: (c) =>
              admin && c.balance > 0 && (
                <Actions>
                  <Action onClick={() => setPaying(c)}>Record payment</Action>
                </Actions>
              ),
          },
        ]}
      />

      {paying && (
        <PaymentModal
          charge={paying}
          onClose={() => setPaying(null)}
          onPaid={() => {
            charges.reload()
            balance.reload()
          }}
        />
      )}
    </section>
  )
}

export function LeasePage() {
  const id = Number(useParams().id)

  return (
    <>
      <PageHeader title="Lease" subtitle="Rent charges and payments.">
        <Link to="/app/leases" className="text-sm font-semibold text-teal-700 hover:underline">
          ← All leases
        </Link>
      </PageHeader>
      <LeaseView key={id} id={id} />
    </>
  )
}

// ---- Tenant home: their own leases ----

export function MyLeases() {
  const { data, error, loading } = useFetch<Paged<Lease>>('/lease/mine?pageSize=50')

  return (
    <>
      <PageHeader title="My lease" subtitle="Your apartment, your rent and what you still owe." />
      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      {error && <Notice>{error}</Notice>}
      {data?.items.length === 0 && (
        <p className="text-sm text-stone-500">You don't have a lease yet. Ask your property manager to set one up.</p>
      )}
      {data?.items.map((lease) => <LeaseView key={lease.id} id={lease.id} />)}
    </>
  )
}
