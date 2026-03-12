import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Switch, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../api/http'

type Project = { id: string; name: string }
type CurtainRoom = { roomName: string; detail: any; remark?: string; mediaUrls?: string[] }
type CurtainOrder = {
  id: string
  project?: Project
  roomCount: number
  deliveryToDoor: boolean
  receiverName?: string | null
  deliveryAddress?: string | null
  thirdPartyInstall: boolean
  remark?: string | null
  rooms?: any[]
  createdAt: string
}

export function CurtainOrdersPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CurtainOrder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  )

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, oRes] = await Promise.all([
        http.get<Project[]>('/projects'),
        http.get<CurtainOrder[]>('/curtain-orders'),
      ])
      setProjects(pRes.data ?? [])
      setRows(oRes.data ?? [])
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const columns = [
    { title: '项目', dataIndex: ['project', 'name'], key: 'project' },
    { title: '房间数', dataIndex: 'roomCount', key: 'roomCount' },
    {
      title: '送货上门',
      dataIndex: 'deliveryToDoor',
      key: 'deliveryToDoor',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    { title: '接收人', dataIndex: 'receiverName', key: 'receiverName' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ]

  return (
    <Card
      title="测量工勘 - 窗帘下单"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新增下单
          </Button>
        </Space>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns as any} dataSource={rows} pagination={{ pageSize: 10 }} />

      <Modal
        open={open}
        title="新增窗帘下单（基础版）"
        onCancel={() => setOpen(false)}
        width={860}
        confirmLoading={saving}
        onOk={async () => {
          const values = await form.validateFields()
          setSaving(true)
          try {
            const rooms: CurtainRoom[] = (values.rooms ?? []).map((r: any) => {
              let detail: any = {}
              try {
                detail = r.detailJson ? JSON.parse(r.detailJson) : {}
              } catch {
                throw new Error(`房间「${r.roomName}」的详情 JSON 格式不正确`)
              }
              return {
                roomName: r.roomName,
                detail,
                remark: r.remark,
                mediaUrls: r.mediaUrls ? String(r.mediaUrls).split('\n').map((x: string) => x.trim()).filter(Boolean) : undefined,
              }
            })

            await http.post('/curtain-orders', {
              projectId: values.projectId,
              roomCount: values.roomCount,
              deliveryToDoor: values.deliveryToDoor ?? false,
              receiverName: values.receiverName,
              deliveryAddress: values.deliveryAddress,
              thirdPartyInstall: values.thirdPartyInstall ?? false,
              remark: values.remark,
              rooms,
            })
            message.success('已创建')
            form.resetFields()
            setOpen(false)
            await load()
          } catch (e: any) {
            message.error(e?.message ?? e?.response?.data?.message ?? '创建失败')
          } finally {
            setSaving(false)
          }
        }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ roomCount: 1, deliveryToDoor: false, thirdPartyInstall: false, rooms: [{}] }}
          onValuesChange={(changed) => {
            if ('roomCount' in changed) {
              const roomCount = Number(changed.roomCount || 1)
              const current = form.getFieldValue('rooms') || []
              const next = Array.from({ length: roomCount }, (_, i) => current[i] ?? {})
              form.setFieldValue('rooms', next)
            }
          }}
        >
          <Form.Item label="关联项目" name="projectId" rules={[{ required: true, message: '请选择项目' }]}>
            <Select showSearch placeholder="选择项目" options={projectOptions} optionFilterProp="label" />
          </Form.Item>

          <Space size="large" wrap style={{ marginBottom: 12 }}>
            <Form.Item label="房间数量" name="roomCount" rules={[{ required: true, message: '请输入房间数量' }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item label="是否送货上门" name="deliveryToDoor" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="是否第三方安装" name="thirdPartyInstall" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const deliveryToDoor = !!form.getFieldValue('deliveryToDoor')
              return (
                <Space size="large" wrap style={{ width: '100%' }}>
                  {deliveryToDoor ? (
                    <Form.Item label="货物接收人" name="receiverName" rules={[{ required: true, message: '请输入接收人' }]}>
                      <Input placeholder="可填项目客户/技术人员/录入人（基础版先手动输入）" style={{ width: 360 }} />
                    </Form.Item>
                  ) : (
                    <Form.Item label="送货地址/仓库" name="deliveryAddress" rules={[{ required: true, message: '请输入送货地址或仓库' }]}>
                      <Input placeholder="例如：公司仓库 / 具体地址" style={{ width: 360 }} />
                    </Form.Item>
                  )}
                </Space>
              )
            }}
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>

          <Form.List name="rooms">
            {(fields) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fields.map((field, idx) => (
                  <Card key={field.key} size="small" title={`房间 ${idx + 1}`} style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <Form.Item
                      {...field}
                      label="房间名称"
                      name={[field.name, 'roomName']}
                      rules={[{ required: true, message: '请输入房间名称' }]}
                    >
                      <Input placeholder="例如：主卧/客厅" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      label="窗帘详情 JSON（基础版）"
                      name={[field.name, 'detailJson']}
                      rules={[{ required: true, message: '请输入详情 JSON（可先写最小字段）' }]}
                      tooltip="后续会按测试反馈拆分为可视化字段（类型/长度结构/窗帘盒/布匹/电源/电机等）。当前先用 JSON 保证可录入与可追溯。"
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder='例如：{"curtainType":"卷帘","length":3.7,"layers":"单层","power":"左电源"}'
                      />
                    </Form.Item>
                    <Form.Item {...field} label="媒体 URL（每行一个）" name={[field.name, 'mediaUrls']}>
                      <Input.TextArea rows={3} placeholder="https://.../a.jpg&#10;https://.../b.mp4" />
                    </Form.Item>
                    <Form.Item {...field} label="备注" name={[field.name, 'remark']}>
                      <Input.TextArea rows={2} placeholder="可选" />
                    </Form.Item>
                  </Card>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  )
}

