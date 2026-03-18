import { CheckOutlined, PlayCircleOutlined, ReloadOutlined, AlertOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Card, Col, Grid, Modal, Row, Select, Space, Table, Tag, message, Form, InputNumber, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Alert, AlertSeverity } from '../api/alerts'
import { listAlerts, resolveAlert, runAlertCompare, runAllAlerts, listAlertRules, saveAlertRules, type AlertCondition } from '../api/alerts'
import type { Project } from '../api/projects'
import { listProjects } from '../api/projects'
import { ALERT_SEVERITY_LABELS } from '../constants/labels'
import { PageHeader } from '../components/PageHeader'

function severityTag(s: AlertSeverity) {
  const label = ALERT_SEVERITY_LABELS[s] ?? s
  if (s === 'CRITICAL') return <Tag color="red">{label}</Tag>
  if (s === 'WARNING') return <Tag color="gold">{label}</Tag>
  return <Tag color="blue">{label}</Tag>
}

export function AlertsPage() {
  const screens = Grid.useBreakpoint()
  const [rows, setRows] = useState<Alert[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [severity, setSeverity] = useState<AlertSeverity | undefined>(undefined)
  const [unresolved, setUnresolved] = useState(true)
  const [ruleOpen, setRuleOpen] = useState(false)
  const [ruleSaving, setRuleSaving] = useState(false)
  const [ruleForm] = Form.useForm()

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

  const openRules = async () => {
    try {
      const rules = await listAlertRules()
      const get = (cond: AlertCondition) => rules.find((r) => r.condition === cond)
      const discount = get('DISCOUNT_BELOW_THRESHOLD')
      const payment = get('PAYMENT_BELOW_OUTBOUND')
      const stock = get('STOCK_BELOW_SUGGESTED')
      ruleForm.setFieldsValue({
        discountEnabled: discount?.enabled ?? true,
        discountThreshold: discount?.threshold ? Number(discount.threshold) : 0.85,
        paymentEnabled: payment?.enabled ?? true,
        stockEnabled: stock?.enabled ?? true,
      })
      setRuleOpen(true)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载规则失败')
    }
  }

  const saveRules = async () => {
    const values = await ruleForm.validateFields()
    setRuleSaving(true)
    try {
      await saveAlertRules([
        {
          condition: 'DISCOUNT_BELOW_THRESHOLD',
          enabled: !!values.discountEnabled,
          threshold: String(values.discountThreshold ?? 0.85),
        },
        { condition: 'PAYMENT_BELOW_OUTBOUND', enabled: !!values.paymentEnabled },
        { condition: 'STOCK_BELOW_SUGGESTED', enabled: !!values.stockEnabled },
      ])
      message.success('规则已保存')
      setRuleOpen(false)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '保存失败')
    } finally {
      setRuleSaving(false)
    }
  }

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
      <PageHeader
        title="预警中心"
        subtitle="按项目运行比对生成预警，并支持查询与处理。"
        extra={
          <>
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
            <Button
              type="primary"
              danger
              icon={<AlertOutlined />}
              onClick={async () => {
                const result = await runAllAlerts()
                message.success(`已运行所有预警检查：库存预警${result.stockAlerts}条，折扣率预警${result.discountAlerts}条，收款预警${result.paymentAlerts}条，共${result.total}条`)
                await refresh()
              }}
            >
              运行全部预警
            </Button>
            <Button icon={<SettingOutlined />} onClick={openRules}>
              规则配置
            </Button>
          </>
        }
      />

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
              ...Object.entries(ALERT_SEVERITY_LABELS).map(([value, label]) => ({ value, label })),
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
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={ruleOpen}
        title="预警规则配置"
        onCancel={() => setRuleOpen(false)}
        onOk={saveRules}
        confirmLoading={ruleSaving}
        destroyOnClose
      >
        <Form layout="vertical" form={ruleForm}>
          <Form.Item label="启用：库存低于建议库存预警" name="stockEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="启用：收款低于出库金额预警" name="paymentEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="启用：折扣率低于阈值预警" name="discountEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            label="折扣率阈值（例如 0.85 表示 85 折）"
            name="discountThreshold"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

