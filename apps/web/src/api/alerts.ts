import { http } from './http'

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export type Alert = {
  id: string
  projectId?: string | null
  severity: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, unknown> | null
  resolvedAt?: string | null
  createdAt: string
}

export async function listAlerts(params?: { projectId?: string; severity?: AlertSeverity; unresolved?: boolean }) {
  const qs = new URLSearchParams()
  if (params?.projectId) qs.set('projectId', params.projectId)
  if (params?.severity) qs.set('severity', params.severity)
  if (params?.unresolved) qs.set('unresolved', 'true')
  const resp = await http.get<Alert[]>(`/alerts${qs.toString() ? `?${qs.toString()}` : ''}`)
  return resp.data
}

export async function runAlertCompare(projectId: string) {
  const resp = await http.post<{ success: boolean }>('/alerts/run', { projectId })
  return resp.data
}

export async function resolveAlert(id: string) {
  const resp = await http.patch<Alert>(`/alerts/${id}/resolve`)
  return resp.data
}

export async function runAllAlerts() {
  const resp = await http.post<{ stockAlerts: number; discountAlerts: number; paymentAlerts: number; total: number }>('/alerts/run-all')
  return resp.data
}

export type AlertCondition =
  | 'DISCOUNT_BELOW_THRESHOLD'
  | 'PAYMENT_BELOW_OUTBOUND'
  | 'STOCK_BELOW_SUGGESTED'
  | 'PROJECT_DISCOUNT_MISMATCH'

export type AlertRule = {
  id: string
  type: 'SALES' | 'INVENTORY'
  name: string
  condition: AlertCondition
  threshold?: string | null
  enabled: boolean
  updatedAt: string
}

export async function listAlertRules() {
  const resp = await http.get<AlertRule[]>('/alerts/rules')
  return resp.data
}

export async function saveAlertRules(rules: Array<{ condition: AlertCondition; threshold?: string; enabled?: boolean }>) {
  const resp = await http.post<{ success: boolean; count: number }>('/alerts/rules', { rules })
  return resp.data
}

