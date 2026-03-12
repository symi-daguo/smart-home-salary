import { http } from './http'

export type ServiceType = 'INSTALL' | 'DEBUG' | 'AFTER_SALES'

export type InstallationRecord = {
  id: string
  projectId: string
  employeeId: string
  productId: string
  serviceType: ServiceType
  quantity: number
  difficultyFactor: string | number
  photoUrls?: string[] | null
  description?: string | null
  occurredAt: string
  createdAt: string
  updatedAt: string
  employee?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  product?: { id: string; name: string } | null
}

export type CreateInstallationRecordInput = {
  projectId: string
  employeeId: string
  productId: string
  serviceType: ServiceType
  quantity: number
  difficultyFactor?: number
  photoUrls?: string[]
  description?: string
  occurredAt?: string
}

export type UpdateInstallationRecordInput = Partial<CreateInstallationRecordInput>

export async function listInstallationRecords() {
  const resp = await http.get<InstallationRecord[]>('/installation-records')
  return resp.data
}

export async function createInstallationRecord(input: CreateInstallationRecordInput) {
  const resp = await http.post<InstallationRecord>('/installation-records', input)
  return resp.data
}

export async function updateInstallationRecord(id: string, input: UpdateInstallationRecordInput) {
  const resp = await http.put<InstallationRecord>(`/installation-records/${id}`, input)
  return resp.data
}

export async function deleteInstallationRecord(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/installation-records/${id}`)
  return resp.data
}

