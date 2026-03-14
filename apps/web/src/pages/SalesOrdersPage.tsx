import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Dropdown, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, Typography, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { CreateSalesOrderInput, SalesOrder, SalesOrderItemInput } from '../api/salesOrders'
import { createSalesOrder, deleteSalesOrder, listSalesOrders, updateSalesOrder } from '../api/salesOrders'
import type { Employee } from '../api/employees'
import { listEmployees } from '../api/employees'
import type { Project } from '../api/projects'
import { listProjects } from '../api/projects'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import { exportExcel, exportJson, importExcel, importJson } from '../api/excel'
import { downloadBlob } from '../utils/download'
import { PageHeader } from '../components/PageHeader'
import { MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER, formRules } from '../utils/formRules'

type FormValues = {
  projectId: string
  employeeId: string
  amount: number
  discountRate: number
  verified: boolean
  occurredAt?: any
  remark?: string
}

type ItemRow = { id: string; productId: string; quantity: number }

export function SalesOrdersPage() {
  const [rows, setRows] = useState<SalesOrder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const [items, setItems] = useState<ItemRow[]>([])
  const [editing, setEditing] = useState<SalesOrder | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [so, ps, es, pr] = await Promise.all([
        listSalesOrders(),
        listProjects(),
        listEmployees(),
        listProducts(),
      ])
      setRows(so)
      setProjects(ps)
      setEmployees(es)
      setProducts(pr)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
  }, [])

  const columns: ColumnsType<SalesOrder> = useMemo(
    () => [
      {
        title: '发生时间',
        dataIndex: 'occurredAt',
        width: 110,
        render: (v) => dayjs(v).format('YYYY-MM-DD'),
      },
      { title: '项目', key: 'project', width: 150, render: (_, r) => r.project?.name ?? r.projectId },
      { title: '员工', key: 'employee', width: 100, render: (_, r) => r.employee?.name ?? r.employeeId },
      { title: '金额', dataIndex: 'amount', width: 100 },
      { title: '折扣率', dataIndex: 'discountRate', width: 90 },
      {
        title: '到账核验',
        dataIndex: 'verified',
        width: 100,
        render: (v) => (v ? <Tag color="green">已核验</Tag> : <Tag>未核验</Tag>),
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        fixed: 'right',
        render: (_, r) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r)
                form.setFieldsValue({
                  projectId: r.projectId,
                  employeeId: r.employeeId,
                  amount: Number(r.amount),
                  discountRate: Number(r.discountRate),
                  verified: r.verified,
                  occurredAt: r.occurredAt ? dayjs(r.occurredAt) : undefined,
                  remark: r.remark ?? undefined,
                })
                setItems(
                  (r.items ?? []).map((it) => ({
                    id: it.id,
                    productId: it.productId,
                    quantity: it.quantity,
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
                  content: `确定要删除该销售订单吗？删除后不可恢复。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteSalesOrder(r.id)
                    message.success('删除成功')
                    await refresh()
                  },
                })
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [form],
  )

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  )
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: `${e.name}（${e.phone}）` })),
    [employees],
  )
  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.name}（${p.category}）` })),
    [products],
  )

  function addItem() {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setItems((prev) => [...prev, { id, productId: '', quantity: 1 }])
  }
  function updateItem(id: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }
  function buildItems(): SalesOrderItemInput[] | undefined {
    const cleaned = items
      .filter((x) => x.productId)
      .map((x) => ({ productId: x.productId, quantity: Number(x.quantity || 0) }))
    return cleaned.length ? cleaned : []
  }

  const handleOpenModal = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ discountRate: 0.95, verified: true })
    setItems([])
    setOpen(true)
  }

  const handleSubmit = async () => {
    const v = await form.validateFields()
    const payload: CreateSalesOrderInput = {
      projectId: v.projectId,
      employeeId: v.employeeId,
      amount: v.amount,
      discountRate: v.discountRate,
      verified: v.verified,
      remark: v.remark?.trim() || undefined,
      occurredAt: v.occurredAt ? dayjs(v.occurredAt).toISOString() : undefined,
      items: buildItems(),
    }
    if (editing) {
      await updateSalesOrder(editing.id, payload)
      message.success('更新成功')
    } else {
      await createSalesOrder(payload)
      message.success('创建成功')
    }
    setOpen(false)
    await refresh()
  }

  return (
    <Card>
      <PageHeader
        title="销售上报（后台代录）"
        subtitle="结算口径以到账核验为 true 的订单为准。"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
              刷新
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'xlsx',
                    label: '导出 Excel',
                    onClick: async () => {
                      const buf = await exportExcel('/excel/sales-orders/export')
                      downloadBlob(
                        'sales-orders.xlsx',
                        new Blob([buf], {
                          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        }),
                      )
                    },
                  },
                  {
                    key: 'json',
                    label: '导出 JSON',
                    onClick: async () => {
                      const rows = await exportJson<any[]>('/excel/sales-orders/export-json')
                      downloadBlob(
                        'sales-orders.json',
                        new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
                      )
                    },
                  },
                  {
                    key: 'tpl',
                    label: '下载 Excel 模板',
                    onClick: async () => {
                      const buf = await exportExcel('/excel/sales-orders/template')
                      downloadBlob(
                        'sales-orders.template.xlsx',
                        new Blob([buf], {
                          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        }),
                      )
                    },
                  },
                ],
              }}
            >
              <Button icon={<DownloadOutlined />}>导出/模板</Button>
            </Dropdown>
            <Upload
              accept=".xlsx"
              showUploadList={false}
              beforeUpload={async (file) => {
                const resp = await importExcel('/excel/sales-orders/import', file as any)
                const n = (resp as any).created ?? (resp as any).upserted ?? 0
                message.success(`导入完成：共创建 ${n} 条订单`)
                await refresh()
                return false
              }}
            >
              <Button icon={<UploadOutlined />}>导入 Excel</Button>
            </Upload>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={async (file) => {
                const text = await file.text()
                const rows = JSON.parse(text)
                const resp = await importJson<{ created: number }>(
                  '/excel/sales-orders/import-json',
                  rows,
                )
                message.success(`导入完成：共创建 ${resp.created ?? 0} 条订单`)
                await refresh()
                return false
              }}
            >
              <Button>导入 JSON</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增订单
            </Button>
          </>
        }
      />

      <div style={{ height: 12 }} />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? '编辑销售订单' : '新增销售订单'}
        open={open}
        okText="保存"
        cancelText="取消"
        width={MODAL_WIDTH.xlarge}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="项目" name="projectId" rules={[formRules.select('请选择项目')]}>
                <Select
                  style={{ width: '100%' }}
                  options={projectOptions}
                  showSearch
                  optionFilterProp="label"
                  placeholder={`${PLACEHOLDER.select}项目`}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="员工" name="employeeId" rules={[formRules.select('请选择员工')]}>
                <Select
                  style={{ width: '100%' }}
                  options={employeeOptions}
                  showSearch
                  optionFilterProp="label"
                  placeholder={`${PLACEHOLDER.select}员工`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="实际收款金额" name="amount" rules={formRules.amount(0, '请输入金额')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder={PLACEHOLDER.amount} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="折扣率" name="discountRate" rules={formRules.rate}>
                <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.01} precision={2} placeholder="0.95" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="发生时间（可选）" name="occurredAt">
                <DatePicker style={{ width: '100%' }} placeholder={PLACEHOLDER.date} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="到账核验" name="verified" valuePropName="checked">
                <Switch checkedChildren="已核验" unCheckedChildren="未核验" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注（可选）" name="remark">
            <Input.TextArea rows={3} placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
          </Form.Item>

          <div style={{ height: 8 }} />
          <Row justify="space-between" align="middle">
            <Col>
              <Typography.Text strong>商品明细（可选）</Typography.Text>
            </Col>
            <Col>
              <Button icon={<PlusOutlined />} onClick={addItem}>
                添加商品
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
                title: '商品',
                dataIndex: 'productId',
                render: (v, r: ItemRow) => (
                  <Select
                    value={v || undefined}
                    style={{ width: '100%' }}
                    placeholder={`${PLACEHOLDER.select}商品`}
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
                width: 140,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={0}
                    precision={0}
                    placeholder="数量"
                    onChange={(val) => updateItem(r.id, { quantity: Number(val ?? 0) })}
                  />
                ),
              },
              {
                title: '操作',
                key: 'op',
                width: 80,
                render: (_, r: ItemRow) => (
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(r.id)}>
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
