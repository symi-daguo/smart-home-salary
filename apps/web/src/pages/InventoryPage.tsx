import { ReloadOutlined, PrinterOutlined, DollarOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { listInventory, getInventoryCost, type Inventory, type InventoryCost } from '../api/warehouse'
import { PageHeader } from '../components/PageHeader'

export function InventoryPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Inventory[]>([])
  const [costData, setCostData] = useState<InventoryCost | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [inventoryList, cost] = await Promise.all([listInventory(), getInventoryCost()])
      setRows(inventoryList)
      setCostData(cost)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const columns: ColumnsType<Inventory> = [
    {
      title: '产品名称',
      dataIndex: ['product', 'name'],
      key: 'productName',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: ['product', 'category'],
      key: 'category',
      width: 120,
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (v: number, r) => {
        const suggested = r.product?.suggestedStockQty
        const isLow = suggested && v < suggested
        return (
          <Space>
            <span>{v}</span>
            {isLow && <Tag color="red">库存不足</Tag>}
          </Space>
        )
      },
    },
    {
      title: '建议库存',
      dataIndex: ['product', 'suggestedStockQty'],
      key: 'suggestedStockQty',
      width: 100,
      render: (v?: number) => v ?? '-',
    },
    {
      title: '成本价',
      dataIndex: ['product', 'costPrice'],
      key: 'costPrice',
      width: 100,
      render: (v?: number) => (v ? `¥${Number(v).toFixed(2)}` : '-'),
    },
    {
      title: '库存成本',
      key: 'totalCost',
      width: 120,
      render: (_, r) => {
        const costPrice = Number(r.product?.costPrice || 0)
        const total = costPrice * r.quantity
        return total > 0 ? `¥${total.toFixed(2)}` : '-'
      },
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdatedAt',
      key: 'lastUpdatedAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ]

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card>
      <PageHeader
        title="库存盘点"
        subtitle="实时查看库存数量与成本统计"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
          </Space>
        }
      />

      <div style={{ height: 16 }} />

      {costData && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="库存总成本"
                value={costData.totalCost}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic title="产品种类" value={rows.length} suffix="种" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="库存不足产品"
                value={rows.filter((r) => {
                  const suggested = r.product?.suggestedStockQty
                  return suggested && r.quantity < suggested
                }).length}
                suffix="种"
                valueStyle={{ color: rows.some((r) => {
                  const suggested = r.product?.suggestedStockQty
                  return suggested && r.quantity < suggested
                }) ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ height: 16 }} />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
        scroll={{ x: 'max-content' }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <strong>合计</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <strong>¥{costData?.totalCost.toFixed(2) ?? '0.00'}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Card>
  )
}
