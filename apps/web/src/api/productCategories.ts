import { http } from './http'

export type ProductCategory = {
  id: string
  name: string
  recommendedInstallationFee: string | number
  recommendedDebuggingFee?: string | number | null
  recommendedOtherFee?: string | number | null
  remark?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateProductCategoryInput = {
  name: string
  recommendedInstallationFee: number
  recommendedDebuggingFee?: number
  recommendedOtherFee?: number
  remark?: string
}

export type UpdateProductCategoryInput = Partial<CreateProductCategoryInput>

export async function listProductCategories() {
  const resp = await http.get<ProductCategory[]>('/product-categories')
  return resp.data
}

export async function createProductCategory(input: CreateProductCategoryInput) {
  const resp = await http.post<ProductCategory>('/product-categories', input)
  return resp.data
}

export async function updateProductCategory(id: string, input: UpdateProductCategoryInput) {
  const resp = await http.patch<ProductCategory>(`/product-categories/${id}`, input)
  return resp.data
}

export async function deleteProductCategory(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/product-categories/${id}`)
  return resp.data
}

