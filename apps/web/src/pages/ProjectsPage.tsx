import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined, BarChartOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Dropdown, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { CreateProjectInput, Project, ProjectItemInput, ProjectStatus, ProjectStats } from '../api/projects'
import { createProject, deleteProject, getProject, listProjects, updateProject, getProjectStats } from '../api/projects'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import { exportExcel, exportJson, importExcel, importJson } from '../api/excel'
import { downloadBlob } from '../utils/download'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

type FormValues = {
  name: string
  address: string
  customerName: string
  customerPhone: string
  contractAmount: number
  signDate: any
  status: ProjectStatus
}

type ItemRow = {
  id: string
  productId: string
  standardQuantity: number
  standardPrice?: number
}

function statusLabel(s: ProjectStatus) {
  if (s === 'DONE') return <Tag color="green">已完成</Tag>
  if (s === 'ARCHIVED') return <Tag>已归档</Tag>
  return <Tag color="blue">进行中</Tag>
}

export function ProjectsPage() {
  const [rows, setRows] = useState<Project[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form] = Form.useForm<FormValues>()

  const [items, setItems] = useState<ItemRow[]>([])

  // 项目统计相关状态
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsData, setStatsData] = useState<ProjectStats | null>(null)
  const [statsProjectName, setStatsProjectName] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const [proj, prod] = await Promise.all([listProjects(), listProducts()])
      setRows(proj)
      setProducts(prod)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
  }, [])

  function resetItemsFromProject(p?: Project | null) {
    if (!p?.items?.length) {
      setItems([])
      return
    }
    setItems(
      p.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        standardQuantity: it.standardQuantity,
        standardPrice: Number(it.standardPrice),
      })),
    )
  }

  const columns: ColumnsType<Project> = useMemo(
    () => [
      { title: '项目名称', dataIndex: 'name', width: 180 },
      { title: '客户', dataIndex: 'customerName', width: 120 },
      { title: '电话', dataIndex: 'customerPhone', width: 120 },
      { title: '合同金额', dataIndex: 'contractAmount', width: 100 },
      { title: '签订日期', dataIndex: 'signDate', width: 110, render: (v) => dayjs(v).format('YYYY-MM-DD') },
      { title: '状态', dataIndex: 'status', width: 90, render: (v) => statusLabel(v) },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        fixed: 'right',
        render: (_, r) => (
          <Space>
            <Button
              size="small"
              icon={<BarChartOutlined />}
              onClick={async () => {
                setStatsOpen(true)
                setStatsLoading(true)
                setStatsProjectName(r.name)
                try {
                  const stats = await getProjectStats(r.id)
                  setStatsData(stats)
                } catch (e: any) {
                  message.error(e?.message ?? '获取统计失败')
                } finally {
                  setStatsLoading(false)
                }
              }}
            >
              统计
            </Button>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={async () => {
                const full = await getProject(r.id)
                setEditing(full)
                form.setFieldsValue({
                  name: full.name,
                  address: full.address,
                  customerName: full.customerName,
                  customerPhone: full.customerPhone,
                  contractAmount: Number(full.contractAmount),
                  signDate: dayjs(full.signDate),
                  status: full.status,
                })
                resetItemsFromProject(full)
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
                  content: `确定要删除项目「${r.name}」吗？将同时删除该项目的标准产品清单。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteProject(r.id)
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

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.name}（${p.category}）` })),
    [products],
  )

  function addItem() {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setItems((prev) => [...prev, { id, productId: '', standardQuantity: 0, standardPrice: undefined }])
  }

  function updateItem(id: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  function buildItemsPayload(): ProjectItemInput[] | undefined {
    const cleaned = items
      .filter((x) => x.productId)
      .map((x) => ({
        productId: x.productId,
        standardQuantity: Number(x.standardQuantity || 0),
        ...(x.standardPrice !== undefined ? { standardPrice: Number(x.standardPrice) } : {}),
      }))
    return cleaned.length ? cleaned : []
  }

  const handleOpenModal = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'IN_PROGRESS' })
    setItems([])
    setOpen(true)
  }

  const handleSubmit = async () => {
    const v = await form.validateFields()
    const payload: CreateProjectInput = {
      name: v.name,
      address: v.address,
      customerName: v.customerName,
      customerPhone: v.customerPhone,
      contractAmount: v.contractAmount,
      signDate: dayjs(v.signDate).format('YYYY-MM-DD'),
      status: v.status,
      items: buildItemsPayload(),
    }
    if (editing) {
      await updateProject(editing.id, payload)
      message.success('更新成功')
    } else {
      await createProject(payload)
      message.success('创建成功')
    }
    setOpen(false)
    await refresh()
  }

  return (
    <Card>
      <PageHeader
        title="项目管理"
        subtitle="支持维护项目基本信息与标准产品清单。"
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
                      const buf = await exportExcel('/excel/projects/export')
                      downloadBlob(
                        'projects.xlsx',
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
                      const rows = await exportJson<any[]>('/excel/projects/export-json')
                      downloadBlob(
                        'projects.json',
                        new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
                      )
                    },
                  },
                  {
                    key: 'tpl',
                    label: '下载 Excel 模板',
                    onClick: async () => {
                      const buf = await exportExcel('/excel/projects/template')
                      downloadBlob(
                        'projects.template.xlsx',
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
                const resp = await importExcel('/excel/projects/import', file as any)
                message.success(`导入完成：upserted=${resp.upserted}`)
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
                const resp = await importJson<{ upserted: number }>(
                  '/excel/projects/import-json',
                  rows,
                )
                message.success(`导入完成：upserted=${resp.upserted}`)
                await refresh()
                return false
              }}
            >
              <Button>导入 JSON</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增项目
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
        title={editing ? '编辑项目' : '新增项目'}
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
            <Col span={16}>
              <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
                <Input placeholder="例如：XX小区智能家居项目" maxLength={INPUT_MAX_LENGTH.title} showCount />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  options={[
                    { value: 'IN_PROGRESS', label: '进行中' },
                    { value: 'DONE', label: '已完成' },
                    { value: 'ARCHIVED', label: '已归档' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="项目地址" name="address" rules={[{ required: true, message: '请输入项目地址' }]}>
            <Input placeholder="例如：XX省XX市XX区XX路XX号" maxLength={INPUT_MAX_LENGTH.description} showCount />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="客户姓名" name="customerName" rules={[{ required: true, message: '请输入客户姓名' }]}>
                <Input placeholder={PLACEHOLDER.name} maxLength={INPUT_MAX_LENGTH.name} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="客户电话" name="customerPhone" rules={formRules.phone}>
                <Input placeholder={PLACEHOLDER.phone} maxLength={INPUT_MAX_LENGTH.phone} showCount />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="合同金额" name="contractAmount" rules={formRules.amount(0, '请输入合同金额')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder={PLACEHOLDER.amount} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="签订日期" name="signDate" rules={[formRules.date('请选择签订日期')]}>
                <DatePicker style={{ width: '100%' }} placeholder={PLACEHOLDER.date} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ height: 8 }} />
          <Row justify="space-between" align="middle">
            <Col>
              <Typography.Text strong>标准产品清单</Typography.Text>
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
                title: '标准数量',
                dataIndex: 'standardQuantity',
                width: 140,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={0}
                    precision={0}
                    placeholder="数量"
                    onChange={(val) => updateItem(r.id, { standardQuantity: Number(val ?? 0) })}
                  />
                ),
              },
              {
                title: '标准单价（可选）',
                dataIndex: 'standardPrice',
                width: 160,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="可选"
                    onChange={(val) => updateItem(r.id, { standardPrice: val === null ? undefined : Number(val) })}
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

      {/* 项目统计弹窗 */}
      <Modal
        title={`项目统计 - ${statsProjectName}`}
        open={statsOpen}
        onCancel={() => setStatsOpen(false)}
        footer={[
          <Button key="close" onClick={() => setStatsOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : statsData ? (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="基础信息">
                  <p>服务费: ¥{statsData.serviceFee.toFixed(2)}</p>
                  <p>签单折扣率: {(statsData.signDiscountRate * 100).toFixed(1)}%</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="金额汇总">
                  <p>销售上报金额: ¥{statsData.salesAmount.toFixed(2)}</p>
                  <p>出库产品金额: ¥{statsData.outboundAmount.toFixed(2)}</p>
                </Card>
              </Col>
            </Row>
            <div style={{ height: 16 }} />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="技术费用">
                  <p>安装费: ¥{statsData.installFee.toFixed(2)}</p>
                  <p>调试费: ¥{statsData.debugFee.toFixed(2)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="折扣率">
                  <p>产品折扣率: {(statsData.productDiscountRate * 100).toFixed(2)}%</p>
                  <p>综合折扣率: {(statsData.comprehensiveDiscountRate * 100).toFixed(2)}%</p>
                </Card>
              </Col>
            </Row>
            <div style={{ height: 16 }} />
            <Card size="small" title="应收款计算" style={{ backgroundColor: '#f6ffed' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Text strong>原价应收款: ¥{statsData.originalReceivable.toFixed(2)}</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text strong type="success">折扣后应收款: ¥{statsData.discountedReceivable.toFixed(2)}</Typography.Text>
                </Col>
              </Row>
            </Card>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>暂无统计数据</div>
        )}
      </Modal>
    </Card>
  )
}
