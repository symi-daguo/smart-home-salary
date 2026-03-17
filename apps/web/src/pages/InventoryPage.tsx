import { ReloadOutlined, PrinterOutlined, DollarOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons'
import { Button, Card, Col, Modal, Row, Space, Statistic, Table, Tag, message, InputNumber, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import {
  listInventory,
  getInventoryCost,
  createInventoryCheck,
  approveInventoryCheck,
  type Inventory,
  type InventoryCost,
} from '../api/warehouse'
import { listEmployees } from '../api/employees'
import { PageHeader } from '../components/PageHeader'

export function InventoryPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Inventory[]>([])
  const [costData, setCostData] = useState<InventoryCost | null>(null)
  const [checkOpen, setCheckOpen] = useState(false)
  const [checkSaving, setCheckSaving] = useState(false)
  const [checkRemark, setCheckRemark] = useState('')
  const [counted, setCounted] = useState<Record<string, number>>({})

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

  const openCheck = () => {
    const init: Record<string, number> = {}
    for (const r of rows) {
      init[r.productId] = r.quantity
    }
    setCounted(init)
    setCheckRemark('')
    setCheckOpen(true)
  }

  const submitCheck = async () => {
    setCheckSaving(true)
    try {
      const emps = await listEmployees()
      const approverId = emps[0]?.id
      if (!approverId) {
        message.error('找不到操作人（员工）')
        return
      }

      const payload = {
        remark: checkRemark || undefined,
        items: rows.map((r) => ({
          productId: r.productId,
          systemQty: r.quantity,
          countedQty: Number(counted[r.productId] ?? r.quantity),
        })),
      }
      const check = await createInventoryCheck(payload)
      await approveInventoryCheck(check.id, approverId, '盘点单审核：自动生成调整单')
      message.success('盘点完成：已生成调整单并更新库存')
      setCheckOpen(false)
      await refresh()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '盘点失败')
    } finally {
      setCheckSaving(false)
    }
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
            <Button type="primary" icon={<PlusOutlined />} onClick={openCheck} disabled={!rows.length}>
              创建盘点单
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

      <Modal
        title="库存盘点单"
        open={checkOpen}
        onCancel={() => setCheckOpen(false)}
        onOk={submitCheck}
        confirmLoading={checkSaving}
        okText="审核并生成调整单"
        okButtonProps={{ icon: <CheckOutlined /> }}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>备注（可选）</div>
          <Input value={checkRemark} onChange={(e) => setCheckRemark(e.target.value)} placeholder="本次盘点说明" />
        </div>

        <Table
          rowKey="productId"
          dataSource={rows}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
          columns={[
            { title: '产品', dataIndex: ['product', 'name'], width: 220 },
            { title: '分类', dataIndex: ['product', 'category'], width: 140 },
            { title: '系统库存', dataIndex: 'quantity', width: 100 },
            {
              title: '盘点数量',
              key: 'countedQty',
              width: 140,
              render: (_, r: Inventory) => (
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                  value={counted[r.productId] ?? r.quantity}
                  onChange={(v) => setCounted((prev) => ({ ...prev, [r.productId]: Number(v ?? 0) }))}
                />
              ),
            },
            {
              title: '差异',
              key: 'diff',
              width: 100,
              render: (_, r: Inventory) => {
                const c = Number(counted[r.productId] ?? r.quantity)
                const diff = c - r.quantity
                if (diff === 0) return '-'
                return <span style={{ color: diff > 0 ? '#3f8600' : '#cf1322' }}>{diff > 0 ? `+${diff}` : diff}</span>
              },
            },
          ]}
          scroll={{ x: 'max-content', y: 360 }}
          size="small"
        />
      </Modal>
    </Card>
  )
}
