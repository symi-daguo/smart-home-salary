import { create } from 'zustand'

type ThemeMode = 'light' | 'dark'

type UiState = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  appName: string
  setAppName: (name: string) => void
  appLogo: string | null
  setAppLogo: (logo: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  appName: '智能家居行业SAAS管理系统',
  setAppName: (appName) => set({ appName }),
  appLogo: null,
  setAppLogo: (appLogo) => set({ appLogo }),
}))

