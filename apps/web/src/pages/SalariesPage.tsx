import { CheckOutlined, DollarOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Grid, Row, DatePicker, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Salary, SalaryStatus } from '../api/salaries'
import { listSalaries, settleSalaries, updateSalaryStatus } from '../api/salaries'

function statusTag(s: SalaryStatus) {
  if (s === 'PAID') return <Tag color="green">已发放</Tag>
  if (s === 'APPROVED') return <Tag color="blue">已审批</Tag>
  return <Tag>草稿</Tag>
}

export function SalariesPage() {
  const screens = Grid.useBreakpoint()
  const [rows, setRows] = useState<Salary[]>([])
  const [loading, setLoading] = useState(false)
  const [yearMonth, setYearMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [status, setStatus] = useState<SalaryStatus | undefined>(undefined)

  async function refresh() {
    setLoading(true)
    try {
      setRows(await listSalaries({ yearMonth, status }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            工资结算
          </Typography.Title>
          <Typography.Text type="secondary">按月结算生成工资单，并支持审批/发放标记。</Typography.Text>
        </div>
        <Space wrap>
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
        </Space>
      </Space>

      <div style={{ height: 12 }} />

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <DatePicker
            style={{ width: '100%' }}
            picker="month"
            value={dayjs(`${yearMonth}-01`)}
            onChange={(d) => setYearMonth((d ? d.format('YYYY-MM') : dayjs().format('YYYY-MM')))}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
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
        <Col xs={24} sm={24} md={8} lg={6}>
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
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  )
}

