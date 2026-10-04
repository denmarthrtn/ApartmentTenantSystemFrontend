import { useState } from 'react'
import { api } from '../api'
import type { Apartment, Paged, Tenant } from '../api'
import { dateInput, run, today, useFetch, usePaged } from '../lib'
import { Action, Actions, Button, Field, FormModal, PageHeader, Select, Table } from '../ui'

export default function Tenants() {
  const query = usePaged<Tenant>('/tenant')
  // The API returns at most 50 per page, so this dropdown tops out at 50 apartments.
  // Past that it needs a search box instead of a plain <select>.
  const apartments = useFetch<Paged<Apartment>>('/apartments?pageSize=50')
  const [editing, setEditing] = useState<Partial<Tenant> | null>(null) // {} means "new tenant"
  const [loginFor, setLoginFor] = useState<Tenant | null>(null)

  // The list doesn't include the address or dates, so load the full record before editing
  const edit = (id: number) => run(async () => setEditing(await api<Tenant>(`/tenant/${id}`)))

  const remove = (tenant: Tenant) => {
    if (!confirm(`Delete ${tenant.name}?`)) return
    run(() => api(`/tenant/${tenant.id}`, { method: 'DELETE' }), query.reload)
  }

  return (
    <>
      <PageHeader title="Tenants" subtitle="The people renting from you.">
        <Button onClick={() => setEditing({})}>Add tenant</Button>
      </PageHeader>

      <Table
        query={query}
        empty="No tenants yet."
        columns={[
          { header: 'Name', cell: (t) => <span className="font-semibold text-stone-900">{t.name}</span> },
          { header: 'Email', cell: (t) => t.email },
          { header: 'Phone', cell: (t) => t.phoneNumber },
          { header: 'Apartment', cell: (t) => `${t.apartmentName} · ${t.apartmentLocation}` },
          {
            header: '',
            cell: (t) => (
              <Actions>
                <Action onClick={() => edit(t.id)}>Edit</Action>
                <Action onClick={() => setLoginFor(t)}>Create login</Action>
                <Action danger onClick={() => remove(t)}>
                  Delete
                </Action>
              </Actions>
            ),
          },
        ]}
      />

      {editing && (
        <FormModal
          title={editing.id ? 'Edit tenant' : 'Add tenant'}
          onClose={() => setEditing(null)}
          onSubmit={async (f) => {
            await api(editing.id ? `/tenant/${editing.id}` : '/tenant', {
              method: editing.id ? 'PUT' : 'POST',
              body: {
                id: editing.id,
                name: f.name,
                email: f.email,
                phoneNumber: f.phoneNumber,
                permanentAddress: f.permanentAddress,
                moveInDate: f.moveInDate,
                moveOutDate: f.moveOutDate || null,
                apartmentId: Number(f.apartmentId),
              },
            })
            query.reload()
          }}
        >
          <Field label="Full name" name="name" defaultValue={editing.name} required maxLength={100} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" name="email" type="email" defaultValue={editing.email} required />
            <Field
              label="Phone"
              name="phoneNumber"
              defaultValue={editing.phoneNumber}
              required
              pattern="\+?[0-9 \-]{7,20}"
              title="7 to 20 digits. Spaces, dashes and a leading + are allowed."
            />
          </div>
          <Field
            label="Permanent address"
            name="permanentAddress"
            defaultValue={editing.permanentAddress}
            required
            maxLength={200}
          />
          <Select label="Apartment" name="apartmentId" defaultValue={editing.apartmentId ?? ''} required key={apartments.data ? 'loaded' : 'loading'}>
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
            <Field label="Move-in date" name="moveInDate" type="date" defaultValue={dateInput(editing.moveInDate) || today()} required />
            {editing.id && (
              <Field label="Move-out date" name="moveOutDate" type="date" defaultValue={dateInput(editing.moveOutDate)} />
            )}
          </div>
        </FormModal>
      )}

      {loginFor && (
        <FormModal
          title={`Create a login for ${loginFor.name}`}
          submitLabel="Create login"
          onClose={() => setLoginFor(null)}
          onSubmit={(f) =>
            api('/auth/register-tenant', {
              method: 'POST',
              body: { tenantId: loginFor.id, email: f.email, password: f.password },
            })
          }
        >
          <p className="text-sm text-stone-500">
            They'll sign in with this email and password to see their lease, bills and maintenance requests.
          </p>
          <Field label="Email" name="email" type="email" defaultValue={loginFor.email} required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" required />
        </FormModal>
      )}
    </>
  )
}
