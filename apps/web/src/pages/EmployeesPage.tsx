import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Dropdown, Form, Input, Modal, Row, Select, Space, Table, Upload, message } from 'antd'
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
import { EMPLOYEE_STATUS_LABELS } from '../constants/labels'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

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
      { title: '姓名', dataIndex: 'name', width: 100 },
      { title: '手机号', dataIndex: 'phone', width: 120 },
      {
        title: '岗位',
        key: 'position',
        width: 120,
        render: (_, r) => r.position?.name ?? r.positionId,
      },
      {
        title: '入职日期',
        dataIndex: 'entryDate',
        width: 110,
        render: (v) => dayjs(v).format('YYYY-MM-DD'),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 80,
        render: (v: string) => EMPLOYEE_STATUS_LABELS[v] ?? v,
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
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除员工「${r.name}」吗？删除后不可恢复。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteEmployee(r.id)
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
    form.setFieldsValue({ status: 'ACTIVE' })
    setOpen(true)
  }

  const handleSubmit = async () => {
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
      message.success('更新成功')
    } else {
      await createEmployee(payload)
      message.success('创建成功')
    }
    setOpen(false)
    await refresh()
  }

  return (
    <Card>
      <PageHeader
        title="员工管理"
        subtitle="管理销售/技术人员信息，用于工资结算与业务关联。"
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
                      const buf = await exportExcel('/excel/employees/export')
                      downloadBlob(
                        'employees.xlsx',
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
                      const rows = await exportJson<any[]>('/excel/employees/export-json')
                      downloadBlob(
                        'employees.json',
                        new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
                      )
                    },
                  },
                  {
                    key: 'tpl',
                    label: '下载 Excel 模板',
                    onClick: async () => {
                      const buf = await exportExcel('/excel/employees/template')
                      downloadBlob(
                        'employees.template.xlsx',
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
                const resp = await importJson<{ upserted: number }>(
                  '/excel/employees/import-json',
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
              新增员工
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
        title={editing ? '编辑员工' : '新增员工'}
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
              <Form.Item label="姓名" name="name" rules={formRules.name()}>
                <Input placeholder={PLACEHOLDER.name} maxLength={INPUT_MAX_LENGTH.name} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号" name="phone" rules={formRules.phone}>
                <Input placeholder={PLACEHOLDER.phone} maxLength={INPUT_MAX_LENGTH.phone} showCount />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="岗位" name="positionId" rules={[formRules.select('请选择岗位')]}>
                <Select
                  placeholder={`${PLACEHOLDER.select}岗位`}
                  options={positions.map((p) => ({ value: p.id, label: p.name }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="员工类型" name="employeeTypeId" tooltip="用于 Skill 挂载/路由">
                <Select
                  allowClear
                  placeholder={`${PLACEHOLDER.select}员工类型（可选）`}
                  options={employeeTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.key})` }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="入职日期" name="entryDate" rules={[formRules.date('请选择入职日期')]}>
                <DatePicker style={{ width: '100%' }} placeholder={PLACEHOLDER.date} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" name="status" rules={[formRules.required('请选择状态')]}>
                <Select
                  options={Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="绑定账号"
            name="membershipId"
            tooltip="绑定账号后，该账号可调用员工端 /my 接口。管理员账号一般不需要绑定。"
          >
            <Select
              allowClear
              placeholder={`${PLACEHOLDER.select}要绑定的租户成员账号（可选）`}
              options={members.map((m) => ({
                value: m.id,
                label: `${m.user.displayName ? `${m.user.displayName} / ` : ''}${m.user.email} (${m.role})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
