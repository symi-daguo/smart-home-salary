import {
  AlertOutlined,
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BulbOutlined,
  ScanOutlined,
  FileDoneOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PayCircleOutlined,
  ProjectOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  ContainerOutlined,
  AuditOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Menu, Space, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../state/auth'
import { useUiStore } from '../state/ui'
import { http } from '../api/http'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const DEFAULT_OPEN_KEYS = ['org', 'biz', 'report', 'survey', 'finance', 'warehouse'] as const

const NAV_ITEMS_ALL: NonNullable<MenuProps['items']> = [
  { key: '/dashboard', icon: <BarChartOutlined />, label: '工作台' },
  {
    key: 'org',
    icon: <BankOutlined />,
    label: '组织架构',
    children: [
      { key: '/positions', icon: <IdcardOutlined />, label: '岗位管理' },
      { key: '/employee-types', icon: <TagsOutlined />, label: '员工类型' },
      { key: '/employees', icon: <TeamOutlined />, label: '员工管理' },
    ],
  },
  {
    key: 'biz',
    icon: <AppstoreOutlined />,
    label: '业务管理',
    children: [
      { key: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
      { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
    ],
  },
  {
    key: 'report',
    icon: <FileDoneOutlined />,
    label: '业务上报',
    children: [
      { key: '/sales-orders', icon: <ShoppingCartOutlined />, label: '销售上报' },
      { key: '/installation-records', icon: <ToolOutlined />, label: '技术上报' },
    ],
  },
  {
    key: 'survey',
    icon: <ScanOutlined />,
    label: '测量工勘',
    children: [
      { key: '/measurement-surveys', icon: <FileDoneOutlined />, label: '信息记录' },
      { key: '/curtain-orders', icon: <ShoppingCartOutlined />, label: '窗帘下单' },
    ],
  },
  {
    key: 'warehouse',
    icon: <ContainerOutlined />,
    label: '仓库管理',
    children: [
      { key: '/outbound-applications', icon: <AuditOutlined />, label: '出库申请单（全部）' },
      { key: '/outbound-applications/sales-pre', icon: <AuditOutlined />, label: '销售预出库申请' },
      { key: '/outbound-applications/tech-pre', icon: <AuditOutlined />, label: '技术预出库申请' },
      { key: '/outbound-applications/review', icon: <AuditOutlined />, label: '确认出库审核' },
      { type: 'divider' },
      { key: '/warehouse-orders/outbound-sales', icon: <DatabaseOutlined />, label: '销售出库单' },
      { key: '/warehouse-orders/outbound-loan', icon: <DatabaseOutlined />, label: '借货出库单' },
      { key: '/warehouse-orders/outbound-after-sales', icon: <DatabaseOutlined />, label: '售后出库单' },
      { key: '/warehouse-orders/outbound-lost', icon: <DatabaseOutlined />, label: '丢失出库单' },
      { key: '/warehouse-orders/inbound-sales', icon: <DatabaseOutlined />, label: '销售入库单' },
      { key: '/warehouse-orders/inbound-purchase', icon: <DatabaseOutlined />, label: '采购入库单' },
      { key: '/warehouse-orders/inbound-after-sales', icon: <DatabaseOutlined />, label: '售后入库单' },
      { key: '/warehouse-orders/inbound-unknown', icon: <DatabaseOutlined />, label: '未知入库单' },
      { type: 'divider' },
      { key: '/inventory', icon: <DatabaseOutlined />, label: '库存盘点统计' },
      { key: '/warehouse-order-logs', icon: <AuditOutlined />, label: '修改出入库单日志' },
    ],
  },
  {
    key: 'finance',
    icon: <SafetyCertificateOutlined />,
    label: '财务与风控',
    children: [
      { key: '/salary', icon: <PayCircleOutlined />, label: '工资结算' },
      { key: '/alerts', icon: <AlertOutlined />, label: '预警中心' },
    ],
  },
  { key: '/openclaw', icon: <RobotOutlined />, label: 'OpenClaw 联调' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

const BREADCRUMB_MAP: Record<string, string[]> = {
  '/dashboard': ['工作台'],
  '/positions': ['组织架构', '岗位管理'],
  '/employee-types': ['组织架构', '员工类型'],
  '/employees': ['组织架构', '员工管理'],
  '/products': ['业务管理', '商品管理'],
  '/projects': ['业务管理', '项目管理'],
  '/sales-orders': ['业务上报', '销售上报'],
  '/installation-records': ['业务上报', '技术上报'],
  '/measurement-surveys': ['测量工勘', '信息记录'],
  '/curtain-orders': ['测量工勘', '窗帘下单'],
  '/outbound-applications': ['仓库管理', '出库申请单'],
  '/warehouse-orders': ['仓库管理', '出入库单'],
  '/inventory': ['仓库管理', '库存盘点'],
  '/salary': ['财务与风控', '工资结算'],
  '/alerts': ['财务与风控', '预警中心'],
  '/openclaw': ['OpenClaw 联调'],
  '/settings': ['系统设置'],
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const accessToken = useAuthStore((s) => s.accessToken)
  const activeTenantId = useAuthStore((s) => s.activeTenantId)
  const roles = useAuthStore((s) => s.roles)
  const { theme: appTheme, setTheme, appName, appLogo } = useUiStore()
  const {
    token: { colorBgContainer, borderRadiusLG, colorText, colorBorderSecondary },
  } = theme.useToken()

  const [collapsed, setCollapsed] = useState(false)
  const [tenantName, setTenantName] = useState<string>('')
  const [userDisplay, setUserDisplay] = useState<string>('')

  useEffect(() => {
    if (!accessToken || !activeTenantId) return
    const loadProfileAndTenant = async () => {
      try {
        const [meRes, tenantRes] = await Promise.all([
          http.get<{ email?: string; displayName?: string | null; tenants: { id: string; role: string }[] }>('/users/me'),
          http.get<{ name?: string; slug?: string }>('/tenants/current').catch(() => ({ data: {} as { name?: string; slug?: string } })),
        ])
        const memberships = meRes.data.tenants ?? []
        const current = memberships.find((m: { id: string }) => m.id === activeTenantId)
        const role = current?.role
        const setRoles = useAuthStore.getState().setRoles
        setRoles(role ? [role] : null)
        setUserDisplay(meRes.data.displayName?.trim() || meRes.data.email || '')
        const t = tenantRes.data
        setTenantName(t?.name?.trim() || t?.slug || '')
      } catch {
        // 忽略失败；保持现有最小菜单，避免影响基础使用
      }
    }
    loadProfileAndTenant()
  }, [accessToken, activeTenantId])

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname
  const breadcrumbItems = BREADCRUMB_MAP[selectedKey] ?? []

  const isOwnerOrAdmin = (roles ?? []).some((r) => r === 'OWNER' || r === 'ADMIN')
  const navItems: MenuProps['items'] = isOwnerOrAdmin
    ? NAV_ITEMS_ALL
    : // MEMBER 角色：仅暴露“工作台 + OpenClaw 联调”，避免看到管理菜单
      NAV_ITEMS_ALL.filter((item) => {
        const key = (item as any)?.key
        return key === '/dashboard' || key === '/openclaw'
      })

  const toggleTheme = () => {
    setTheme(appTheme === 'dark' ? 'light' : 'dark')
  }

  const userMenu = {
    items: [
      {
        key: 'tenant',
        icon: <UserOutlined />,
        label: `当前公司：${tenantName || activeTenantId || '-'}`,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout()
          navigate('/login', { replace: true })
        },
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        width={240}
        style={{
          borderRight: `1px solid ${colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          background: colorBgContainer,
        }}
      >
        <div
          style={{
            height: 64,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${colorBorderSecondary}`,
            overflow: 'hidden',
          }}
        >
          {appLogo ? (
            <img
              src={appLogo}
              alt="Logo"
              style={{
                height: 32,
                width: 32,
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                height: 32,
                width: 32,
                borderRadius: 8,
                background: '#1677ff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {appName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px 0',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            inlineCollapsed={collapsed}
            defaultOpenKeys={[...DEFAULT_OPEN_KEYS]}
            openKeys={collapsed ? undefined : [...DEFAULT_OPEN_KEYS]}
            onOpenChange={collapsed ? undefined : () => {}}
            items={navItems}
            onClick={({ key }) => {
              navigate(key)
            }}
            style={{ borderRight: 'none' }}
          />
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: `1px solid ${colorBorderSecondary}`,
            textAlign: 'center',
          }}
        >
          {!collapsed && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              SYMI v1.0.5 (2026)
            </Text>
          )}
          {collapsed && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              v1.0.5
            </Text>
          )}
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${colorBorderSecondary}`,
            background: colorBgContainer,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flex: 1,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
              aria-label="切换侧边栏"
            />
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: colorText,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'min(640px, 60vw)',
                }}
              >
                {appName}
              </span>
            </div>
          </div>
          <Space size="middle">
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={toggleTheme}
              title="切换主题"
            />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space
                style={{
                  cursor: 'pointer',
                  padding: '0 8px',
                  borderRadius: 6,
                  border: `1px solid ${colorBorderSecondary}`,
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  size="small"
                  style={{ backgroundColor: '#1677ff' }}
                />
                <span style={{ color: colorText, fontWeight: 500 }}>{userDisplay || '管理员'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            minHeight: 280,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
            background: colorBgContainer,
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
          }}
        >
          {breadcrumbItems.length > 0 && (
            <Breadcrumb style={{ marginBottom: 16 }}>
              {breadcrumbItems.map((label) => (
                <Breadcrumb.Item key={label}>{label}</Breadcrumb.Item>
              ))}
            </Breadcrumb>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

