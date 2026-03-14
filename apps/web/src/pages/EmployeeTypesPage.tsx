import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { CreateEmployeeTypeInput, EmployeeType } from '../api/employeeTypes'
import { createEmployeeType, deleteEmployeeType, listEmployeeTypes, updateEmployeeType } from '../api/employeeTypes'
import { PageHeader } from '../components/PageHeader'
import { MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

type FormValues = {
  key: string
  name: string
  skillTags?: string[]
}

const SKILL_TAG_OPTIONS = [
  { value: 'member', label: 'member - 一线员工' },
  { value: 'admin', label: 'admin - 管理员' },
  { value: 'sales', label: 'sales - 销售' },
  { value: 'technician', label: 'technician - 技术' },
  { value: 'salary', label: 'salary - 工资' },
  { value: 'guide', label: 'guide - 引导' },
]

export function EmployeeTypesPage() {
  const [rows, setRows] = useState<EmployeeType[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeType | null>(null)
  const [form] = Form.useForm<FormValues>()

  async function refresh() {
    setLoading(true)
    try {
      setRows(await listEmployeeTypes())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
  }, [])

  const columns: ColumnsType<EmployeeType> = useMemo(
    () => [
      { title: 'Key', dataIndex: 'key', width: 120 },
      { title: '名称', dataIndex: 'name', width: 150 },
      {
        title: 'Skill Tags',
        key: 'skillTags',
        width: 200,
        render: (_, r) => (Array.isArray(r.skillTags) ? r.skillTags.join(', ') : '-'),
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
                  key: r.key,
                  name: r.name,
                  skillTags: Array.isArray(r.skillTags) ? (r.skillTags as any) : [],
                })
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
                  content: `确定要删除员工类型「${r.name}」吗？删除后，已绑定该类型的员工将变为未绑定状态。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteEmployeeType(r.id)
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

  const handleOpenModal = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ skillTags: ['member'] })
    setOpen(true)
  }

  const handleSubmit = async () => {
    const v = await form.validateFields()
    const payload: CreateEmployeeTypeInput = {
      key: String(v.key).trim(),
      name: String(v.name).trim(),
      skillTags: (v.skillTags ?? []).map((x) => String(x).trim()).filter(Boolean),
    }
    if (editing) {
      await updateEmployeeType(editing.id, payload)
      message.success('更新成功')
    } else {
      await createEmployeeType(payload)
      message.success('创建成功')
    }
    setOpen(false)
    await refresh()
  }

  return (
    <Card>
      <PageHeader
        title="员工类型管理"
        subtitle="配置员工类型及其 Skill 标签，用于 OpenClaw 路由和权限控制。"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增类型
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
        title={editing ? '编辑员工类型' : '新增员工类型'}
        open={open}
        okText="保存"
        cancelText="取消"
        width={MODAL_WIDTH.medium}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Key（唯一标识）"
                name="key"
                rules={[
                  { required: true, message: '请输入 Key' },
                  { pattern: /^[a-z0-9_]+$/, message: '仅允许小写字母/数字/下划线' },
                ]}
                extra="用于系统内部标识，创建后不可修改"
              >
                <Input
                  placeholder="例如：sales / technician"
                  maxLength={INPUT_MAX_LENGTH.code}
                  showCount
                  disabled={!!editing}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="名称"
                name="name"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input
                  placeholder="例如：销售 / 安装工程师"
                  maxLength={INPUT_MAX_LENGTH.name}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Skill Tags（用于路由）"
            name="skillTags"
            extra={
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                推荐组合：销售 = member + sales；技术 = member + technician；管理 = admin + guide
              </Typography.Text>
            }
          >
            <Select
              mode="multiple"
              placeholder={`${PLACEHOLDER.select} Skill Tags（可多选）`}
              options={SKILL_TAG_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
