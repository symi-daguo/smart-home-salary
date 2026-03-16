import { http } from './http'

export type EmployeeType = {
  id: string
  key: string
  name: string
  skillTags?: string[]
  createdAt: string
  updatedAt: string
}

export type CreateEmployeeTypeInput = {
  key: string
  name: string
  skillTags?: string[]
}

export type UpdateEmployeeTypeInput = Partial<CreateEmployeeTypeInput>

export async function listEmployeeTypes() {
  const resp = await http.get<EmployeeType[]>('/employee-types')
  return resp.data
}

export async function createEmployeeType(input: CreateEmployeeTypeInput) {
  const resp = await http.post<EmployeeType>('/employee-types', input)
  return resp.data
}

export async function updateEmployeeType(id: string, input: UpdateEmployeeTypeInput) {
  const resp = await http.patch<EmployeeType>(`/employee-types/${id}`, input)
  return resp.data
}

export async function deleteEmployeeType(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/employee-types/${id}`)
  return resp.data
}

