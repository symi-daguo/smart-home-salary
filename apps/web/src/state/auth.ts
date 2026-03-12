import { create } from 'zustand'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  activeTenantId: string | null
  roles: string[] | null
  setTokens: (accessToken: string, refreshToken: string) => void
  setActiveTenantId: (tenantId: string | null) => void
  setRoles: (roles: string[] | null) => void
  logout: () => void
}

const ACCESS_TOKEN_KEY = 'salary.accessToken'
const REFRESH_TOKEN_KEY = 'salary.refreshToken'
const ACTIVE_TENANT_ID_KEY = 'salary.activeTenantId'
const ROLES_KEY = 'salary.roles'

function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: readLocalStorage(ACCESS_TOKEN_KEY),
  refreshToken: readLocalStorage(REFRESH_TOKEN_KEY),
  activeTenantId: readLocalStorage(ACTIVE_TENANT_ID_KEY),
  roles: (() => {
    const raw = readLocalStorage(ROLES_KEY)
    return raw ? raw.split(',').filter(Boolean) : null
  })(),
  setTokens: (accessToken, refreshToken) =>
    set(() => {
      writeLocalStorage(ACCESS_TOKEN_KEY, accessToken)
      writeLocalStorage(REFRESH_TOKEN_KEY, refreshToken)
      return { accessToken, refreshToken }
    }),
  setActiveTenantId: (tenantId) =>
    set(() => {
      writeLocalStorage(ACTIVE_TENANT_ID_KEY, tenantId)
      return { activeTenantId: tenantId }
    }),
  setRoles: (roles) =>
    set(() => {
      writeLocalStorage(ROLES_KEY, roles && roles.length ? roles.join(',') : null)
      return { roles }
    }),
  logout: () =>
    set(() => {
      writeLocalStorage(ACCESS_TOKEN_KEY, null)
      writeLocalStorage(REFRESH_TOKEN_KEY, null)
      writeLocalStorage(ACTIVE_TENANT_ID_KEY, null)
      writeLocalStorage(ROLES_KEY, null)
      return { accessToken: null, refreshToken: null, activeTenantId: null, roles: null }
    }),
}))

