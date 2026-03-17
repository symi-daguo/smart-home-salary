import { CheckOutlined, DollarOutlined, EditOutlined, ExportOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Grid, Row, DatePicker, Select, Space, Table, Tag, message, Modal, Form, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Salary, SalaryStatus } from '../api/salaries'
import { listSalaries, settleSalaries, updateSalaryStatus, updateSalary, exportSalaries } from '../api/salaries'
import { listEmployees, type Employee } from '../api/employees'
import { PageHeader } from '../components/PageHeader'

function statusTag(s: SalaryStatus) {
  if (s === 'PAID') return <Tag color="green">已发放</Tag>
  if (s === 'APPROVED') return <Tag color="blue">已审批</Tag>
  return <Tag>草稿</Tag>
}

export function SalariesPage() {
  const screens = Grid.useBreakpoint()
  const [rows, setRows] = useState<Salary[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [yearMonth, setYearMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [status, setStatus] = useState<SalaryStatus | undefined>(undefined)
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null)
  const [form] = Form.useForm()

  async function refresh() {
    setLoading(true)
    try {
      setRows(await listSalaries({ yearMonth, employeeId, status }))
    } finally {
      setLoading(false)
    }
  }

  async function loadEmployees() {
    try {
      setEmployees(await listEmployees())
    } catch (e) {
      console.error('加载员工列表失败:', e)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
    loadEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEdit = (record: Salary) => {
    setEditingSalary(record)
    form.setFieldsValue({
      baseSalary: Number(record.baseSalary),
      salesCommission: Number(record.salesCommission),
      technicalFee: Number(record.technicalFee),
      allowances: Number(record.allowances),
      penalty: Number(record.penalty),
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async () => {
    if (!editingSalary) return
    try {
      const values = await form.validateFields()
      await updateSalary(editingSalary.id, values)
      message.success('工资单已更新')
      setEditModalVisible(false)
      await refresh()
    } catch (e) {
      message.error('更新失败')
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportSalaries({ yearMonth, employeeId, status })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `salaries-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('导出成功')
    } catch (e) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<Salary> = useMemo(
    () => [
      { title: '月份', dataIndex: 'yearMonth' },
      { title: '员工', key: 'employee', render: (_, r) => r.employee?.name ?? r.employeeId },
      { title: '岗位', key: 'position', render: (_, r) => r.employee?.position?.name ?? '-' },
      { title: '底薪', dataIndex: 'baseSalary' },
      { title: '提成', dataIndex: 'salesCommission' },
      { title: '技术费', dataIndex: 'technicalFee' },
      { title: '补贴', dataIndex: 'allowances' },
      { title: '扣款', dataIndex: 'penalty' },
      { title: '总额', dataIndex: 'total' },
      { title: '状态', dataIndex: 'status', render: (v) => statusTag(v) },
      {
        title: '操作',
        key: 'actions',
        render: (_, r) => (
          <Space>
            <Button
              icon={<EditOutlined />}
              disabled={r.status === 'PAID'}
              onClick={() => handleEdit(r)}
            >
              编辑
            </Button>
            <Button
              icon={<CheckOutlined />}
              disabled={r.status !== 'DRAFT'}
              onClick={async () => {
                await updateSalaryStatus(r.id, 'APPROVED')
                message.success('已审批')
                await refresh()
              }}
            >
              审批
            </Button>
            <Button
              icon={<DollarOutlined />}
              disabled={r.status === 'PAID'}
              onClick={async () => {
                await updateSalaryStatus(r.id, 'PAID')
                message.success('已标记发放')
                await refresh()
              }}
            >
              标记发放
            </Button>
          </Space>
        ),
      },
    ],
    [refresh],
  )

  return (
    <Card>
      <PageHeader
        title="工资结算"
        subtitle="按月结算生成工资单，并支持审批/发放标记。"
        extra={
          <>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={async () => {
                await settleSalaries({ yearMonth })
                message.success('已结算生成工资单')
                await refresh()
              }}
            >
              运行结算
            </Button>
          </>
        }
      />

      <div style={{ height: 12 }} />

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12} md={6} lg={6}>
          <DatePicker
            style={{ width: '100%' }}
            picker="month"
            value={dayjs(`${yearMonth}-01`)}
            onChange={(d) => setYearMonth((d ? d.format('YYYY-MM') : dayjs().format('YYYY-MM')))}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Select
            style={{ width: '100%' }}
            value={employeeId ?? ''}
            placeholder="选择员工"
            options={[
              { value: '', label: '全部员工' },
              ...employees.map((e) => ({ value: e.id, label: e.name })),
            ]}
            onChange={(v) => setEmployeeId(v ? String(v) : undefined)}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Select
            style={{ width: '100%' }}
            value={status ?? ''}
            options={[
              { value: '', label: '全部状态' },
              { value: 'DRAFT', label: '草稿' },
              { value: 'APPROVED', label: '已审批' },
              { value: 'PAID', label: '已发放' },
            ]}
            onChange={(v) => setStatus((v || undefined) as any)}
          />
        </Col>
        <Col xs={24} sm={24} md={6} lg={6}>
          <Button style={{ width: screens.md ? undefined : '100%' }} onClick={() => refresh()}>
            应用过滤
          </Button>
        </Col>
      </Row>

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
        title="编辑工资单"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        {editingSalary && (
          <Form form={form} layout="vertical">
            <Form.Item label="员工" name="employee">
              <span>{editingSalary.employee?.name ?? editingSalary.employeeId}</span>
            </Form.Item>
            <Form.Item label="月份" name="yearMonth">
              <span>{editingSalary.yearMonth}</span>
            </Form.Item>
            <Form.Item label="底薪" name="baseSalary">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="销售提成" name="salesCommission">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="技术费" name="technicalFee">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="补贴" name="allowances">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="扣款" name="penalty">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  )
}
