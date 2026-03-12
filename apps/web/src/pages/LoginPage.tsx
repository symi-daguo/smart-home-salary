import { BankOutlined, BulbOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Form, Input, Typography, message, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { http } from '../api/http'
import { useAuthStore } from '../state/auth'
import { useUiStore } from '../state/ui'

type LoginResponse = {
  accessToken: string
  refreshToken: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setActiveTenantId = useAuthStore((s) => s.setActiveTenantId)
  const { token } = theme.useToken()
  const appName = useUiStore((s) => s.appName)
  const appTheme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  const toggleTheme = () => setTheme(appTheme === 'dark' ? 'light' : 'dark')

  return (
    <div
      className="login-shell"
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        // 给 CSS autofill 覆盖使用的变量（避免深色模式浏览器默认黄底）
        ['--login-input-bg' as any]:
          appTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
        ['--login-input-text' as any]:
          appTheme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)',
        background:
          appTheme === 'dark'
            ? `radial-gradient(1000px circle at 20% 10%, rgba(24,144,255,0.22), transparent 45%),
               radial-gradient(800px circle at 80% 30%, rgba(82,196,26,0.16), transparent 40%),
               radial-gradient(900px circle at 50% 90%, rgba(250,140,22,0.14), transparent 45%),
               #0b0f1a`
            : `radial-gradient(1000px circle at 20% 10%, rgba(24,144,255,0.18), transparent 45%),
               radial-gradient(800px circle at 80% 30%, rgba(82,196,26,0.14), transparent 40%),
               radial-gradient(900px circle at 50% 90%, rgba(250,140,22,0.12), transparent 45%),
               #f5f7fb`,
      }}
    >
      <Card
        style={{
          width: 'min(460px, 100%)',
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow:
            appTheme === 'dark'
              ? '0 16px 48px rgba(0,0,0,0.45)'
              : '0 16px 48px rgba(15, 23, 42, 0.12)',
          background:
            appTheme === 'dark'
              ? 'rgba(20, 20, 20, 0.72)'
              : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 6 }}>
              {appName}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              先用账号登录验证后端与权限；iOS 的手机号验证码登录将在后续阶段补齐。
            </Typography.Paragraph>
          </div>
          <Button
            type="text"
            icon={<BulbOutlined />}
            onClick={toggleTheme}
            aria-label="切换主题"
            title="切换主题"
          />
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Form
          layout="vertical"
          onFinish={async (values) => {
            const tenantSlug = String(values.tenantSlug || '').trim()
            const email = String(values.email || '').trim()
            const password = String(values.password || '')

            const resp = await http.post<LoginResponse>('/auth/login', { email, password })
            setTokens(resp.data.accessToken, resp.data.refreshToken)

            try {
              if (!tenantSlug) throw new Error('missing-tenant-slug')
              // 并行拉取租户与当前用户角色信息
              const [tenantResp, meResp] = await Promise.all([
                http.get<{ id: string }>(`/tenants/slug/${tenantSlug}`),
                http.get<{ tenants: { id: string; slug: string; role: string }[] }>('/users/me'),
              ])
              const tenantId = tenantResp.data.id
              setActiveTenantId(tenantId)

              const memberships = meResp.data.tenants ?? []
              const current = memberships.find((m) => m.slug === tenantSlug)
              const role = current?.role
              const setRoles = useAuthStore.getState().setRoles
              setRoles(role ? [role] : null)

              navigate('/', { replace: true })
            } catch (e: any) {
              setActiveTenantId(null)
              useAuthStore.getState().setRoles(null)
              message.error('登录成功但租户/角色校验失败：请确认租户标识是否正确，或联系管理员。')
            }
          }}
        >
          <Form.Item
            label="账号"
            name="email"
            rules={[
              { required: true, message: '请输入账号' },
              { type: 'email', message: '账号格式不正确（当前仅支持邮箱登录）' },
            ]}
          >
            <Input
              autoFocus
              size="large"
              prefix={<UserOutlined />}
              placeholder="请输入邮箱账号"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            label="所属公司"
            name="tenantSlug"
            rules={[
              { required: true, message: '请输入所属公司标识' },
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: '所属公司标识仅支持英文字母或数字（不含空格和符号）',
              },
            ]}
          >
            <Input
              size="large"
              prefix={<BankOutlined />}
              placeholder="请输入所属公司标识（例如：acme，仅限字母或数字）"
              autoComplete="organization"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            登录
          </Button>
        </Form>

        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
          安全提示：请勿在公共场合保存账号密码；如所属公司标识遗忘，请联系管理员。所属公司标识修改后，所有员工需要使用新的标识重新登录。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}

