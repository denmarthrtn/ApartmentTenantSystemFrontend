import { useState } from 'react'
import { api } from '../api'
import type { Apartment, MaintenanceRequest, Paged } from '../api'
import { control, date, run, useFetch, usePaged, useUser } from '../lib'
import { Action, Actions, Badge, Button, Field, FormModal, PageHeader, Select, Table, TextArea } from '../ui'

const statuses = ['Open', 'InProgress', 'Resolved', 'Cancelled']
const priorities = ['Low', 'Normal', 'High', 'Urgent']
const spaced = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

// Admins see and manage every request; tenants see and report their own
export default function Maintenance() {
  const admin = useUser()?.role === 'Admin'
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [creating, setCreating] = useState(false)
  const [resolving, setResolving] = useState<MaintenanceRequest | null>(null)

  const filters = new URLSearchParams()
  if (status) filters.set('status', status)
  if (priority) filters.set('priority', priority)
  const query = usePaged<MaintenanceRequest>(`/maintenance${admin ? '' : '/mine'}?${filters}`)

  // The API only allows: Open → In Progress → Resolved, In Progress → Open, and Open → Cancelled
  const move = (request: MaintenanceRequest, to: string) =>
    run(() => api(`/maintenance/${request.id}/status`, { method: 'PATCH', body: { status: to } }), query.reload)

  const cancel = (request: MaintenanceRequest) => {
    if (!confirm(`Cancel "${request.title}"?`)) return
    run(() => api(`/maintenance/${request.id}/cancel`, { method: 'POST' }), query.reload)
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle={admin ? 'Repairs reported by tenants or logged by you.' : 'Report a problem in your apartment and follow its progress.'}
      >
        <select aria-label="Filter by status" className={control} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {spaced(s)}
            </option>
          ))}
        </select>
        <select aria-label="Filter by priority" className={control} value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Any priority</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Button onClick={() => setCreating(true)}>{admin ? 'Log a request' : 'Report a problem'}</Button>
      </PageHeader>

      <Table
        query={query}
        empty={status || priority ? 'No requests match these filters.' : 'No maintenance requests.'}
        columns={[
          {
            header: 'Request',
            cell: (r) => (
              <div className="max-w-sm min-w-48">
                <p className="font-semibold text-stone-900">{r.title}</p>
                <p className="mt-0.5 text-stone-500">{r.description}</p>
                {r.resolutionNotes && <p className="mt-1 text-emerald-800">Fixed: {r.resolutionNotes}</p>}
              </div>
            ),
          },
          { header: 'Apartment', cell: (r) => r.apartmentName },
          ...(admin ? [{ header: 'Reported by', cell: (r: MaintenanceRequest) => (r.tenantId ? r.tenantName : 'Manager') }] : []),
          { header: 'Priority', cell: (r) => <Badge>{r.priority}</Badge> },
          { header: 'Status', cell: (r) => <Badge>{r.status}</Badge> },
          { header: 'Reported', cell: (r) => date(r.createdAt) },
          {
            header: '',
            cell: (r) => (
              <Actions>
                {admin && r.status === 'Open' && <Action onClick={() => move(r, 'InProgress')}>Start work</Action>}
                {admin && r.status === 'InProgress' && (
                  <>
                    <Action onClick={() => setResolving(r)}>Resolve</Action>
                    <Action onClick={() => move(r, 'Open')}>Back to open</Action>
                  </>
                )}
                {r.status === 'Open' && (
                  <Action danger onClick={() => cancel(r)}>
                    Cancel
                  </Action>
                )}
              </Actions>
            ),
          },
        ]}
      />

      {creating && <NewRequestModal admin={admin} onClose={() => setCreating(false)} onCreated={query.reload} />}

      {resolving && (
        <FormModal
          title={`Resolve "${resolving.title}"`}
          submitLabel="Mark as resolved"
          onClose={() => setResolving(null)}
          onSubmit={async (f) => {
            await api(`/maintenance/${resolving.id}/status`, {
              method: 'PATCH',
              body: { status: 'Resolved', resolutionNotes: f.resolutionNotes },
            })
            query.reload()
          }}
        >
          <TextArea label="What was done to fix it?" name="resolutionNotes" required maxLength={2000} />
        </FormModal>
      )}
    </>
  )
}

function NewRequestModal({ admin, onClose, onCreated }: { admin: boolean; onClose: () => void; onCreated: () => void }) {
  return (
    <FormModal
      title={admin ? 'Log a maintenance request' : 'Report a problem'}
      submitLabel="Submit"
      onClose={onClose}
      onSubmit={async (f) => {
        await api('/maintenance', {
          method: 'POST',
          body: {
            // Tenants don't choose: the API uses the apartment on their active lease
            apartmentId: f.apartmentId ? Number(f.apartmentId) : null,
            title: f.title,
            description: f.description,
            priority: f.priority,
          },
        })
        onCreated()
      }}
    >
      {admin && <ApartmentSelect />}
      <Field label="What's wrong?" name="title" placeholder="e.g. Leaking kitchen faucet" required maxLength={100} />
      <TextArea label="Details" name="description" required maxLength={2000} />
      <Select label="Priority" name="priority" defaultValue="Normal">
        {priorities.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>
    </FormModal>
  )
}

function ApartmentSelect() {
  // Tops out at 50 apartments (the API's largest page); past that it needs a search box
  const apartments = useFetch<Paged<Apartment>>('/apartments?pageSize=50')

  return (
    <Select label="Apartment" name="apartmentId" defaultValue="" required key={apartments.data ? 'loaded' : 'loading'}>
      <option value="" disabled>
        Choose an apartment
      </option>
      {apartments.data?.items.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} · {a.location}
        </option>
      ))}
    </Select>
  )
}
