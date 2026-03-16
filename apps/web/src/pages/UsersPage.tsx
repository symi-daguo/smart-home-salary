import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message, Popconfirm, Switch } from 'antd'
import { useEffect, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../components/PageHeader'
import { MODAL_WIDTH, INPUT_MAX_LENGTH } from '../utils/formRules'
import { useAuthStore } from '../state/auth'

type User = {
  id: string
  email: string
  displayName?: string | null
  roles: string[]
  isActive: boolean
  createdAt: string
  lastLoginAt?: string | null
}

const ROLE_OPTIONS = [
  { value: 'OWNER', label: '创始人', color: 'gold' },
  { value: 'ADMIN', label: '管理员', color: 'blue' },
  { value: 'MEMBER', label: '普通成员', color: 'default' },
]

const ROLE_MAP: Record<string, { label: string; color: string }> = {
  OWNER: { label: '创始人', color: 'gold' },
  ADMIN: { label: '管理员', color: 'blue' },
  MEMBER: { label: '普通成员', color: 'default' },
}

export function UsersPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const isOwner = useAuthStore((s) => (s.roles ?? []).includes('OWNER'))
  const isAdmin = useAuthStore((s) => (s.roles ?? []).includes('ADMIN'))

  const canManageUsers = isOwner || isAdmin
  
  // 获取当前用户ID（从JWT token解析）
  const getCurrentUserId = () => {
    const token = useAuthStore.getState().accessToken
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub
    } catch {
      return null
    }
  }
  const currentUserId = getCurrentUserId()

  const load = async () => {
    setLoading(true)
    try {
      const res = await http.get<User[]>('/users')
      setRows(res.data ?? [])
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 250,
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 150,
      render: (v: string | null) => v || '-',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles: string[]) => (
        <Space>
          {roles.map((role) => {
            const config = ROLE_MAP[role] || { label: role, color: 'default' }
            return (
              <Tag key={role} color={config.color}>
                {config.label}
              </Tag>
            )
          })}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'error'}>
          {v ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: User) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!canManageUsers || record.id === currentUserId}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，是否确认？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            disabled={!canManageUsers || record.id === currentUserId}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!canManageUsers || record.id === currentUserId}
            >
              删除
            </Button>
          </Popconfirm>
          {isOwner && (
            <Button
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record.id)}
            >
              重置密码
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleOpenModal = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      roles: ['MEMBER'],
      isActive: true,
    })
    setOpen(true)
  }

  const handleEdit = (record: User) => {
    setEditingId(record.id)
    form.setFieldsValue({
      email: record.email,
      displayName: record.displayName,
      roles: record.roles,
      isActive: record.isActive,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/users/${id}`)
      message.success('删除成功')
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '删除失败')
    }
  }

  const handleResetPassword = async (id: string) => {
    try {
      await http.post(`/users/${id}/reset-password`)
      message.success('密码已重置为默认密码：password')
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '重置密码失败')
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editingId) {
        // 更新
        await http.patch(`/users/${editingId}`, {
          displayName: values.displayName,
          roles: values.roles,
          isActive: values.isActive,
        })
        message.success('更新成功')
      } else {
        // 创建
        await http.post('/users', {
          email: values.email,
          displayName: values.displayName,
          password: values.password,
          roles: values.roles,
          isActive: values.isActive,
        })
        message.success('创建成功')
      }
      form.resetFields()
      setEditingId(null)
      setOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? (editingId ? '更新失败' : '创建失败'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <PageHeader
        title="用户管理"
        subtitle="管理系统用户账号，分配角色权限。"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            {canManageUsers && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
                新增用户
              </Button>
            )}
          </>
        }
      />

      <div style={{ height: 12 }} />

      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={open}
        title={editingId ? "编辑用户" : "新增用户"}
        onCancel={() => {
          setOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={MODAL_WIDTH.medium}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              placeholder="例如：user@example.com"
              maxLength={INPUT_MAX_LENGTH.email}
              disabled={!!editingId}
            />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="displayName"
          >
            <Input
              placeholder="例如：张三"
              maxLength={INPUT_MAX_LENGTH.name}
            />
          </Form.Item>

          {!editingId && (
            <Form.Item
              label="初始密码"
              name="password"
              rules={[
                { required: true, message: '请输入初始密码' },
                { min: 8, message: '密码至少8位' },
              ]}
            >
              <Input.Password placeholder="请输入初始密码，至少8位" />
            </Form.Item>
          )}

          <Form.Item
            label="角色"
            name="roles"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={ROLE_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
