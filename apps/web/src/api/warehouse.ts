import { http } from './http'

export const OutboundApplicationType = {
  SALES_PRE: 'SALES_PRE',
  TECH_PRE: 'TECH_PRE',
} as const
export type OutboundApplicationType = typeof OutboundApplicationType[keyof typeof OutboundApplicationType]

export const OutboundApplicationStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CONVERTED: 'CONVERTED',
} as const
export type OutboundApplicationStatus = typeof OutboundApplicationStatus[keyof typeof OutboundApplicationStatus]

export const WarehouseOrderType = {
  OUTBOUND_SALES: 'OUTBOUND_SALES',
  OUTBOUND_LOAN: 'OUTBOUND_LOAN',
  OUTBOUND_AFTER_SALES: 'OUTBOUND_AFTER_SALES',
  OUTBOUND_LOST: 'OUTBOUND_LOST',
  INBOUND_SALES: 'INBOUND_SALES',
  INBOUND_PURCHASE: 'INBOUND_PURCHASE',
  INBOUND_AFTER_SALES: 'INBOUND_AFTER_SALES',
  INBOUND_UNKNOWN: 'INBOUND_UNKNOWN',
} as const
export type WarehouseOrderType = typeof WarehouseOrderType[keyof typeof WarehouseOrderType]

export const PaymentType = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  NEED_RETURN: 'NEED_RETURN',
  RETURN_LATER: 'RETURN_LATER',
  ON_ACCOUNT: 'ON_ACCOUNT',
  GIFT: 'GIFT',
  DESTROYED: 'DESTROYED',
} as const
export type PaymentType = typeof PaymentType[keyof typeof PaymentType]

export type OutboundApplicationItem = {
  id: string
  productId: string
  product?: { id: string; name: string; category: string }
  quantity: number
  snCodes?: string[]
  remark?: string
}

export type OutboundApplication = {
  id: string
  orderNo: string
  type: OutboundApplicationType
  status: OutboundApplicationStatus
  projectId?: string
  project?: { id: string; name: string }
  applicantId: string
  applicant?: { id: string; name: string }
  reviewerId?: string
  reviewer?: { id: string; name: string }
  reviewedAt?: string
  remark?: string
  items: OutboundApplicationItem[]
  createdAt: string
  updatedAt: string
}

export type WarehouseOrderItem = {
  id: string
  productId: string
  product?: { id: string; name: string; category: string }
  quantity: number
  snCodes?: string[]
  unitPrice?: number
  remark?: string
}

export type WarehouseOrder = {
  id: string
  orderNo: string
  orderType: WarehouseOrderType
  status?: 'POSTED' | 'VOIDED'
  projectId?: string
  project?: { id: string; name: string }
  relatedOrderId?: string
  relatedOrderIds?: string[]
  applicationId?: string
  reversalOrderId?: string
  voidReason?: string
  voidedAt?: string
  occurredAt: string
  paymentType?: PaymentType
  expressNo?: string
  images?: string[]
  remark?: string
  operatorId?: string
  operator?: { id: string; name: string }
  items: WarehouseOrderItem[]
  createdAt: string
  updatedAt: string
}

export type InventoryCheckItem = {
  id: string
  productId: string
  product?: { id: string; name: string; category: string }
  systemQty: number
  countedQty: number
  diffQty: number
  remark?: string
}

export type InventoryCheck = {
  id: string
  status: 'DRAFT' | 'APPROVED'
  remark?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approverId?: string
  items: InventoryCheckItem[]
}

export type Inventory = {
  id: string
  productId: string
  product: {
    id: string
    name: string
    category: string
    costPrice?: number
    standardPrice: number
    suggestedStockQty?: number
  }
  quantity: number
  lastUpdatedAt: string
}

export type InventoryCost = {
  totalCost: number
  details: Array<{
    productId: string
    productName: string
    quantity: number
    costPrice: number
    totalCost: number
  }>
}

