import { http } from './http'

export type Product = {
  id: string
  name: string
  category: string
  standardPrice: string | number
  costPrice?: string | number | null
  installationFee: string | number
  debuggingFee?: string | number | null
  otherFee?: string | number | null
  maintenanceDeposit?: string | number | null
  isSpecialInstallation: boolean
  status?: string
  specification?: string | null
  unit?: string | null
  isFabric?: boolean
  suggestedStockQty?: number | null
  techCommissionInstall?: string | number | null
  techCommissionDebug?: string | number | null
  techCommissionMaintenance?: string | number | null
  techCommissionAfterSales?: string | number | null
  createdAt: string
  updatedAt: string
}

export type CreateProductInput = {
  name: string
  category: string
  standardPrice: number
  costPrice?: number
  installationFee: number
  debuggingFee?: number
  otherFee?: number
  maintenanceDeposit?: number
  isSpecialInstallation?: boolean
  specification?: string
  unit?: string
  isFabric?: boolean
  suggestedStockQty?: number
  techCommissionInstall?: number
  techCommissionDebug?: number
  techCommissionMaintenance?: number
  techCommissionAfterSales?: number
}

export type UpdateProductInput = Partial<CreateProductInput>

export async function listProducts(params?: { q?: string; limit?: number }) {
  const resp = await http.get<Product[]>('/products', { params })
  return resp.data
}

export async function createProduct(input: CreateProductInput) {
  const resp = await http.post<Product>('/products', input)
  return resp.data
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const resp = await http.put<Product>(`/products/${id}`, input)
  return resp.data
}

export async function deleteProduct(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/products/${id}`)
  return resp.data
}
