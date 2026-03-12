import { DeleteOutlined, PlusOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { CreateInstallationRecordInput, InstallationRecord, ServiceType } from '../api/installationRecords'
import { createInstallationRecord, deleteInstallationRecord, listInstallationRecords, updateInstallationRecord } from '../api/installationRecords'
import type { Employee } from '../api/employees'
import { listEmployees } from '../api/employees'
import type { Project } from '../api/projects'
import { listProjects } from '../api/projects'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'

type FormValues = {
  projectId: string
  employeeId: string
  productId: string
  serviceType: ServiceType
  quantity: number
  difficultyFactor?: number
  occurredAt?: any
  description?: string
}

function serviceLabel(s: ServiceType) {
  if (s === 'DEBUG') return <Tag color="purple">调试</Tag>
  if (s === 'AFTER_SALES') return <Tag color="orange">售后</Tag>
  return <Tag color="blue">安装</Tag>
}

export function InstallationRecordsPage() {
  const [rows, setRows] = useState<InstallationRecord[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const [editing, setEditing] = useState<InstallationRecord | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [ir, ps, es, pr] = await Promise.all([
        listInstallationRecords(),
        listProjects(),
        listEmployees(),
        listProducts(),
      ])
      setRows(ir)
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

  const columns: ColumnsType<InstallationRecord> = useMemo(
    () => [
      {
        title: '发生时间',
        dataIndex: 'occurredAt',
        render: (v) => dayjs(v).format('YYYY-MM-DD'),
      },
      { title: '项目', key: 'project', render: (_, r) => r.project?.name ?? r.projectId },
      { title: '员工', key: 'employee', render: (_, r) => r.employee?.name ?? r.employeeId },
      { title: '商品', key: 'product', render: (_, r) => r.product?.name ?? r.productId },
      { title: '类型', dataIndex: 'serviceType', render: (v) => serviceLabel(v) },
      { title: '数量', dataIndex: 'quantity' },
      { title: '难度系数', dataIndex: 'difficultyFactor' },
      {
        title: '操作',
        key: 'actions',
        render: (_, r) => (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r)
                form.setFieldsValue({
                  projectId: r.projectId,
                  employeeId: r.employeeId,
                  productId: r.productId,
                  serviceType: r.serviceType,
                  quantity: r.quantity,
                  difficultyFactor:
                    r.difficultyFactor === null || r.difficultyFactor === undefined
                      ? undefined
                      : Number(r.difficultyFactor),
                  occurredAt: r.occurredAt ? dayjs(r.occurredAt) : undefined,
                  description: r.description ?? undefined,
                })
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
                  title: '确认删除该记录？',
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteInstallationRecord(r.id)
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
    [],
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

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            技术上报（后台代录）
          </Typography.Title>
          <Typography.Text type="secondary">用于技术费计算与数量比对。</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              form.resetFields()
              form.setFieldsValue({ serviceType: 'INSTALL', difficultyFactor: 1.0 })
              setOpen(true)
            }}
          >
            新增记录
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
        title={editing ? '编辑技术记录' : '新增技术记录'}
        open={open}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields()
          const payload: CreateInstallationRecordInput = {
            projectId: v.projectId,
            employeeId: v.employeeId,
            productId: v.productId,
            serviceType: v.serviceType,
            quantity: v.quantity,
            difficultyFactor: v.difficultyFactor ?? 1.0,
            occurredAt: v.occurredAt ? dayjs(v.occurredAt).toISOString() : undefined,
            description: v.description?.trim() || undefined,
          }
          if (editing) {
            await updateInstallationRecord(editing.id, payload)
            message.success('已更新')
          } else {
            await createInstallationRecord(payload)
            message.success('已创建')
          }
          setOpen(false)
          await refresh()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="项目" name="projectId" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              style={{ width: '100%' }}
              options={projectOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="员工" name="employeeId" rules={[{ required: true, message: '请选择员工' }]}>
            <Select
              style={{ width: '100%' }}
              options={employeeOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="商品" name="productId" rules={[{ required: true, message: '请选择商品' }]}>
            <Select style={{ width: '100%' }} options={productOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="类型" name="serviceType" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={[
                  { value: 'INSTALL', label: '安装' },
                  { value: 'DEBUG', label: '调试' },
                  { value: 'AFTER_SALES', label: '售后' },
                ]}
              />
            </Form.Item>
            <Form.Item label="数量" name="quantity" rules={[{ required: true, message: '请输入数量' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>
            <Form.Item label="难度系数" name="difficultyFactor" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="发生时间（可选）" name="occurredAt" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="说明（可选）" name="description" style={{ flex: 2 }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}

