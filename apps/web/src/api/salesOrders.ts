import { http } from './http'

export type SalesOrder = {
  id: string
  projectId: string
  employeeId: string
  amount: string | number
  discountRate: string | number
  paymentProofUrls?: string[] | null
  remark?: string | null
  verified: boolean
  occurredAt: string
  createdAt: string
  updatedAt: string
  items?: Array<{ id: string; productId: string; quantity: number; standardPrice?: string | number | null }>
  employee?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
}

export type SalesOrderItemInput = { productId: string; quantity: number; standardPrice?: number }

export type CreateSalesOrderInput = {
  projectId: string
  employeeId: string
  amount: number
  discountRate: number
  verified?: boolean
  occurredAt?: string
  paymentProofUrls?: string[]
  remark?: string
  items?: SalesOrderItemInput[]
}

export type UpdateSalesOrderInput = Partial<CreateSalesOrderInput>

export async function listSalesOrders() {
  const resp = await http.get<SalesOrder[]>('/sales-orders')
  return resp.data
}

export async function getSalesOrder(id: string) {
  const resp = await http.get<SalesOrder>(`/sales-orders/${id}`)
  return resp.data
}

export async function createSalesOrder(input: CreateSalesOrderInput) {
  const resp = await http.post<SalesOrder>('/sales-orders', input)
  return resp.data
}

export async function updateSalesOrder(id: string, input: UpdateSalesOrderInput) {
  const resp = await http.put<SalesOrder>(`/sales-orders/${id}`, input)
  return resp.data
}

export async function deleteSalesOrder(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/sales-orders/${id}`)
  return resp.data
}