export type WarehouseOrderLog = {
  id: string
  orderId: string
  orderNo: string
  orderType: WarehouseOrderType
  operatorId: string
  operatorName?: string
  operatorPhone?: string
  action: string
  changes: unknown
  createdAt: string
}

export type CreateOutboundApplicationInput = {
  type: OutboundApplicationType
  projectId?: string
  remark?: string
  items: Array<{
    productId: string
    quantity: number
    snCodes?: string[]
    remark?: string
  }>
}

export type ApproveOutboundApplicationInput = {
  orderType: WarehouseOrderType
  paymentType?: PaymentType
  remark?: string
  items?: Array<{
    productId: string
    quantity: number
    snCodes?: string[]
    remark?: string
  }>
}

export type CreateWarehouseOrderInput = {
  orderType: WarehouseOrderType
  projectId?: string
  relatedOrderId?: string
  relatedOrderIds?: string[]
  occurredAt?: string
  paymentType?: PaymentType
  expressNo?: string
  images?: string[]
  remark?: string
  items?: Array<{
    productId: string
    quantity: number
    snCodes?: string[]
    unitPrice?: number
    remark?: string
  }>
}

export async function createOutboundApplication(data: CreateOutboundApplicationInput) {
  const res = await http.post<OutboundApplication>('/warehouse/outbound-applications', data)
  return res.data
}

export async function listOutboundApplications(params?: {
  type?: OutboundApplicationType
  status?: OutboundApplicationStatus
  projectId?: string
  applicantId?: string
  startDate?: string
  endDate?: string
}) {
  const res = await http.get<OutboundApplication[]>('/warehouse/outbound-applications', { params })
  return res.data
}

export async function getOutboundApplication(id: string) {
  const res = await http.get<OutboundApplication>(`/warehouse/outbound-applications/${id}`)
  return res.data
}

export async function updateOutboundApplication(id: string, data: Partial<CreateOutboundApplicationInput>) {
  const res = await http.put<OutboundApplication>(`/warehouse/outbound-applications/${id}`, data)
  return res.data
}

export async function deleteOutboundApplication(id: string) {
  const res = await http.delete<{ success: boolean }>(`/warehouse/outbound-applications/${id}`)
  return res.data
}

export async function submitOutboundApplication(id: string) {
  const res = await http.post<OutboundApplication>(`/warehouse/outbound-applications/${id}/submit`)
  return res.data
}

export async function approveOutboundApplication(id: string, reviewerId: string, data: ApproveOutboundApplicationInput) {
  const res = await http.post<OutboundApplication>(`/warehouse/outbound-applications/${id}/approve`, { reviewerId, ...data })
  return res.data
}

export async function rejectOutboundApplication(id: string, reviewerId: string, reason: string) {
  const res = await http.post<OutboundApplication>(`/warehouse/outbound-applications/${id}/reject`, { reviewerId, reason })
  return res.data
}

export async function createWarehouseOrder(operatorId: string, data: CreateWarehouseOrderInput) {
  const res = await http.post<WarehouseOrder>('/warehouse/orders', { operatorId, ...data })
  return res.data
}

export async function listWarehouseOrders(params?: {
  orderType?: WarehouseOrderType
  projectId?: string
  productName?: string
  snCode?: string
  remark?: string
  startDate?: string
  endDate?: string
}) {
  const res = await http.get<WarehouseOrder[]>('/warehouse/orders', { params })
  return res.data
}

export async function getWarehouseOrder(id: string) {
  const res = await http.get<WarehouseOrder>(`/warehouse/orders/${id}`)
  return res.data
}

export async function updateWarehouseOrder(id: string, operatorId: string, data: Partial<CreateWarehouseOrderInput>) {
  const res = await http.put<WarehouseOrder>(`/warehouse/orders/${id}`, { operatorId, ...data })
  return res.data
}

export async function deleteWarehouseOrder(id: string, operatorId: string) {
  const res = await http.delete<{ success: boolean }>(`/warehouse/orders/${id}`, { data: { operatorId } })
  return res.data
}

