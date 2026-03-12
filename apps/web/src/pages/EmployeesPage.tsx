import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Dropdown, Form, Input, Modal, Select, Space, Table, Typography, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Employee, CreateEmployeeInput } from '../api/employees'
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../api/employees'
import type { EmployeeType } from '../api/employeeTypes'
import { listEmployeeTypes } from '../api/employeeTypes'
import type { Position } from '../api/positions'
import { listPositions } from '../api/positions'
import { exportExcel, exportJson, importExcel, importJson } from '../api/excel'
import { downloadBlob } from '../utils/download'
import { http } from '../api/http'

type FormValues = {
  name: string
  phone: string
  positionId: string
  employeeTypeId?: string
  membershipId?: string
  entryDate: any
  status: 'ACTIVE' | 'INACTIVE'
}

export function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([])
  const [members, setMembers] = useState<{ id: string; role: string; user: { id: string; email: string; displayName?: string | null } }[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form] = Form.useForm<FormValues>()

  async function refresh() {
    setLoading(true)
    try {
      const [emps, pos, types, mem] = await Promise.all([
        listEmployees(),
        listPositions(),
        listEmployeeTypes(),
        http.get('/tenants/current/members').then((r) => r.data).catch(() => []),
      ])
      setRows(emps)
      setPositions(pos)
      setEmployeeTypes(types)
      setMembers(mem ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
  }, [])

  const columns: ColumnsType<Employee> = useMemo(
    () => [
      { title: '姓名', dataIndex: 'name' },
      { title: '手机号', dataIndex: 'phone' },
      {
        title: '岗位',
        key: 'position',
        render: (_, r) => r.position?.name ?? r.positionId,
      },
      {
        title: '入职日期',
        dataIndex: 'entryDate',
        render: (v) => dayjs(v).format('YYYY-MM-DD'),
      },
      { title: '状态', dataIndex: 'status' },
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
                  name: r.name,
                  phone: r.phone,
                  positionId: r.positionId,
                  employeeTypeId: r.employeeTypeId ?? undefined,
                  membershipId: r.membershipId ?? undefined,
                  entryDate: dayjs(r.entryDate),
                  status: r.status,
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
                  title: '确认删除该员工？',
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteEmployee(r.id)
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
            员工管理
          </Typography.Title>
          <Typography.Text type="secondary">用于销售/技术人员的工资结算与录入关联。</Typography.Text>
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
                    const buf = await exportExcel('/excel/employees/export')
                    downloadBlob('employees.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
                  },
                },
                {
                  key: 'json',
                  label: '导出 JSON',
                  onClick: async () => {
                    const rows = await exportJson<any[]>('/excel/employees/export-json')
                    downloadBlob('employees.json', new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }))
                  },
                },
                {
                  key: 'tpl',
                  label: '下载 Excel 模板',
                  onClick: async () => {
                    const buf = await exportExcel('/excel/employees/template')
                    downloadBlob('employees.template.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
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
              const resp = await importExcel('/excel/employees/import', file as any)
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
              const resp = await importJson<{ upserted: number }>('/excel/employees/import-json', rows)
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
              form.setFieldsValue({ status: 'ACTIVE' })
              setOpen(true)
            }}
          >
            新增员工
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
        title={editing ? '编辑员工' : '新增员工'}
        open={open}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields()
          const payload: CreateEmployeeInput = {
            name: v.name,
            phone: v.phone,
            positionId: v.positionId,
            employeeTypeId: v.employeeTypeId ?? null,
            membershipId: v.membershipId ?? null,
            entryDate: dayjs(v.entryDate).format('YYYY-MM-DD'),
            status: v.status,
          }
          if (editing) {
            await updateEmployee(editing.id, payload)
            message.success('已更新')
          } else {
            await createEmployee(payload)
            message.success('已创建')
          }
          setOpen(false)
          await refresh()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="岗位" name="positionId" rules={[{ required: true, message: '请选择岗位' }]}>
            <Select
              placeholder="请选择岗位"
              options={positions.map((p) => ({ value: p.id, label: p.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="员工类型（用于 Skill 挂载/路由）" name="employeeTypeId">
            <Select
              allowClear
              placeholder="可选：选择员工类型"
              options={employeeTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.key})` }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            label="绑定账号（用于 iOS/OpenClaw /my 能力）"
            name="membershipId"
            tooltip="只有绑定了账号后，该账号才能调用 /api/*/my 与 /api/employees/my-profile。通常用于员工端；管理员账号一般不需要绑定。"
          >
            <Select
              allowClear
              placeholder="可选：选择要绑定的租户成员账号"
              options={members.map((m) => ({
                value: m.id,
                label: `${m.user.displayName ? `${m.user.displayName} / ` : ''}${m.user.email} (${m.role})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="入职日期" name="entryDate" rules={[{ required: true, message: '请选择入职日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'ACTIVE', label: '在职' },
                { value: 'INACTIVE', label: '离职' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

