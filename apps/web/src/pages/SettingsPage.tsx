import {
  ApiOutlined,
  LockOutlined,
  SaveOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Switch,
  Tabs,
  Typography,
  Upload,
  Space,
  Divider,
  message,
  type TabsProps,
} from 'antd'
import { useEffect, useState } from 'react'
import { useUiStore } from '../state/ui'
import { useAuthStore } from '../state/auth'
import { http } from '../api/http'

const { Title, Text } = Typography

export function SettingsPage() {
  const { appName, setAppName, appLogo, setAppLogo } = useUiStore()
  const [form] = Form.useForm()
  const [accountForm] = Form.useForm()
  const [companyForm] = Form.useForm()
  const [savingBasic, setSavingBasic] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const roles = useAuthStore((s) => s.roles)
  const isOwner = (roles ?? []).includes('OWNER')

  useEffect(() => {
    // 预加载当前用户与所属公司信息，用于表单初始值
    const load = async () => {
      try {
        const [meRes, tenantRes] = await Promise.all([
          http.get<{ displayName?: string }>('/users/me'),
          http.get<{ name: string; slug: string }>('/tenants/current'),
        ])
        accountForm.setFieldsValue({
          displayName: meRes.data.displayName ?? '',
        })
        companyForm.setFieldsValue({
          tenantName: tenantRes.data.name,
          slug: tenantRes.data.slug,
        })
      } catch {
        // 忽略加载错误，由后续提交时报错提示
      }
    }
    load()
  }, [accountForm, companyForm])

  const handleSaveBasic = async (values: any) => {
    setSavingBasic(true)
    try {
      setAppName(values.appName)
      message.success('基础设置已保存（仅前端显示，不影响后端配置）')
    } finally {
      setSavingBasic(false)
    }
  }

  const handleSaveAccount = async (values: any) => {
    setSavingPassword(true)
    try {
      // 更新显示名称
      if (values.displayName) {
        await http.patch('/users/me', { displayName: values.displayName })
      }
      // 修改密码
      if (values.currentPassword && values.newPassword) {
        await http.post('/auth/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      }
      accountForm.resetFields(['currentPassword', 'newPassword', 'confirmPassword'])
      message.success('账号信息已更新（如修改了密码，请使用新密码重新登录）')
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '保存账号信息失败，请稍后重试'
      message.error(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveCompany = async (values: any) => {
    if (!isOwner) {
      message.error('仅公司 OWNER 可以修改所属公司标识')
      return
    }
    setSavingCompany(true)
    try {
      await http.patch('/tenants/current', {
        name: values.tenantName,
        slug: values.slug,
      })
      message.success('所属公司信息已保存。注意：所属公司标识修改后，所有员工需使用新的标识重新登录。')
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '保存所属公司信息失败，请稍后重试'
      message.error(msg)
    } finally {
      setSavingCompany(false)
    }
  }

  const beforeUpload = (file: File) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!')
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小必须小于 2MB!')
    }

    if (isJpgOrPng && isLt2M) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAppLogo(e.target?.result as string)
        message.success('Logo 已更新')
      }
      reader.readAsDataURL(file)
    }
    return false
  }

  const items: TabsProps['items'] = [
    {
      key: 'basic',
      label: (
        <span>
          <SettingOutlined />
          基础设置
        </span>
      ),
      children: (
        <Card bordered={false} style={{ maxWidth: 600 }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ appName }}
            onFinish={handleSaveBasic}
          >
            <Form.Item
              label="系统名称"
              name="appName"
              rules={[{ required: true, message: '请输入系统名称' }]}
            >
              <Input placeholder="例如：智能家居工资系统" size="large" />
            </Form.Item>

            <Form.Item label="系统 Logo">
              <Space align="start" size="large">
                {appLogo ? (
                  <img
                    src={appLogo}
                    alt="Logo"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid #d9d9d9',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      background: '#f5f5f5',
                      border: '1px dashed #d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text type="secondary">无</Text>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Upload showUploadList={false} beforeUpload={beforeUpload}>
                    <Button icon={<UploadOutlined />}>上传新 Logo</Button>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    支持 JPG/PNG，建议尺寸 128x128，小于 2MB
                  </Text>
                  {appLogo && (
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => setAppLogo(null)}
                      style={{ padding: 0, textAlign: 'left' }}
                    >
                      移除 Logo
                    </Button>
                  )}
                </div>
              </Space>
            </Form.Item>

            <Divider />

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={savingBasic}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'permissions',
      label: (
        <span>
          <SettingOutlined />
          权限分配
        </span>
      ),
      children: (
        <Card bordered={false}>
          <Alert
            message="权限分配模块规划中"
            description="当前实际的权限控制完全由后端 RBAC（OWNER/ADMIN/MEMBER + 细粒度权限）实现。此处仅作为未来可视化配置入口的预留 UI，不会修改服务器端配置。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Form layout="vertical" style={{ maxWidth: 600 }}>
            <Form.Item
              label="允许员工查看全公司项目列表"
              valuePropName="checked"
              initialValue
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="允许员工查看全公司商品列表"
              valuePropName="checked"
              initialValue
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="允许员工修改已核验的销售订单"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
            <Button type="primary" icon={<SaveOutlined />}>
              保存权限设置（占位）
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'account',
      label: (
        <span>
          <LockOutlined />
          账号与安全
        </span>
      ),
      children: (
        <Card bordered={false} style={{ maxWidth: 720 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            管理当前登录账号的显示名称与登录密码；所属公司标识仅应由公司负责人在首次部署时配置，后续如无必要不建议频繁修改。
          </Typography.Paragraph>
          <Form
            form={accountForm}
            layout="vertical"
            onFinish={handleSaveAccount}
            style={{ marginBottom: 32 }}
          >
            <Typography.Title level={5}>个人信息</Typography.Title>
            <Form.Item
              label="显示名称"
              name="displayName"
              tooltip="用于后台展示的称呼，不影响登录账号（邮箱）"
            >
              <Input placeholder="例如：张三（成都分公司）" />
            </Form.Item>

            <Divider />

            <Typography.Title level={5}>修改密码</Typography.Title>
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 8, message: '新密码至少 8 位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码，至少 8 位" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的新密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={savingPassword}
                >
                  保存账号与密码
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  修改密码后，当前会话不立即失效，但下次登录必须使用新密码。
                </Text>
              </Space>
            </Form.Item>
          </Form>

          <Divider />

          <Typography.Title level={5}>所属公司（租户）配置</Typography.Title>
          <Alert
            type={isOwner ? 'warning' : 'info'}
            showIcon
            style={{ marginBottom: 16 }}
            message="所属公司标识（slug）重要说明"
            description={
              isOwner
                ? '所属公司标识仅支持英文字母或数字，通常在首次上线时配置一次即可。修改后，所有员工必须使用新的所属公司标识重新登录本系统（包括 Web、iOS 和 OpenClaw 消息端）。'
                : '仅公司 OWNER 账号可以修改所属公司标识。若贵公司标识发生变更，请联系总部管理员处理。'
            }
          />
          <Form
            form={companyForm}
            layout="vertical"
            onFinish={handleSaveCompany}
            disabled={!isOwner}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="公司名称"
              name="tenantName"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input placeholder="例如：成都远程智能家居有限公司" />
            </Form.Item>
            <Form.Item
              label="所属公司标识（slug）"
              name="slug"
              rules={[
                { required: true, message: '请输入所属公司标识' },
                {
                  pattern: /^[A-Za-z0-9]+$/,
                  message: '所属公司标识仅支持英文字母或数字（不含空格和符号）',
                },
              ]}
              tooltip="用于登录页和 OpenClaw / iOS 端选择公司，例如：acme、acme001。只允许字母与数字组合。"
            >
              <Input placeholder="例如：acme001（仅限英文字母或数字）" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={savingCompany}
                >
                  保存所属公司配置
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  一般在首次部署成功后配置一次即可，后续如非公司主体变更，请不要随意修改。
                </Text>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'openclaw',
      label: (
        <span>
          <ApiOutlined />
          OpenClaw 集成
        </span>
      ),
      children: (
        <Card bordered={false}>
          <Alert
            message="OpenClaw 智能体集成提示"
            description="OpenClaw Gateway Token 与 Control UI 地址在生产环境中通过 Docker Compose 环境变量配置（见 infra/docker-compose*.yml）。本页仅提供文档与占位表单，实际改动仍应以运维配置为准。"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Form layout="vertical" style={{ maxWidth: 600 }}>
            <Form.Item
              label="Gateway Token"
              required
              tooltip="生产环境必须在 infra/.env.prod 中配置强随机 OPENCLAW_GATEWAY_TOKEN"
            >
              <Input.Password
                placeholder="请在 Docker/.env 中配置 OPENCLAW_GATEWAY_TOKEN（此处不真正保存）"
                size="large"
              />
            </Form.Item>
            <Form.Item label="Control UI 地址">
              <Input defaultValue="http://localhost:18789/" size="large" />
            </Form.Item>
            <Form.Item
              label="启用消息端自动路由"
              valuePropName="checked"
              initialValue
              tooltip="根据员工类型 (Skill Tags) 自动路由到对应的 Skill（后端与 OpenClaw 按 README 中说明实现）"
            >
              <Switch />
            </Form.Item>
            <Button type="primary" icon={<SaveOutlined />}>
              保存集成配置（占位）
            </Button>
          </Form>
        </Card>
      ),
    },
  ]

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          系统设置
        </Title>
        <Text type="secondary">
          管理系统基础信息、未来的权限策略与 OpenClaw 集成占位配置。
        </Text>
      </div>
      <Tabs defaultActiveKey="basic" items={items} />
    </Card>
  )
}

