const BASE: string = import.meta.env.VITE_API_URL ?? ''
const KEY = 'apartments.session'
const CHANGED = 'apartments.session.changed'

// ---- Response shapes (they mirror the API's DTOs) ----

export interface Tokens {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
}

export interface User {
  email: string
  role: 'Admin' | 'Tenant'
  tenantId: number | null
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface Apartment {
  id: number
  name: string
  location: string
  address?: string // only on the detail endpoint
  rent: number
  rooms: number
  hasParking: boolean
}

export interface Tenant {
  id: number
  name: string
  email: string
  phoneNumber: string
  apartmentName: string
  apartmentLocation: string
  // only on the detail endpoint
  permanentAddress?: string
  moveInDate?: string
  moveOutDate?: string | null
  apartmentId?: number
}

export interface Lease {
  id: number
  tenantId: number
  tenantName: string
  apartmentId: number
  apartmentName: string
  startDate: string
  endDate: string
  terminatedDate: string | null
  monthlyRent: number
  securityDeposit: number
  status: 'Active' | 'Ended' | 'Terminated'
}

export interface Charge {
  id: number
  leaseId: number
  tenantName: string
  apartmentName: string
  billingMonth: string
  dueDate: string
  amount: number
  amountPaid: number
  balance: number
  status: 'Pending' | 'Paid' | 'Overdue'
}

export interface LeaseBalance {
  leaseId: number
  totalCharged: number
  totalPaid: number
  balance: number
  overdueAmount: number
  overdueCount: number
}

export interface BillingRun {
  asOf: string
  chargesCreated: number
  chargesMarkedOverdue: number
}

export interface MaintenanceRequest {
  id: number
  apartmentId: number
  apartmentName: string
  tenantId: number | null
  tenantName: string
  title: string
  description: string
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  status: 'Open' | 'InProgress' | 'Resolved' | 'Cancelled'
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  resolutionNotes: string | null
}

export interface Summary {
  asOf: string
  month: string
  totalApartments: number
  occupiedApartments: number
  vacantApartments: number
  occupancyRate: number
  rentBilledThisMonth: number
  rentCollectedThisMonth: number
  overdueCharges: number
  totalOverdue: number
  openMaintenanceRequests: number
  inProgressMaintenanceRequests: number
  urgentMaintenanceRequests: number
}

// ---- Session ----
// Tokens live in localStorage so a reload (or a second tab) stays signed in.

export const session = {
  raw: () => localStorage.getItem(KEY),
  get: (): Tokens | null => JSON.parse(localStorage.getItem(KEY) ?? 'null'),
  set(tokens: Tokens | null) {
    if (tokens) localStorage.setItem(KEY, JSON.stringify(tokens))
    else localStorage.removeItem(KEY)
    window.dispatchEvent(new Event(CHANGED))
  },
  // "storage" fires for other tabs, CHANGED for this one
  subscribe(onChange: () => void) {
    window.addEventListener('storage', onChange)
    window.addEventListener(CHANGED, onChange)
    return () => {
      window.removeEventListener('storage', onChange)
      window.removeEventListener(CHANGED, onChange)
    }
  },
}

// Reads who is signed in from the access token. This only decides what the UI shows;
// the API checks the token's signature and role on every request.
export function parseUser(raw: string | null): User | null {
  if (!raw) return null
  try {
    const { accessToken } = JSON.parse(raw) as Tokens
    const claims = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const roles: string[] = [claims.role].flat()
    return {
      email: claims.email,
      role: roles.includes('Admin') ? 'Admin' : 'Tenant',
      tenantId: claims.tenantId ? Number(claims.tenantId) : null,
    }
  } catch {
    return null
  }
}

// ---- Requests ----

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

// Refresh tokens are single use, and the API signs the user out everywhere if one is sent twice.
// The lock makes sure only one request (in any tab) refreshes; the others wait and reuse the result.
function refresh(staleAccessToken: string): Promise<boolean> {
  return navigator.locks.request('apartments.refresh', async () => {
    const current = session.get()
    if (!current) return false
    if (current.accessToken !== staleAccessToken) return true // someone else already refreshed

    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
    if (!res.ok) return false

    session.set(await res.json())
    return true
  })
}

export async function api<T = void>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const send = () => {
    const token = session.get()?.accessToken
    return fetch(`${BASE}/api${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  }

  const usedToken = session.get()?.accessToken
  let res: Response
  try {
    res = await send()
    if (res.status === 401 && usedToken && (await refresh(usedToken))) res = await send()
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the API is running.")
  }

  if (res.status === 401 && usedToken) session.set(null) // refresh failed too: back to the login page
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res, Boolean(usedToken)))

  return (res.status === 204 ? undefined : await res.json()) as T
}

async function errorMessage(res: Response, signedIn: boolean) {
  // The API's ErrorResponse: "details" lists every validation error, "message" is the short version
  const body = await res.json().catch(() => null)
  if (body?.details || body?.message) return body.details || body.message

  switch (res.status) {
    case 401: return signedIn ? 'Your session has expired. Please sign in again.' : 'Incorrect email or password.'
    case 403: return "You don't have access to that."
    case 404: return 'That record no longer exists.'
    case 429: return 'Too many attempts. Please wait a minute and try again.'
    default: return 'Something went wrong. Please try again.'
  }
}

export async function login(email: string, password: string) {
  session.set(await api<Tokens>('/auth/login', { method: 'POST', body: { email, password } }))
}

export async function logout() {
  const tokens = session.get()
  session.set(null)
  if (tokens) await api('/auth/logout', { method: 'POST', body: { refreshToken: tokens.refreshToken } }).catch(() => {})
}
