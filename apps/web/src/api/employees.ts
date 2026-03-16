import { http } from './http'

export type Employee = {
  id: string
  name: string
  phone: string
  entryDate: string
  status: 'ACTIVE' | 'INACTIVE'
  positionId: string
  employeeTypeId?: string | null
  membershipId?: string | null
  createdAt: string
  updatedAt: string
  position?: { id: string; name: string } | null
  employeeType?: { id: string; key: string; name: string; skillTags?: string[] } | null
}

export type CreateEmployeeInput = {
  name: string
  phone: string
  positionId: string
  employeeTypeId?: string | null
  membershipId?: string | null
  entryDate: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>

export async function listEmployees() {
  const resp = await http.get<Employee[]>('/employees')
  return resp.data
}

export async function createEmployee(input: CreateEmployeeInput) {
  const resp = await http.post<Employee>('/employees', input)
  return resp.data
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const resp = await http.put<Employee>(`/employees/${id}`, input)
  return resp.data
}

export async function deleteEmployee(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/employees/${id}`)
  return resp.data
}

