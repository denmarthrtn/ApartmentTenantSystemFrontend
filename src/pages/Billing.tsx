import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorText } from '../api'
import type { BillingRun, Charge } from '../api'
import { date, money, month, today, usePaged } from '../lib'
import { Action, Actions, Badge, Button, Field, FormModal, Notice, PageHeader, Select, Table } from '../ui'

// Record money received against one rent charge. Also used on the lease page.
export function PaymentModal({ charge, onClose, onPaid }: { charge: Charge; onClose: () => void; onPaid: () => void }) {
  const [method, setMethod] = useState('Cash')

  return (
    <FormModal
      title="Record a payment"
      submitLabel="Record payment"
      onClose={onClose}
      onSubmit={async (f) => {
        await api(`/billing/charges/${charge.id}/payments`, {
          method: 'POST',
          body: {
            amount: Number(f.amount),
            paidDate: f.paidDate,
            method,
            referenceNumber: f.referenceNumber || null,
          },
        })
        onPaid()
      }}
    >
      <p className="text-sm text-stone-500">
        {charge.tenantName} · {charge.apartmentName} · {month(charge.billingMonth)}. Still owed:{' '}
        <strong className="text-stone-900">{money(charge.balance)}</strong>
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="0.01"
          max={charge.balance}
          step="0.01"
          defaultValue={charge.balance}
          required
        />
        <Field label="Date received" name="paidDate" type="date" defaultValue={today()} required />
      </div>
      <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
        <option value="Cash">Cash</option>
        <option value="BankTransfer">Bank transfer</option>
        <option value="EWallet">E-wallet</option>
      </Select>
      {method !== 'Cash' && <Field label="Reference number" name="referenceNumber" required maxLength={100} />}
    </FormModal>
  )
}

export default function Billing() {
  const query = usePaged<Charge>('/billing/charges/overdue')
  const [paying, setPaying] = useState<Charge | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BillingRun | string | null>(null)

  async function runBilling() {
    setRunning(true)
    try {
      setResult(await api<BillingRun>('/billing/run', { method: 'POST' }))
      query.reload()
    } catch (e) {
      setResult(errorText(e))
    }
    setRunning(false)
  }

  return (
    <>
      <PageHeader title="Billing" subtitle="Rent that is past its due date. Open a lease to see all of its charges.">
        <Button variant="secondary" disabled={running} onClick={runBilling}>
          {running ? 'Running…' : 'Run billing now'}
        </Button>
      </PageHeader>

      {typeof result === 'string' && (
        <div className="mb-4">
          <Notice>{result}</Notice>
        </div>
      )}
      {result && typeof result !== 'string' && (
        <p role="status" className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Billing ran: {result.chargesCreated} new {result.chargesCreated === 1 ? 'charge' : 'charges'},{' '}
          {result.chargesMarkedOverdue} marked overdue. It also runs by itself once a day.
        </p>
      )}

      <Table
        query={query}
        empty="Nothing is overdue."
        columns={[
          { header: 'Tenant', cell: (c) => <span className="font-semibold text-stone-900">{c.tenantName}</span> },
          { header: 'Apartment', cell: (c) => c.apartmentName },
          { header: 'Month', cell: (c) => month(c.billingMonth) },
          { header: 'Due', cell: (c) => date(c.dueDate) },
          { header: 'Billed', cell: (c) => money(c.amount) },
          { header: 'Still owed', cell: (c) => <span className="font-semibold text-red-700">{money(c.balance)}</span> },
          { header: 'Status', cell: (c) => <Badge>{c.status}</Badge> },
          {
            header: '',
            cell: (c) => (
              <Actions>
                <Link to={`/app/leases/${c.leaseId}`} className="text-sm font-semibold whitespace-nowrap text-teal-700 hover:underline">
                  View lease
                </Link>
                <Action onClick={() => setPaying(c)}>Record payment</Action>
              </Actions>
            ),
          },
        ]}
      />

      {paying && <PaymentModal charge={paying} onClose={() => setPaying(null)} onPaid={query.reload} />}
    </>
  )
}
