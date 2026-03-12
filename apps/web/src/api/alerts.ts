import { http } from './http'

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export type Alert = {
  id: string
  projectId?: string | null
  severity: AlertSeverity
  title: string
  message: string
  metadata?: any
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
  const resp = await http.post<any>('/alerts/run', { projectId })
  return resp.data
}

export async function resolveAlert(id: string) {
  const resp = await http.patch<Alert>(`/alerts/${id}/resolve`)
  return resp.data
}

