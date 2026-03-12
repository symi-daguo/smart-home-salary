import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  type Position,
  createPosition,
  deletePosition,
  listPositions,
  updatePosition,
} from '../api/positions'

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
      { title: '岗位名称', dataIndex: 'name' },
      { title: '底薪', dataIndex: 'baseSalary' },
      { title: '话补', dataIndex: 'phoneAllowance' },
      { title: '车补', dataIndex: 'transportAllowance' },
      { title: '其他补贴', dataIndex: 'otherAllowance' },
      {
        title: '操作',
        key: 'actions',
        render: (_, r) => (
          <Space>
            <Button
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
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                Modal.confirm({
                  title: '确认删除该岗位？',
                  content: '删除后不可恢复。',
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deletePosition(r.id)
                    message.success('已删除')
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

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            岗位管理
          </Typography.Title>
          <Typography.Text type="secondary">
            提成规则使用 JSON 配置（与需求文档一致）。
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              form.resetFields()
              form.setFieldsValue({
                commissionRuleText: jsonPretty({
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
                }),
              })
              setOpen(true)
            }}
          >
            新增岗位
          </Button>
        </Space>
      </Space>

      <div style={{ height: 12 }} />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? '编辑岗位' : '新增岗位'}
        open={open}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={async () => {
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
            message.success('已更新')
          } else {
            await createPosition(payload)
            message.success('已创建')
          }
          setOpen(false)
          await refresh()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="岗位名称" name="name" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="例如：销售经理 / 技术工程师" />
          </Form.Item>
          <Form.Item label="底薪（月）" name="baseSalary" rules={[{ required: true, message: '请输入底薪' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="话补" name="phoneAllowance" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="车补" name="transportAllowance" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="其他补贴" name="otherAllowance" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Space>

          <Form.Item
            label="提成规则（JSON）"
            name="commissionRuleText"
            rules={[{ required: true, message: '请输入提成规则 JSON' }]}
          >
            <Input.TextArea rows={10} spellCheck={false} />
          </Form.Item>
          <Form.Item label="奖金规则（JSON，可选）" name="bonusRuleText">
            <Input.TextArea rows={6} spellCheck={false} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

