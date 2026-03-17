import { http } from './http'

export type SalaryStatus = 'DRAFT' | 'APPROVED' | 'PAID'

export type Salary = {
  id: string
  employeeId: string
  yearMonth: string
  baseSalary: string | number
  salesCommission: string | number
  tierCommission: string | number
  technicalFee: string | number
  allowances: string | number
  penalty: string | number
  total: string | number
  status: SalaryStatus
  paidDate?: string | null
  createdAt: string
  updatedAt: string
  employee?: { id: string; name: string; phone: string; position?: { id: string; name: string } | null } | null
}

export async function settleSalaries(input: { yearMonth: string; employeeIds?: string[] }) {
  const resp = await http.post<Salary[]>('/salaries/settle', input)
  return resp.data
}

export async function listSalaries(params?: { yearMonth?: string; employeeId?: string; status?: SalaryStatus }) {
  const qs = new URLSearchParams()
  if (params?.yearMonth) qs.set('yearMonth', params.yearMonth)
  if (params?.employeeId) qs.set('employeeId', params.employeeId)
  if (params?.status) qs.set('status', params.status)
  const resp = await http.get<Salary[]>(`/salaries${qs.toString() ? `?${qs.toString()}` : ''}`)
  return resp.data
}

export async function updateSalaryStatus(id: string, status: SalaryStatus) {
  const resp = await http.patch<Salary>(`/salaries/${id}/status`, { status })
  return resp.data
}

export async function updateSalary(id: string, data: { baseSalary?: number; salesCommission?: number; technicalFee?: number; allowances?: number; penalty?: number }) {
  const resp = await http.patch<Salary>(`/salaries/${id}`, data)
  return resp.data
}

export async function exportSalaries(params?: { yearMonth?: string; employeeId?: string; status?: SalaryStatus }) {
  const qs = new URLSearchParams()
  if (params?.yearMonth) qs.set('yearMonth', params.yearMonth)
  if (params?.employeeId) qs.set('employeeId', params.employeeId)
  if (params?.status) qs.set('status', params.status)
  const url = `/excel/salaries/export${qs.toString() ? `?${qs.toString()}` : ''}`
  const resp = await http.get<Blob>(url, { responseType: 'blob' })
  return resp.data
}

