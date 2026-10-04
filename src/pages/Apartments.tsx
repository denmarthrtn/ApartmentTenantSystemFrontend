import { useState } from 'react'
import { api } from '../api'
import type { Apartment } from '../api'
import { money, run, usePaged } from '../lib'
import { Action, Actions, Button, Field, FormModal, PageHeader, Table } from '../ui'

export default function Apartments() {
  const query = usePaged<Apartment>('/apartments')
  const [editing, setEditing] = useState<Partial<Apartment> | null>(null) // {} means "new apartment"

  // The list doesn't include the address, so load the full record before editing
  const edit = (id: number) => run(async () => setEditing(await api<Apartment>(`/apartments/${id}`)))

  const remove = (apartment: Apartment) => {
    if (!confirm(`Delete ${apartment.name}? Its tenants are deleted with it.`)) return
    run(() => api(`/apartments/${apartment.id}`, { method: 'DELETE' }), query.reload)
  }

  return (
    <>
      <PageHeader title="Apartments" subtitle="Every unit you manage.">
        <Button onClick={() => setEditing({})}>Add apartment</Button>
      </PageHeader>

      <Table
        query={query}
        empty="No apartments yet. Add your first one."
        columns={[
          { header: 'Name', cell: (a) => <span className="font-semibold text-stone-900">{a.name}</span> },
          { header: 'Location', cell: (a) => a.location },
          { header: 'Rooms', cell: (a) => a.rooms },
          { header: 'Parking', cell: (a) => (a.hasParking ? 'Yes' : 'No') },
          { header: 'Monthly rent', cell: (a) => money(a.rent) },
          {
            header: '',
            cell: (a) => (
              <Actions>
                <Action onClick={() => edit(a.id)}>Edit</Action>
                <Action danger onClick={() => remove(a)}>
                  Delete
                </Action>
              </Actions>
            ),
          },
        ]}
      />

      {editing && (
        <FormModal
          title={editing.id ? 'Edit apartment' : 'Add apartment'}
          onClose={() => setEditing(null)}
          onSubmit={async (f) => {
            await api(editing.id ? `/apartments/${editing.id}` : '/apartments', {
              method: editing.id ? 'PUT' : 'POST',
              body: {
                id: editing.id,
                name: f.name,
                location: f.location,
                address: f.address,
                rent: Number(f.rent),
                rooms: Number(f.rooms),
                hasParking: f.hasParking === 'on',
              },
            })
            query.reload()
          }}
        >
          <Field label="Name" name="name" defaultValue={editing.name} required maxLength={100} />
          <Field label="City or area" name="location" defaultValue={editing.location} required maxLength={100} />
          <Field label="Street address" name="address" defaultValue={editing.address} required maxLength={200} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly rent" name="rent" type="number" min="0.01" step="0.01" defaultValue={editing.rent} required />
            <Field label="Rooms" name="rooms" type="number" min="1" max="20" defaultValue={editing.rooms} required />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input type="checkbox" name="hasParking" defaultChecked={editing.hasParking} className="size-4 accent-teal-700" />
            Has parking
          </label>
        </FormModal>
      )}
    </>
  )
}
