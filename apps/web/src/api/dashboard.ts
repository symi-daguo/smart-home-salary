import { http } from './http'

export type DashboardOverview = {
  totalRevenueThisMonth: number
  salesOrderCountThisMonth: number
  activeEmployeeCount: number
  pendingAlertCount: number
}

export type DashboardRevenueTrendPoint = {
  month: string
  revenue: number
}

export type DashboardInstallationBreakdownItem = {
  category: string
  quantity: number
}

export type DashboardRecentSalesItem = {
  id: string
  projectName: string
  employeeName: string
  amount: number
  occurredAt: string
}

export type DashboardRecentInstallationItem = {
  id: string
  productName: string
  employeeName: string
  serviceType: 'INSTALL' | 'DEBUG' | 'AFTER_SALES'
  quantity: number
  occurredAt: string
}

export async function getDashboardOverview() {
  const resp = await http.get<DashboardOverview>('/dashboard/overview')
  return resp.data
}

export async function getDashboardRevenueTrend(params?: { months?: number }) {
  const resp = await http.get<DashboardRevenueTrendPoint[]>('/dashboard/revenue-trend', { params })
  return resp.data
}

export async function getDashboardInstallationBreakdown(params?: { days?: number; limit?: number }) {
  const resp = await http.get<DashboardInstallationBreakdownItem[]>('/dashboard/installation-breakdown', { params })
  return resp.data
}

export async function getDashboardRecentSales(params?: { limit?: number }) {
  const resp = await http.get<DashboardRecentSalesItem[]>('/dashboard/recent-sales', { params })
  return resp.data
}

export async function getDashboardRecentInstallations(params?: { limit?: number }) {
  const resp = await http.get<DashboardRecentInstallationItem[]>('/dashboard/recent-installations', { params })
  return resp.data
}

