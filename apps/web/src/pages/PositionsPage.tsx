import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Space, Table, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { type Position, createPosition, deletePosition, listPositions, updatePosition } from '../api/positions'
import { PageHeader } from '../components/PageHeader'
import { MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

type PositionFormValues = {
  name: string
  baseSalary: number
  phoneAllowance?: number
  transportAllowance?: number
  otherAllowance?: number
  commissionRuleText: string
  bonusRuleText?: string
}

function safeJsonParse(text: string) {
  if (!text.trim()) return {}
  return JSON.parse(text)
}

function jsonPretty(value: any) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

const DEFAULT_COMMISSION_RULE = {
  tiers: [
    { min: 0, max: 50000, rate: 0.03 },
    { min: 50000, max: 80000, rate: 0.04 },
    { min: 80000, max: 100000, rate: 0.05 },
    { min: 100000, max: null, rate: 0.06 },
  ],
  discount_rules: [
    { discount: 0.95, factor: 1.0 },
    { discount: 0.9, factor: 0.85 },
    { discount: 0.85, factor: 0.5 },
  ],
}

export function PositionsPage() {
  const [rows, setRows] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Position | null>(null)
  const [form] = Form.useForm<PositionFormValues>()

  async function refresh() {
    setLoading(true)
    try {
      setRows(await listPositions())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
  }, [])

  const columns: ColumnsType<Position> = useMemo(
    () => [
      { title: '岗位名称', dataIndex: 'name', width: 150 },
      { title: '底薪', dataIndex: 'baseSalary', width: 100 },
      { title: '话补', dataIndex: 'phoneAllowance', width: 100 },
      { title: '车补', dataIndex: 'transportAllowance', width: 100 },
      { title: '其他补贴', dataIndex: 'otherAllowance', width: 100 },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        fixed: 'right',
        render: (_, r) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r)
                form.setFieldsValue({
                  name: r.name,
                  baseSalary: Number(r.baseSalary),
                  phoneAllowance: Number(r.phoneAllowance ?? 0),
                  transportAllowance: Number(r.transportAllowance ?? 0),
                  otherAllowance: Number(r.otherAllowance ?? 0),
                  commissionRuleText: jsonPretty(r.commissionRule),
                  bonusRuleText: jsonPretty(r.bonusRule),
                })
                setOpen(true)
              }}
            >
              编辑
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除岗位「${r.name}」吗？删除后不可恢复。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deletePosition(r.id)
                    message.success('删除成功')
                    await refresh()
                  },
                })
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [form],
  )

  const handleOpenModal = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      commissionRuleText: jsonPretty(DEFAULT_COMMISSION_RULE),
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    const v = await form.validateFields()
    let commissionRule: Record<string, any>
    let bonusRule: Record<string, any> | undefined
    try {
      commissionRule = safeJsonParse(v.commissionRuleText)
      bonusRule = v.bonusRuleText ? safeJsonParse(v.bonusRuleText) : undefined
    } catch {
      message.error('JSON 格式不正确，请检查提成/奖金规则')
      return
    }

    const payload = {
      name: v.name,
      baseSalary: v.baseSalary,
      phoneAllowance: v.phoneAllowance ?? 0,
      transportAllowance: v.transportAllowance ?? 0,
      otherAllowance: v.otherAllowance ?? 0,
      commissionRule,
      ...(bonusRule ? { bonusRule } : {}),
    }

    if (editing) {
      await updatePosition(editing.id, payload)
      message.success('更新成功')
    } else {
      await createPosition(payload)
      message.success('创建成功')
    }
    setOpen(false)
    await refresh()
  }

  return (
    <Card>
      <PageHeader
        title="岗位管理"
        subtitle="配置岗位底薪、补贴及提成规则。提成规则使用 JSON 格式配置。"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增岗位
            </Button>
          </>
        }
      />

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
        title={editing ? '编辑岗位' : '新增岗位'}
        open={open}
        okText="保存"
        cancelText="取消"
        width={MODAL_WIDTH.large}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="岗位名称"
                name="name"
                rules={[{ required: true, message: '请输入岗位名称' }]}
              >
                <Input
                  placeholder={PLACEHOLDER.name}
                  maxLength={INPUT_MAX_LENGTH.name}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="底薪（月）"
                name="baseSalary"
                rules={[{ required: true, message: '请输入底薪' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder={PLACEHOLDER.amount} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="话补" name="phoneAllowance">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入话补" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="车补" name="transportAllowance">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入车补" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="其他补贴" name="otherAllowance">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入其他补贴" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="提成规则（JSON）"
            name="commissionRuleText"
            rules={[{ required: true, message: '请输入提成规则 JSON' }]}
            extra="配置跳点提成区间和折扣因子，格式参考默认值"
          >
            <Input.TextArea rows={10} spellCheck={false} placeholder="请输入 JSON 格式的提成规则" />
          </Form.Item>

          <Form.Item
            label="奖金规则（JSON，可选）"
            name="bonusRuleText"
            extra="可选配置，格式同提成规则"
          >
            <Input.TextArea rows={6} spellCheck={false} placeholder="请输入 JSON 格式的奖金规则（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
