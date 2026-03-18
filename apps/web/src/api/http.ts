import axios from 'axios'
import { message } from 'antd'
import { useAuthStore } from '../state/auth'

function detectDefaultApiBase() {
  // Browser (Docker / dev): use relative /api so it can be proxied/reversed.
  // Desktop (Tauri): default to local embedded API.
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    return 'http://127.0.0.1:3000/api'
  }
  return '/api'
}

const apiBase = import.meta.env.VITE_API_BASE ?? detectDefaultApiBase()

export const http = axios.create({
  baseURL: apiBase,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const { accessToken, activeTenantId } = useAuthStore.getState()
  if (accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (activeTenantId) {
    config.headers = config.headers ?? {}
    config.headers['X-Tenant-ID'] = activeTenantId
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = String(err?.config?.url ?? '')

    // 401：统一退出逻辑
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      const { logout } = useAuthStore.getState()
      logout()
      if (typeof window !== 'undefined') {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?next=${next}`
      }
      return Promise.reject(err)
    }

    // 其他错误：尽量用后端 message + 兜底中文提示（借鉴 Sword 的做法）
    if (typeof window !== 'undefined' && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      const respMessage: string | undefined = err?.response?.data?.message
      const fallback =
        status === 400
          ? '请求参数有误，请检查填写内容。'
          : status === 403
          ? '当前账号无权限执行该操作，如有需要请联系管理员。'
          : status === 404
          ? '请求的资源不存在或已被删除。'
          : status === 500
          ? '服务器发生错误，请稍后重试或联系技术支持。'
          : '请求失败，请稍后重试。'

      message.error(respMessage || fallback)
    }

    return Promise.reject(err)
  },
)

