import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Card, Table, Button, Space, Tag, Form, Input, Select, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { listWarehouseOrderLogs, type WarehouseOrderLog, WarehouseOrderType, WAREHOUSE_ORDER_TYPE_LABELS } from '../api/warehouse'
import { message } from 'antd'

export function WarehouseOrderLogsPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<WarehouseOrderLog[]>([])
  const [form] = Form.useForm()

  const columns: ColumnsType<WarehouseOrderLog> = [
    { title: '单据编号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
    {
      title: '单据类型',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 120,
      render: (v: WarehouseOrderType) => <Tag>{WAREHOUSE_ORDER_TYPE_LABELS[v] ?? v}</Tag>,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operator',
      width: 160,
      render: (_: string, r) => r.operatorName || r.operatorPhone || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 120 },
    {
      title: '变更摘要',
      dataIndex: 'changes',
      key: 'changes',
      render: (v: unknown) => {
        if (!v) return '-'
        try {
          const obj = v as Record<string, unknown>
          const keys = Object.keys(obj)
          if (!keys.length) return '-'
          const preview = keys.slice(0, 3).map((k) => k).join('，')
          return `字段变更：${preview}${keys.length > 3 ? ' 等' : ''}`
        } catch {
          return '-'
        }
      },
    },
  ]

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const [start, end] = values.range || []
      const params: {
        orderNo?: string
        orderType?: WarehouseOrderType
        action?: string
        startDate?: string
        endDate?: string
      } = {}
      if (values.orderNo) params.orderNo = values.orderNo.trim()
      if (values.orderType) params.orderType = values.orderType
      if (values.action) params.action = values.action.trim()
      if (start) params.startDate = (start as dayjs.Dayjs).startOf('day').toISOString()
      if (end) params.endDate = (end as dayjs.Dayjs).endOf('day').toISOString()
      const data = await listWarehouseOrderLogs(params)
      setRows(data)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <PageHeader
        title="修改出入库单日志"
        subtitle="查看出入库单的新增、修改、作废等操作记录，仅老板/高权限角色可见"
        extra={
          <Space>
            <Button icon={<SearchOutlined />} onClick={handleRefresh} loading={loading}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      />

      <div style={{ height: 16 }} />

      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, rowGap: 8 }}
        onFinish={handleRefresh}
      >
        <Form.Item label="单据编号" name="orderNo">
          <Input placeholder="支持模糊搜索" allowClear />
        </Form.Item>
        <Form.Item label="单据类型" name="orderType">
          <Select
            allowClear
            style={{ width: 180 }}
            options={Object.entries(WAREHOUSE_ORDER_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
        <Form.Item label="操作类型" name="action">
          <Input placeholder="如 UPDATE / DELETE" allowClear />
        </Form.Item>
        <Form.Item label="操作日期" name="range">
          <DatePicker.RangePicker allowEmpty={[true, true]} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              查询
            </Button>
            <Button
              onClick={() => {
                form.resetFields()
                handleRefresh()
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  )
}

