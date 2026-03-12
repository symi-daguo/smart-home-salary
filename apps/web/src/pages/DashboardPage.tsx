import {
  AlertOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  List,
  Modal,
  Row,
  Space,
  Statistic,
  Typography,
  type MenuProps,
  Tag,
} from 'antd'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useUiStore } from '../state/ui'
import { useEffect, useState } from 'react'
import {
  getDashboardInstallationBreakdown,
  getDashboardOverview,
  getDashboardRecentInstallations,
  getDashboardRecentSales,
  getDashboardRevenueTrend,
  type DashboardInstallationBreakdownItem,
  type DashboardOverview,
  type DashboardRecentInstallationItem,
  type DashboardRecentSalesItem,
  type DashboardRevenueTrendPoint,
} from '../api/dashboard'
import { downloadBlob } from '../utils/download'
import { message } from 'antd'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export function DashboardPage() {
  const themeMode = useUiStore((s) => s.theme)
  const isDark = themeMode === 'dark'
  const textColor = isDark ? '#ffffff' : '#333333'
  const gridColor = isDark ? '#333333' : '#f0f0f0'
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [trend, setTrend] = useState<DashboardRevenueTrendPoint[]>([])
  const [breakdown, setBreakdown] = useState<DashboardInstallationBreakdownItem[]>([])
  const [recentSales, setRecentSales] = useState<DashboardRecentSalesItem[]>([])
  const [recentInstalls, setRecentInstalls] = useState<DashboardRecentInstallationItem[]>([])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showModules, setShowModules] = useState({
    revenueTrend: true,
    installBreakdown: true,
    recentSales: true,
    recentInstalls: true,
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      getDashboardOverview(),
      getDashboardRevenueTrend({ months: 6 }),
      getDashboardInstallationBreakdown({ days: 7, limit: 6 }),
      getDashboardRecentSales({ limit: 10 }),
      getDashboardRecentInstallations({ limit: 10 }),
    ])
      .then(([ov, tr, br, rs, ri]) => {
        if (!mounted) return
        setOverview(ov)
        setTrend(tr)
        setBreakdown(br)
        setRecentSales(rs)
        setRecentInstalls(ri)
      })
      .catch((e) => message.error(e?.message ?? '加载工作台数据失败'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const items: MenuProps['items'] = [
    { key: 'edit', label: '编辑看板', onClick: () => setSettingsOpen(true) },
    {
      key: 'export',
      label: '导出报表(JSON)',
      onClick: () => {
        const payload = {
          exportedAt: new Date().toISOString(),
          overview,
          trend,
          breakdown,
          recentSales,
          recentInstalls,
        }
        downloadBlob(
          `dashboard_${dayjs().format('YYYYMMDD_HHmmss')}.json`,
          new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
        )
      },
    },
    { type: 'divider' },
    {
      key: 'reset',
      label: '重置布局',
      danger: true,
      onClick: () => {
        setShowModules({ revenueTrend: true, installBreakdown: true, recentSales: true, recentInstalls: true })
        message.success('已重置')
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            工作台
          </Title>
          <Text type="secondary">智能家居业务数据总览与实时动态（已关联真实数据）。</Text>
        </div>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            自定义看板
          </Button>
          <Dropdown menu={{ items }} placement="bottomRight">
            <Button type="text">更多</Button>
          </Dropdown>
        </Space>
      </div>

      <Modal
        title="自定义看板"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={() => setSettingsOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Checkbox checked={showModules.revenueTrend} onChange={(e) => setShowModules((s) => ({ ...s, revenueTrend: e.target.checked }))}>
            营收趋势
          </Checkbox>
          <Checkbox checked={showModules.installBreakdown} onChange={(e) => setShowModules((s) => ({ ...s, installBreakdown: e.target.checked }))}>
            安装品类分布
          </Checkbox>
          <Checkbox checked={showModules.recentSales} onChange={(e) => setShowModules((s) => ({ ...s, recentSales: e.target.checked }))}>
            近期销售动态
          </Checkbox>
          <Checkbox checked={showModules.recentInstalls} onChange={(e) => setShowModules((s) => ({ ...s, recentInstalls: e.target.checked }))}>
            近期安装记录
          </Checkbox>
          <Typography.Text type="secondary">说明：当前为最小可用版本（控制显示/隐藏与导出看板数据）。</Typography.Text>
        </Space>
      </Modal>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title="本月总营收"
              value={overview?.totalRevenueThisMonth ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600', fontWeight: 600 }}
              loading={loading}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="success">
                <ArrowUpOutlined /> 12.5%
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                较上月
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title="新增销售订单"
              value={overview?.salesOrderCountThisMonth ?? 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
              loading={loading}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="success">
                <ArrowUpOutlined /> 5.2%
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                较上月
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title="活跃员工数"
              value={overview?.activeEmployeeCount ?? 0}
              prefix={<TeamOutlined />}
              valueStyle={{ fontWeight: 600 }}
              loading={loading}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">本月无人员变动</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title="待处理预警"
              value={overview?.pendingAlertCount ?? 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322', fontWeight: 600 }}
              loading={loading}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="danger">
                <ArrowDownOutlined /> 2
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                较昨日
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {showModules.revenueTrend && (
          <Col xs={24} lg={16}>
          <Card
            title="营收趋势 (2026)"
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              height: '100%',
            }}
          >
            <div style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend.map((p) => ({ name: p.month, value: p.revenue }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridColor}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f1f1f' : '#fff',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    itemStyle={{ color: textColor }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#1677ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#dashboardRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        )}
        {showModules.installBreakdown && (
          <Col xs={24} lg={8}>
          <Card
            title="本周安装品类分布"
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              height: '100%',
            }}
          >
            <div style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdown.map((x) => ({ name: x.category, value: x.quantity }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridColor}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f1f1f' : '#fff',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    cursor={{
                      fill: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.05)',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="value" fill="#1677ff" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        )}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {showModules.recentSales && (
          <Col xs={24} lg={12}>
          <Card
            title="近期销售动态"
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentSales}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Text type="success" strong>
                      +¥{Number(item.amount).toLocaleString()}
                    </Text>
                  }
                >
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 500 }}>{item.projectName}</span>}
                    description={
                      <span>
                        {item.employeeName} 上报于 {dayjs(item.occurredAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        )}
        {showModules.recentInstalls && (
          <Col xs={24} lg={12}>
          <Card
            title="近期安装记录"
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentInstalls}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag color="blue" style={{ borderRadius: 4 }}>
                      数量: {item.quantity}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 500 }}>{item.productName}</span>}
                    description={
                      <span>
                        由 {item.employeeName} 执行 {item.serviceType}（{dayjs(item.occurredAt).format('YYYY-MM-DD HH:mm')}）
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        )}
      </Row>
    </div>
  )
}

