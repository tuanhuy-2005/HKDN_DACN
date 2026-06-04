const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// ─── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (globalThis.window === undefined) return null
  return localStorage.getItem('cafe_token')
}

export function setToken(token: string): void {
  localStorage.setItem('cafe_token', token)
  globalThis.dispatchEvent(new Event('cafe-auth-updated'))
}

export function removeToken(): void {
  localStorage.removeItem('cafe_token')
  localStorage.removeItem('cafe_user')
  globalThis.dispatchEvent(new Event('cafe-auth-updated'))
}

export function getUser(): Record<string, unknown> | null {
  if (globalThis.window === undefined) return null
  const u = localStorage.getItem('cafe_user')
  return u ? JSON.parse(u) : null
}

export function setUser(user: Record<string, unknown>): void {
  localStorage.setItem('cafe_user', JSON.stringify(user))
  globalThis.dispatchEvent(new Event('cafe-auth-updated'))
}

// ─── Base fetcher ───────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`)
  }

  return data
}

// ─── Auth ───────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string
  user: {
    id: number
    name: string
    email: string
    phone: string
    role: string
  }
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const data = await request<{ data: AuthPayload }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.data
}

export async function register(payload: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<AuthPayload> {
  const data = await request<{ data: AuthPayload }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.data
}

export async function getMe() {
  const data = await request<{ data: { user: Record<string, unknown> } }>('/auth/me')
  return data.data.user
}

export async function updateMe(payload: {
  name?: string
  email?: string
  phone?: string
}): Promise<{ data: { user: Record<string, unknown> } }> {
  return request<{ data: { user: Record<string, unknown> } }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Menu ───────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  description: string | null
  image_url: string | null
  is_active: number
}

export interface PaginatedResponse<T> {
  data: { items: T[] }
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export async function getMenuItems(params?: {
  q?: string
  category?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<MenuItem>> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.category) qs.set('category', params.category)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  return request<PaginatedResponse<MenuItem>>(`/menu?${qs}`)
}

export async function getMenuItem(id: number): Promise<{ data: MenuItem }> {
  return request<{ data: MenuItem }>(`/menu/${id}`)
}

// Admin menu
export async function getAdminMenuItems(params?: {
  q?: string
  category?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<MenuItem>> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.category) qs.set('category', params.category)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  return request<PaginatedResponse<MenuItem>>(`/admin/menu?${qs}`)
}

export async function createMenuItem(payload: Partial<MenuItem>): Promise<{ data: MenuItem }> {
  return request<{ data: MenuItem }>('/admin/menu', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getAdminMenuItem(id: number): Promise<{ data: MenuItem }> {
  return request<{ data: MenuItem }>(`/admin/menu/${id}`)
}

export async function updateMenuItem(id: number, payload: Partial<MenuItem>): Promise<{ data: MenuItem }> {
  return request<{ data: MenuItem }>(`/admin/menu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteMenuItem(id: number): Promise<void> {
  await request(`/admin/menu/${id}`, { method: 'DELETE' })
}

export async function uploadMenuImage(file: File): Promise<{ data: { image_url: string } }> {
  const token = getToken()
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API_URL}/uploads/menu-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Upload failed')
  return data
}

// ─── Reservations ───────────────────────────────────────────────────────────────

export interface Reservation {
  id: number
  user_id: number | null
  name: string
  email: string
  phone: string
  reservation_date: string
  reservation_time: string
  guests: number
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string | null
  // aliases added by backend
  customer?: string
  date?: string
  time?: string
  createdAt?: string
}

export async function createReservation(payload: {
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  notes?: string
}): Promise<{ data: { id: number; status: string } }> {
  return request('/reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMyReservations(): Promise<{ data: { items: Reservation[] } }> {
  return request('/reservations/me')
}

export async function getMyInvoices(): Promise<{ data: { items: Invoice[] } }> {
  return request('/invoices/me')
}

export async function createInvoice(payload: {
  items: { menu_item_id: number; quantity: number }[]
  reservation_id?: number
  payment_method?: string
  status?: string
}): Promise<{ data: { id: number; code: string; status: string; payment_method: string | null; paymentMethod: string | null } }> {
  return request('/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getAdminReservations(params?: {
  q?: string
  status?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Reservation>> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.status) qs.set('status', params.status)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  return request<PaginatedResponse<Reservation>>(`/admin/reservations?${qs}`)
}

export async function getAdminReservation(id: number): Promise<{ data: Reservation }> {
  return request<{ data: Reservation }>(`/admin/reservations/${id}`)
}

export async function updateAdminReservation(
  id: number,
  payload: { status?: string; notes?: string; date?: string; time?: string; guests?: number }
): Promise<{ data: Reservation }> {
  return request<{ data: Reservation }>(`/admin/reservations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Invoices ──────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  menu_item_id: number
  name: string
  quantity: number
  price: number
  unit_price: number
  line_total: number
}

export interface Invoice {
  id: number
  code: string
  status: string
  payment_method: string | null
  paymentMethod: string | null
  subtotal: number
  total: number
  created_at: string
  // aliases
  customer?: string
  date?: string
  time?: string
  id_str?: string
  items?: InvoiceItem[]
  user_name?: string
}

export async function getAdminInvoices(params?: {
  q?: string
  status?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Invoice>> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.status) qs.set('status', params.status)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  return request<PaginatedResponse<Invoice>>(`/admin/invoices?${qs}`)
}

export interface AdminSummary {
  counts: {
    users: number
    menuItems: number
    reservations: number
    pendingReservations: number
    invoices: number
    paidInvoices: number
  }
  revenue: number
  recentInvoices: Invoice[]
  recentReservations: Reservation[]
}

export async function getAdminSummary(): Promise<{ data: AdminSummary }> {
  return request<{ data: AdminSummary }>('/admin/summary')
}

export async function getAdminInvoice(id: string | number): Promise<{ data: Invoice }> {
  return request<{ data: Invoice }>(`/admin/invoices/${id}`)
}

export async function updateAdminInvoice(
  id: string | number,
  payload: { status?: string; payment_method?: string }
): Promise<{ data: Invoice }> {
  return request<{ data: Invoice }>(`/admin/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Users ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: string
  created_at: string
}

export async function getAdminUsers(params?: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<User>> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  return request<PaginatedResponse<User>>(`/admin/users?${qs}`)
}

export async function updateAdminUser(
  id: number,
  payload: { role?: string; name?: string; email?: string; phone?: string }
): Promise<{ data: User }> {
  return request<{ data: User }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getAdminUser(id: number): Promise<{ data: User }> {
  return request<{ data: User }>(`/admin/users/${id}`)
}

// ─── Health check ────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    await fetch(`${API_URL}/health`)
    return true
  } catch {
    return false
  }
}
