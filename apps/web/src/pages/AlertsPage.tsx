import { CheckOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Grid, Row, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Alert, AlertSeverity } from '../api/alerts'
import { listAlerts, resolveAlert, runAlertCompare } from '../api/alerts'
import type { Project } from '../api/projects'
import { listProjects } from '../api/projects'

function severityTag(s: AlertSeverity) {
  if (s === 'CRITICAL') return <Tag color="red">CRITICAL</Tag>
  if (s === 'WARNING') return <Tag color="gold">WARNING</Tag>
  return <Tag color="blue">INFO</Tag>
}

export function AlertsPage() {
  const screens = Grid.useBreakpoint()
  const [rows, setRows] = useState<Alert[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [severity, setSeverity] = useState<AlertSeverity | undefined>(undefined)
  const [unresolved, setUnresolved] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const [list, ps] = await Promise.all([
        listAlerts({ projectId, severity, unresolved }),
        listProjects(),
      ])
      setRows(list)
      setProjects(ps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns: ColumnsType<Alert> = useMemo(
    () => [
      { title: '时间', dataIndex: 'createdAt', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
      { title: '级别', dataIndex: 'severity', render: (v) => severityTag(v) },
      { title: '标题', dataIndex: 'title' },
      { title: '内容', dataIndex: 'message' },
      {
        title: '状态',
        key: 'status',
        render: (_, r) => (r.resolvedAt ? <Tag>已处理</Tag> : <Tag color="green">未处理</Tag>),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_, r) => (
          <Space>
            <Button
              icon={<CheckOutlined />}
              disabled={!!r.resolvedAt}
              onClick={async () => {
                await resolveAlert(r.id)
                message.success('已标记处理')
                await refresh()
              }}
            >
              标记已处理
            </Button>
          </Space>
        ),
      },
    ],
    [refresh],
  )

  const projectOptions = useMemo(
    () => [{ value: '', label: '全部项目' }].concat(projects.map((p) => ({ value: p.id, label: p.name }))),
    [projects],
  )

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            预警中心
          </Typography.Title>
          <Typography.Text type="secondary">按项目运行比对生成预警，并支持查询与处理。</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!projectId}
            onClick={async () => {
              if (!projectId) return
              await runAlertCompare(projectId)
              message.success('已运行比对并生成预警')
              await refresh()
            }}
          >
            运行比对
          </Button>
        </Space>
      </Space>

      <div style={{ height: 12 }} />

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12} md={10} lg={8}>
          <Select
            style={{ width: '100%' }}
            options={projectOptions}
            value={projectId ?? ''}
            onChange={(v) => setProjectId(v || undefined)}
            showSearch
            optionFilterProp="label"
            placeholder="选择项目"
          />
        </Col>
        <Col xs={12} sm={6} md={5} lg={4}>
          <Select
            style={{ width: '100%' }}
            value={severity ?? ''}
            options={[
              { value: '', label: '全部级别' },
              { value: 'INFO', label: 'INFO' },
              { value: 'WARNING', label: 'WARNING' },
              { value: 'CRITICAL', label: 'CRITICAL' },
            ]}
            onChange={(v) => setSeverity((v || undefined) as any)}
          />
        </Col>
        <Col xs={12} sm={6} md={5} lg={4}>
          <Select
            style={{ width: '100%' }}
            value={unresolved ? 'unresolved' : 'all'}
            options={[
              { value: 'unresolved', label: '仅未处理' },
              { value: 'all', label: '全部' },
            ]}
            onChange={(v) => setUnresolved(v === 'unresolved')}
          />
        </Col>
        <Col xs={24} sm={24} md={4} lg={4}>
          <Button
            style={{ width: screens.md ? undefined : '100%' }}
            onClick={() => {
              refresh().catch((e) => message.error(e?.message ?? '加载失败'))
            }}
          >
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