export async function voidWarehouseOrder(id: string, operatorId: string, reason: string) {
  const res = await http.post<WarehouseOrder>(`/warehouse/orders/${id}/void`, { operatorId, reason })
  return res.data
}

export async function listInventory() {
  const res = await http.get<Inventory[]>('/warehouse/inventory')
  return res.data
}

export async function getInventoryCost() {
  const res = await http.get<InventoryCost>('/warehouse/inventory/cost')
  return res.data
}

export async function adjustInventory(productId: string, quantity: number, remark?: string) {
  const res = await http.post<Inventory>('/warehouse/inventory/adjust', { productId, quantity, remark })
  return res.data
}

export async function createInventoryCheck(data: {
  remark?: string
  items: Array<{ productId: string; systemQty: number; countedQty: number; remark?: string }>
}) {
  const res = await http.post<InventoryCheck>('/warehouse/inventory-checks', data)
  return res.data
}

export async function listInventoryChecks() {
  const res = await http.get<InventoryCheck[]>('/warehouse/inventory-checks')
  return res.data
}

export async function getInventoryCheck(id: string) {
  const res = await http.get<InventoryCheck>(`/warehouse/inventory-checks/${id}`)
  return res.data
}

export async function approveInventoryCheck(id: string, approverId: string, remark?: string) {
  const res = await http.post<{ success: boolean; orders: WarehouseOrder[] }>(
    `/warehouse/inventory-checks/${id}/approve`,
    { approverId, remark },
  )
  return res.data
}

export async function traceSn(sn: string) {
  const res = await http.get<{ sn: string; applications: OutboundApplication[]; orders: WarehouseOrder[] }>(
    '/warehouse/sn-trace',
    { params: { sn } },
  )
  return res.data
}

export async function listWarehouseOrderLogs(params?: {
  orderNo?: string
  orderType?: WarehouseOrderType
  action?: string
  startDate?: string
  endDate?: string
}) {
  const res = await http.get<
    Array<{
      id: string
      orderId: string
      action: string
      changes: unknown
      createdAt: string
      order: {
        orderNo: string
        orderType: WarehouseOrderType
      }
      operator: {
        id: string
        name: string
        phone: string
      } | null
    }>
  >('/warehouse/logs', { params })

  return res.data.map<WarehouseOrderLog>((log) => ({
    id: log.id,
    orderId: log.orderId,
    orderNo: log.order.orderNo,
    orderType: log.order.orderType,
    operatorId: log.operator?.id ?? '',
    operatorName: log.operator?.name ?? undefined,
    operatorPhone: log.operator?.phone ?? undefined,
    action: log.action,
    changes: log.changes,
    createdAt: log.createdAt,
  }))
}

export const WAREHOUSE_ORDER_TYPE_LABELS: Record<WarehouseOrderType, string> = {
  OUTBOUND_SALES: '销售出库单',
  OUTBOUND_LOAN: '借货出库单',
  OUTBOUND_AFTER_SALES: '售后出库单',
  OUTBOUND_LOST: '丢失出库单',
  INBOUND_SALES: '销售入库单',
  INBOUND_PURCHASE: '采购入库单',
  INBOUND_AFTER_SALES: '售后入库单',
  INBOUND_UNKNOWN: '未知入库单',
}

export const OUTBOUND_APPLICATION_TYPE_LABELS: Record<OutboundApplicationType, string> = {
  SALES_PRE: '销售预出库申请',
  TECH_PRE: '技术预出库申请',
}

export const OUTBOUND_APPLICATION_STATUS_LABELS: Record<OutboundApplicationStatus, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  CONVERTED: '已转出库单',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  PAID: '已支付',
  UNPAID: '未支付',
  NEED_RETURN: '需还货',
  RETURN_LATER: '届时寄/送回',
  ON_ACCOUNT: '挂帐',
  GIFT: '赠送',
  DESTROYED: '销毁',
}
