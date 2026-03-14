import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import {
  listWarehouseOrders,
  createWarehouseOrder,
  updateWarehouseOrder,
  deleteWarehouseOrder,
  type WarehouseOrder,
  WarehouseOrderType,
  type PaymentType,
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
  unitPrice?: number
  remark?: string
}

const OUTBOUND_TYPES: WarehouseOrderType[] = [
  WarehouseOrderType.OUTBOUND_SALES,
  WarehouseOrderType.OUTBOUND_LOAN,
  WarehouseOrderType.OUTBOUND_AFTER_SALES,
  WarehouseOrderType.OUTBOUND_LOST,
]

const INBOUND_TYPES: WarehouseOrderType[] = [
  WarehouseOrderType.INBOUND_SALES,
  WarehouseOrderType.INBOUND_PURCHASE,
  WarehouseOrderType.INBOUND_AFTER_SALES,
  WarehouseOrderType.INBOUND_UNKNOWN,
]

export function WarehouseOrdersPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<WarehouseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState<'all' | 'outbound' | 'inbound'>('all')
  const [editing, setEditing] = useState<WarehouseOrder | null>(null)
  const [items, setItems] = useState<ItemRow[]>([])

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
      const [orderList, prodList, projList, empList] = await Promise.all([
        listWarehouseOrders(),
        listProducts(),
        listProjects(),
        listEmployees(),
      ])
      setRows(orderList)
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
    if (activeTab === 'outbound') return rows.filter((r) => OUTBOUND_TYPES.includes(r.orderType))
    return rows.filter((r) => INBOUND_TYPES.includes(r.orderType))
  }, [rows, activeTab])

  const columns: ColumnsType<WarehouseOrder> = [
    {
      title: '单据编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
    },
    {
      title: '单据类型',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 120,
      render: (v: WarehouseOrderType) => {
        const label = WAREHOUSE_ORDER_TYPE_LABELS[v] ?? v
        const isInbound = INBOUND_TYPES.includes(v)
        return <Tag color={isInbound ? 'green' : 'blue'}>{label}</Tag>
      },
    },
    {
      title: '关联项目',
      dataIndex: ['project', 'name'],
      key: 'project',
      width: 180,
      render: (v) => v || '-',
    },
    {
      title: '付款类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (v?: PaymentType) => (v ? PAYMENT_TYPE_LABELS[v] : '-'),
    },
    {
      title: '快递单号',
      dataIndex: 'expressNo',
      key: 'expressNo',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(r)
              form.setFieldsValue({
                orderType: r.orderType,
                projectId: r.projectId,
                relatedOrderId: r.relatedOrderId,
                occurredAt: r.occurredAt ? dayjs(r.occurredAt) : undefined,
                paymentType: r.paymentType,
                expressNo: r.expressNo,
                remark: r.remark,
              })
              setItems(
                r.items.map((it) => ({
                  id: it.id,
                  productId: it.productId,
                  quantity: it.quantity,
                  snCodes: it.snCodes || [],
                  unitPrice: it.unitPrice ? Number(it.unitPrice) : undefined,
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
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除单据「${r.orderNo}」吗？`,
                okText: '删除',
                okButtonProps: { danger: true },
                cancelText: '取消',
                onOk: async () => {
                  const operatorId = employees[0]?.id
                  if (!operatorId) {
                    message.error('找不到操作人')
                    return
                  }
                  await deleteWarehouseOrder(r.id, operatorId)
                  message.success('删除成功')
                  await load()
                },
              })
            }}
          >
            删除
          </Button>
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

  const handleOpenModal = (orderType: WarehouseOrderType) => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ orderType, occurredAt: dayjs() })
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
      const operatorId = employees[0]?.id
      if (!operatorId) {
        message.error('找不到操作人')
        return
      }

      const payload = {
        orderType: values.orderType,
        projectId: values.projectId,
        relatedOrderId: values.relatedOrderId,
        occurredAt: values.occurredAt?.toISOString(),
        paymentType: values.paymentType,
        expressNo: values.expressNo,
        remark: values.remark,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          snCodes: it.snCodes,
          unitPrice: it.unitPrice,
          remark: it.remark,
        })),
      }

      if (editing) {
        await updateWarehouseOrder(editing.id, operatorId, payload)
        message.success('更新成功')
      } else {
        await createWarehouseOrder(operatorId, payload)
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

  return (
    <Card>
      <PageHeader
        title="出入库单"
        subtitle="管理各类出入库单据，支持产品、SN码、快递单号等信息录入"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(WarehouseOrderType.OUTBOUND_SALES)}>
              销售出库
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => handleOpenModal(WarehouseOrderType.INBOUND_PURCHASE)}>
              采购入库
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
          { key: 'outbound', label: '出库单' },
          { key: 'inbound', label: '入库单' },
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
        title={editing ? '编辑出入库单' : '新增出入库单'}
        open={open}
        onCancel={() => setOpen(false)}
        width={MODAL_WIDTH.xlarge}
        confirmLoading={saving}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="单据类型" name="orderType">
                <Select
                  disabled
                  options={Object.entries(WAREHOUSE_ORDER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
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
            <Col span={6}>
              <Form.Item label="付款类型" name="paymentType">
                <Select
                  allowClear
                  options={Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="发生时间" name="occurredAt" rules={[formRules.date('请选择发生时间')]}>
                <DatePicker showTime style={{ width: '100%' }} placeholder={PLACEHOLDER.date} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="快递单号" name="expressNo">
                <Input placeholder="请输入快递单号" maxLength={INPUT_MAX_LENGTH.code} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
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
                title: '单价',
                dataIndex: 'unitPrice',
                width: 100,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="可选"
                    onChange={(val) => updateItem(r.id, { unitPrice: val ?? undefined })}
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
    </Card>
  )
}
