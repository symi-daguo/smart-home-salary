import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { CreateProjectInput, Project, ProjectItemInput, ProjectStatus } from '../api/projects'
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../api/projects'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import { exportExcel, exportJson, importExcel, importJson } from '../api/excel'
import { downloadBlob } from '../utils/download'

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
      { title: '项目名称', dataIndex: 'name' },
      { title: '客户', dataIndex: 'customerName' },
      { title: '电话', dataIndex: 'customerPhone' },
      { title: '合同金额', dataIndex: 'contractAmount' },
      { title: '签订日期', dataIndex: 'signDate', render: (v) => dayjs(v).format('YYYY-MM-DD') },
      { title: '状态', dataIndex: 'status', render: (v) => statusLabel(v) },
      {
        title: '操作',
        key: 'actions',
        render: (_, r) => (
          <Space>
            <Button
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
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除该项目？',
                  content: '将同时删除该项目的标准产品清单。',
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteProject(r.id)
                    message.success('已删除')
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

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            项目管理
          </Typography.Title>
          <Typography.Text type="secondary">支持维护项目基本信息与标准产品清单。</Typography.Text>
        </div>
        <Space wrap>
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
                    downloadBlob('projects.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
                  },
                },
                {
                  key: 'json',
                  label: '导出 JSON',
                  onClick: async () => {
                    const rows = await exportJson<any[]>('/excel/projects/export-json')
                    downloadBlob('projects.json', new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }))
                  },
                },
                {
                  key: 'tpl',
                  label: '下载 Excel 模板',
                  onClick: async () => {
                    const buf = await exportExcel('/excel/projects/template')
                    downloadBlob('projects.template.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
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
              const resp = await importJson<{ upserted: number }>('/excel/projects/import-json', rows)
              message.success(`导入完成：upserted=${resp.upserted}`)
              await refresh()
              return false
            }}
          >
            <Button>导入 JSON</Button>
          </Upload>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              form.resetFields()
              form.setFieldsValue({ status: 'IN_PROGRESS' })
              setItems([])
              setOpen(true)
            }}
          >
            新增项目
          </Button>
        </Space>
      </Space>

      <div style={{ height: 12 }} />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? '编辑项目' : '新增项目'}
        open={open}
        okText="保存"
        cancelText="取消"
        width={900}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={async () => {
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
            message.success('已更新')
          } else {
            await createProject(payload)
            message.success('已创建')
          }
          setOpen(false)
          await refresh()
        }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]} style={{ flex: 2 }}>
              <Input />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                style={{ width: '100%' }}
                options={[
                  { value: 'IN_PROGRESS', label: '进行中' },
                  { value: 'DONE', label: '已完成' },
                  { value: 'ARCHIVED', label: '已归档' },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item label="项目地址" name="address" rules={[{ required: true, message: '请输入项目地址' }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="客户姓名" name="customerName" rules={[{ required: true, message: '请输入客户姓名' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item
              label="客户电话"
              name="customerPhone"
              rules={[
                { required: true, message: '请输入客户电话' },
                { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
              ]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="合同金额" name="contractAmount" rules={[{ required: true, message: '请输入合同金额' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="签订日期" name="signDate" rules={[{ required: true, message: '请选择签订日期' }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <div style={{ height: 8 }} />
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong>标准产品清单</Typography.Text>
            <Button onClick={addItem}>添加一行</Button>
          </Space>
          <div style={{ height: 8 }} />
          <Table
            rowKey="id"
            dataSource={items}
            pagination={false}
            size="small"
            columns={[
              {
                title: '商品',
                dataIndex: 'productId',
                render: (v, r: ItemRow) => (
                  <Select
                    value={v || undefined}
                    style={{ width: '100%' }}
                    placeholder="选择商品"
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
                width: 160,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={0}
                    precision={0}
                    onChange={(val) => updateItem(r.id, { standardQuantity: Number(val ?? 0) })}
                  />
                ),
              },
              {
                title: '标准单价（可选）',
                dataIndex: 'standardPrice',
                width: 200,
                render: (v, r: ItemRow) => (
                  <InputNumber
                    value={v}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    onChange={(val) => updateItem(r.id, { standardPrice: val === null ? undefined : Number(val) })}
                  />
                ),
              },
              {
                title: '操作',
                key: 'op',
                width: 90,
                render: (_, r: ItemRow) => (
                  <Button danger size="small" onClick={() => removeItem(r.id)}>
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

