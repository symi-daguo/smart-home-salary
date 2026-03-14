import { PlusOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import {
  listOutboundApplications,
  createOutboundApplication,
  updateOutboundApplication,
  deleteOutboundApplication,
  submitOutboundApplication,
  approveOutboundApplication,
  rejectOutboundApplication,
  type OutboundApplication,
  OutboundApplicationType,
  OutboundApplicationStatus,
  WarehouseOrderType,
  OUTBOUND_APPLICATION_TYPE_LABELS,
  OUTBOUND_APPLICATION_STATUS_LABELS,
  WAREHOUSE_ORDER_TYPE_LABELS,
  PAYMENT_TYPE_LABELS,
} from '../api/warehouse'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import type { Project } from '../api/projects'
import { listProjects } from '../api/projects'
import type { Employee } from '../api/employees'
import { listEmployees } from '../api/employees'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

type ItemRow = {
  id: string
  productId: string
  quantity: number
  snCodes: string[]
  remark?: string
}

function statusTag(status: OutboundApplicationStatus) {
  const label = OUTBOUND_APPLICATION_STATUS_LABELS[status] ?? status
  const colorMap: Record<OutboundApplicationStatus, string> = {
    DRAFT: 'default',
    PENDING_REVIEW: 'processing',
    APPROVED: 'success',
    REJECTED: 'error',
    CONVERTED: 'cyan',
  }
  return <Tag color={colorMap[status]}>{label}</Tag>
}

export function OutboundApplicationsPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<OutboundApplication[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState<'all' | OutboundApplicationType>('all')
  const [editing, setEditing] = useState<OutboundApplication | null>(null)
  const [items, setItems] = useState<ItemRow[]>([])
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveForm] = Form.useForm()
  const [approvingApp, setApprovingApp] = useState<OutboundApplication | null>(null)

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.name}（${p.category}）` })),
    [products],
  )

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  )

  const load = async () => {
    setLoading(true)
    try {
      const [appList, prodList, projList, empList] = await Promise.all([
        listOutboundApplications(),
        listProducts(),
        listProjects(),
        listEmployees(),
      ])
      setRows(appList)
      setProducts(prodList)
      setProjects(projList)
      setEmployees(empList)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredRows = useMemo(() => {
    if (activeTab === 'all') return rows
    return rows.filter((r) => r.type === activeTab)
  }, [rows, activeTab])

  const columns: ColumnsType<OutboundApplication> = [
    {
      title: '申请单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v: OutboundApplicationType) => OUTBOUND_APPLICATION_TYPE_LABELS[v] ?? v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: OutboundApplicationStatus) => statusTag(v),
    },
    {
      title: '关联项目',
      dataIndex: ['project', 'name'],
      key: 'project',
      width: 180,
      render: (v) => v || '-',
    },
    {
      title: '申请人',
      dataIndex: ['applicant', 'name'],
      key: 'applicant',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          {r.status === OutboundApplicationStatus.DRAFT && (
            <>
              <Button
                size="small"
                onClick={() => {
                  setEditing(r)
                  form.setFieldsValue({
                    type: r.type,
                    projectId: r.projectId,
                    remark: r.remark,
                  })
                  setItems(
                    r.items.map((it) => ({
                      id: it.id,
                      productId: it.productId,
                      quantity: it.quantity,
                      snCodes: it.snCodes || [],
                      remark: it.remark,
                    })),
                  )
                  setOpen(true)
                }}
              >
                编辑
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={async () => {
                  try {
                    await submitOutboundApplication(r.id)
                    message.success('已提交审核')
                    await load()
                  } catch (e: any) {
                    message.error(e?.response?.data?.message ?? '提交失败')
                  }
                }}
              >
                提交
              </Button>
              <Button
                size="small"
                danger
                onClick={async () => {
                  Modal.confirm({
                    title: '确认删除',
                    content: `确定要删除申请单「${r.orderNo}」吗？`,
                    okText: '删除',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    onOk: async () => {
                      await deleteOutboundApplication(r.id)
                      message.success('删除成功')
                      await load()
                    },
                  })
                }}
              >
                删除
              </Button>
            </>
          )}
          {r.status === OutboundApplicationStatus.PENDING_REVIEW && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  setApprovingApp(r)
                  approveForm.resetFields()
                  setApproveOpen(true)
                }}
              >
                审核
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={async () => {
                  Modal.confirm({
                    title: '确认拒绝',
                    content: `确定要拒绝申请单「${r.orderNo}」吗？`,
                    okText: '拒绝',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    onOk: async () => {
                      const reviewerId = employees.find((e) => e.name)?.id
                      if (!reviewerId) {
                        message.error('找不到审核人')
                        return
                      }
                      await rejectOutboundApplication(r.id, reviewerId, '审核拒绝')
                      message.success('已拒绝')
                      await load()
                    },
                  })
                }}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const addItem = () => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setItems((prev) => [...prev, { id, productId: '', quantity: 1, snCodes: [], remark: '' }])
  }

  const updateItem = (id: string, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const handleOpenModal = (type: OutboundApplicationType) => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type })
    setItems([{ id: `${Date.now()}`, productId: '', quantity: 1, snCodes: [], remark: '' }])
    setOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const validItems = items.filter((x) => x.productId && x.quantity > 0)
    if (!validItems.length) {
      message.error('请至少添加一个产品')
      return
    }

    setSaving(true)
    try {
      const payload = {
        type: values.type,
        projectId: values.projectId,
        remark: values.remark,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          snCodes: it.snCodes,
          remark: it.remark,
        })),
      }

      if (editing) {
        await updateOutboundApplication(editing.id, payload)
        message.success('更新成功')
      } else {
        const applicantId = employees[0]?.id
        if (!applicantId) {
          message.error('找不到申请人')
          return
        }
        await createOutboundApplication({ applicantId, ...payload } as any)
        message.success('创建成功')
      }
      setOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!approvingApp) return
    const values = await approveForm.validateFields()
    const reviewerId = employees.find((e) => e.name)?.id
    if (!reviewerId) {
      message.error('找不到审核人')
      return
    }

    setSaving(true)
    try {
      await approveOutboundApplication(approvingApp.id, reviewerId, {
        orderType: values.orderType,
        paymentType: values.paymentType,
        remark: values.remark,
      })
      message.success('审核通过，已生成出库单')
      setApproveOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '审核失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <PageHeader
        title="出库申请单"
        subtitle="管理销售预出库申请、技术预出库申请及审核流程"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(OutboundApplicationType.SALES_PRE)}>
              销售预出库申请
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(OutboundApplicationType.TECH_PRE)}>
              技术预出库申请
            </Button>
          </Space>
        }
      />

      <div style={{ height: 16 }} />

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as any)}
        items={[
          { key: 'all', label: '全部' },
          { key: OutboundApplicationType.SALES_PRE, label: '销售预出库申请' },
          { key: OutboundApplicationType.TECH_PRE, label: '技术预出库申请' },
        ]}
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredRows}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? '编辑出库申请单' : '新增出库申请单'}
        open={open}
        onCancel={() => setOpen(false)}
        width={MODAL_WIDTH.xlarge}
        confirmLoading={saving}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="申请类型" name="type">
                <Select disabled options={Object.entries(OUTBOUND_APPLICATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="关联项目" name="projectId">
                <Select
                  showSearch
                  placeholder={`${PLACEHOLDER.select}项目`}
                  options={projectOptions}
                  optionFilterProp="label"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="备注" name="remark">
                <Input placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ height: 8 }} />
          <Row justify="space-between" align="middle">
            <Col>
              <strong>产品明细</strong>
            </Col>
            <Col>
              <Button icon={<PlusOutlined />} onClick={addItem}>
                添加产品
              </Button>
            </Col>
          </Row>
          <div style={{ height: 8 }} />
          <Table
            rowKey="id"
            dataSource={items}
            pagination={false}
            size="small"
            scroll={{ y: 200 }}
            columns={[
              {
                title: '产品',
                dataIndex: 'productId',
                render: (v, r: ItemRow) => (
                  <Select
                    value={v || undefined}
                    style={{ width: '100%' }}
                    placeholder={`${PLACEHOLDER.select}产品`}
                    options={productOptions}
                    showSearch
                    optionFilterProp="label"
                    onChange={(val) => updateItem(r.id, { productId: val })}
                  />
                ),
              },
              {
                title: '数量',
                dataIndex: 'quantity',
                width: 100,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={1}
                    precision={0}
                    onChange={(val) => updateItem(r.id, { quantity: Number(val ?? 1) })}
                  />
                ),
              },
              {
                title: 'SN码（逗号分隔）',
                dataIndex: 'snCodes',
                width: 200,
                render: (v: string[], r: ItemRow) => (
                  <Input
                    value={v.join(',')}
                    placeholder="SN001,SN002"
                    onChange={(e) => updateItem(r.id, { snCodes: e.target.value.split(',').filter(Boolean) })}
                  />
                ),
              },
              {
                title: '操作',
                key: 'op',
                width: 80,
                render: (_, r: ItemRow) => (
                  <Button size="small" danger onClick={() => removeItem(r.id)}>
                    删除
                  </Button>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Modal
        title="审核出库申请单"
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        width={MODAL_WIDTH.medium}
        confirmLoading={saving}
        onOk={handleApprove}
        destroyOnClose
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item label="出库类型" name="orderType" rules={[formRules.select('请选择出库类型')]}>
            <Select
              options={[
                { value: WarehouseOrderType.OUTBOUND_SALES, label: WAREHOUSE_ORDER_TYPE_LABELS[WarehouseOrderType.OUTBOUND_SALES] },
                { value: WarehouseOrderType.OUTBOUND_LOAN, label: WAREHOUSE_ORDER_TYPE_LABELS[WarehouseOrderType.OUTBOUND_LOAN] },
                { value: WarehouseOrderType.OUTBOUND_AFTER_SALES, label: WAREHOUSE_ORDER_TYPE_LABELS[WarehouseOrderType.OUTBOUND_AFTER_SALES] },
              ]}
            />
          </Form.Item>
          <Form.Item label="付款类型" name="paymentType">
            <Select
              allowClear
              options={Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
