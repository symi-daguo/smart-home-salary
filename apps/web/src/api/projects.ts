import { http } from './http'

export type ProjectStatus = 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'

export type ProjectItemInput = {
  productId: string
  standardQuantity: number
  standardPrice?: number
}

export type Project = {
  id: string
  name: string
  address: string
  customerName: string
  customerPhone: string
  contractAmount: string | number
  signDate: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  items?: Array<{
    id: string
    productId: string
    standardQuantity: number
    standardPrice: string | number
    product?: { id: string; name: string } | null
  }>
}

export type CreateProjectInput = {
  name: string
  address: string
  customerName: string
  customerPhone: string
  contractAmount: number
  signDate: string
  status?: ProjectStatus
  items?: ProjectItemInput[]
}

export type UpdateProjectInput = Partial<CreateProjectInput>

export type ProjectStats = {
  projectId: string
  projectName: string
  serviceFee: number
  signDiscountRate: number
  salesAmount: number
  outboundAmount: number
  installFee: number
  debugFee: number
  productDiscountRate: number
  comprehensiveDiscountRate: number
  originalReceivable: number
  discountedReceivable: number
}

export async function listProjects(params?: { q?: string; limit?: number }) {
  const resp = await http.get<Project[]>('/projects', { params })
  return resp.data
}

export async function getProject(id: string) {
  const resp = await http.get<Project>(`/projects/${id}`)
  return resp.data
}

export async function createProject(input: CreateProjectInput) {
  const resp = await http.post<Project>('/projects', input)
  return resp.data
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const resp = await http.put<Project>(`/projects/${id}`, input)
  return resp.data
}

export async function deleteProject(id: string) {
  const resp = await http.delete<{ success: boolean }>(`/projects/${id}`)
  return resp.data
}

export async function getProjectStats(id: string) {
  const resp = await http.get<ProjectStats>(`/projects/${id}/stats`)
  return resp.data
}

