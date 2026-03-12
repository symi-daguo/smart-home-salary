import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Modal, Select, Space, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { CreateEmployeeTypeInput, EmployeeType } from '../api/employeeTypes'
import { createEmployeeType, deleteEmployeeType, listEmployeeTypes, updateEmployeeType } from '../api/employeeTypes'

type FormValues = {
  key: string
  name: string
  skillTags?: string[]
}

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
      { title: 'key', dataIndex: 'key' },
      { title: '名称', dataIndex: 'name' },
      {
        title: 'skillTags',
        key: 'skillTags',
        render: (_, r) => (Array.isArray(r.skillTags) ? r.skillTags.join(', ') : '-'),
      },
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
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除该员工类型？',
                  content: '删除后，已绑定该类型的员工将变为未绑定状态（需要重新选择）。',
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteEmployeeType(r.id)
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

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            员工类型（Skill 挂载/路由）
          </Typography.Title>
          <Typography.Text type="secondary">
            通过 skillTags 描述该类型员工在 OpenClaw 中应路由到哪些技能（例如 member,sales / member,technician）。
          </Typography.Text>
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
              form.setFieldsValue({ skillTags: ['member'] })
              setOpen(true)
            }}
          >
            新增员工类型
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
        title={editing ? '编辑员工类型' : '新增员工类型'}
        open={open}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields()
          const payload: CreateEmployeeTypeInput = {
            key: String(v.key).trim(),
            name: String(v.name).trim(),
            skillTags: (v.skillTags ?? []).map((x) => String(x).trim()).filter(Boolean),
          }
          if (editing) {
            await updateEmployeeType(editing.id, payload)
            message.success('已更新')
          } else {
            await createEmployeeType(payload)
            message.success('已创建')
          }
          setOpen(false)
          await refresh()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="key（唯一标识）"
            name="key"
            rules={[
              { required: true, message: '请输入 key' },
              { pattern: /^[a-z0-9_]+$/, message: '仅允许小写字母/数字/下划线' },
            ]}
          >
            <Input placeholder="例如：sales / technician / after_sales / pm" disabled={!!editing} />
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：销售 / 安装工程师 / 售后 / 项目经理" />
          </Form.Item>
          <Form.Item label="skillTags（用于路由）" name="skillTags">
            <Select
              mode="multiple"
              placeholder="请选择 skillTags（可多选）"
              options={[
                { value: 'member', label: 'member' },
                { value: 'admin', label: 'admin' },
                { value: 'sales', label: 'sales' },
                { value: 'technician', label: 'technician' },
                { value: 'salary', label: 'salary' },
                { value: 'guide', label: 'guide' },
              ]}
            />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
              <b>含义提示</b>：
              <br />
              - <code>member</code>：一线员工（只能走 <code>/my</code> 系列接口）
              <br />
              - <code>admin</code>：管理员/负责人（偏管理引导）
              <br />
              - <code>sales</code>：销售上报（路由到 <code>member-sales</code>）
              <br />
              - <code>technician</code>：安装/调试/售后（路由到 <code>member-technician</code>）
              <br />
              - <code>salary</code>：工资查询（路由到 <code>member-salary</code>）
              <br />
              - <code>guide</code>：管理引导（路由到 <code>admin-guide</code>）
              <br />
              <b>推荐组合</b>：销售 = <code>member + sales</code>；安装/售后 = <code>member + technician</code>；项目经理/管理 = <code>admin + guide</code>。
            </Typography.Paragraph>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

