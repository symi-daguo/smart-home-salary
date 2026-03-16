import { http } from './http'

export type Position = {
  id: string
  name: string
  baseSalary: string | number
  commissionRule: Record<string, unknown>
  bonusRule?: Record<string, unknown> | null
  phoneAllowance: string | number
  transportAllowance: string | number
  otherAllowance: string | number
  createdAt: string
  updatedAt: string
}

export type CreatePositionInput = {
  name: string
  baseSalary: number
  commissionRule: Record<string, unknown>
  bonusRule?: Record<string, unknown>
  phoneAllowance?: number
  transportAllowance?: number
  otherAllowance?: number
}

export type UpdatePositionInput = Partial<CreatePositionInput>

export async function listPositions() {
  const resp = await http.get<Position[]>('/positions')
  return resp.data
}

export async function createPosition(input: CreatePositionInput) {
  const resp = await http.post<Position>('/positions', input)
  return resp.data
}

export async function updatePosition(id: string, input: UpdatePositionInput) {
  const resp = await http.put<Position>(`/positions/${id}`, input)
  return resp.data
}

export async function deletePosition(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/positions/${id}`)
  return resp.data
}

