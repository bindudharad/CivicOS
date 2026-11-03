export interface User {
  username: string
  role: string
  email?: string
}

export function getToken(): string | null {
  return localStorage.getItem('civicos_token')
}

export function getUser(): User | null {
  const raw = localStorage.getItem('civicos_user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function saveSession(token: string, user: User): void {
  localStorage.setItem('civicos_token', token)
  localStorage.setItem('civicos_user', JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem('civicos_token')
  localStorage.removeItem('civicos_user')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// Role hierarchy
const ROLE_LEVELS: Record<string, number> = {
  administrator: 4,
  municipal_officer: 3,
  department_operator: 2,
  viewer: 1,
}

export function hasRole(user: User | null, required: string): boolean {
  if (!user) return false
  return (ROLE_LEVELS[user.role] ?? 0) >= (ROLE_LEVELS[required] ?? 0)
}
