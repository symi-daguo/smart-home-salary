import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Descriptions, Divider, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { http } from '../api/http'
import { useAuthStore } from '../state/auth'

type MyProfile = {
  id: string
  name: string
  phone: string
  position?: { id: string; name: string } | null
  employeeType?: { id: string; key: string; name: string; skillTags?: any } | null
}

export function OpenClawPage() {
  const { accessToken, activeTenantId } = useAuthStore.getState()
  const [health, setHealth] = useState<any>(null)
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [h, p] = await Promise.allSettled([http.get('/health'), http.get<MyProfile>('/employees/my-profile')])
      setHealth(h.status === 'fulfilled' ? h.value.data : null)
      setMyProfile(p.status === 'fulfilled' ? p.value.data : null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  const apiBaseHint = `${window.location.origin}`
  const curl = `curl -H "Authorization: Bearer <accessToken>" -H "X-Tenant-ID: <tenantId>" "${apiBaseHint}/api/employees/my-profile"`

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            OpenClaw 联调与自检
          </Typography.Title>
          <Typography.Text type="secondary">
            用于管理员在本机/云服务器上快速确认：JWT、X-Tenant-ID、多租户隔离、员工类型 skillTags 与路由链路是否正常。
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
            刷新自检
          </Button>
        </Space>
      </Space>

      <Divider />

      <Alert
        type="info"
        showIcon
        message="建议的 OpenClaw 路由前置调用"
        description={
          <div>
            OpenClaw 登录后建议先调用 <code>GET /api/employees/my-profile</code> 获取 <code>employeeType.skillTags</code>，再按 README 中映射表路由到对应 Skill。
          </div>
        }
      />

      <div style={{ height: 12 }} />

      <Descriptions bordered size="small" column={1} title="当前 Web 会话关键信息">
        <Descriptions.Item label="API Base（建议 OpenClaw config.apiBase）">{apiBaseHint}</Descriptions.Item>
        <Descriptions.Item label="accessToken（是否存在）">{accessToken ? '已登录（存在）' : '未登录（缺失）'}</Descriptions.Item>
        <Descriptions.Item label="activeTenantId（X-Tenant-ID）">{activeTenantId ?? '未选择租户'}</Descriptions.Item>
      </Descriptions>

      <div style={{ height: 12 }} />

      <Descriptions bordered size="small" column={1} title="API 自检结果">
        <Descriptions.Item label="GET /api/health">
          {health ? <code>OK</code> : <Typography.Text type="secondary">未获取到（请点击刷新，或检查 API 服务是否启动）</Typography.Text>}
        </Descriptions.Item>
        <Descriptions.Item label="GET /api/employees/my-profile">
          {myProfile ? (
            <div>
              <div>
                员工：<b>{myProfile.name}</b>（{myProfile.phone}）
              </div>
              <div>岗位：{myProfile.position?.name ?? '-'}</div>
              <div>
                员工类型：{myProfile.employeeType ? `${myProfile.employeeType.name} (${myProfile.employeeType.key})` : '未绑定'}
              </div>
              <div>
                skillTags：
                <code style={{ marginLeft: 6 }}>
                  {Array.isArray(myProfile.employeeType?.skillTags) ? myProfile.employeeType?.skillTags.join(',') : ''}
                </code>
              </div>
              {!myProfile.employeeType && (
                <Typography.Text type="secondary">
                  提示：请到“员工管理 /employees”给该员工选择员工类型（employeeTypeId），用于 OpenClaw 路由。
                </Typography.Text>
              )}
            </div>
          ) : (
            <Typography.Text type="secondary">
              未获取到。常见原因：当前登录用户未绑定员工档案（Membership 未关联 Employee），或权限/租户头不正确。
            </Typography.Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Typography.Title level={5} style={{ marginTop: 0 }}>
        curl 快速验证
      </Typography.Title>
      <Typography.Paragraph>
        在云服务器上也可以用以下命令快速验证（把 token 与 tenantId 替换为实际值）：
      </Typography.Paragraph>
      <Space.Compact style={{ width: '100%' }}>
        <Typography.Text code style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {curl}
        </Typography.Text>
        <Button
          icon={<CopyOutlined />}
          onClick={async () => {
            await navigator.clipboard.writeText(curl)
            message.success('已复制')
          }}
        >
          复制
        </Button>
      </Space.Compact>
    </Card>
  )
}

