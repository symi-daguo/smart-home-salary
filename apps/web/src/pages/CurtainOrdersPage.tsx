import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Switch, Table, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

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
    { title: '项目', dataIndex: ['project', 'name'], key: 'project', width: 200 },
    { title: '房间数', dataIndex: 'roomCount', key: 'roomCount', width: 80 },
    {
      title: '送货上门',
      dataIndex: 'deliveryToDoor',
      key: 'deliveryToDoor',
      width: 90,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    { title: '接收人', dataIndex: 'receiverName', key: 'receiverName', width: 100 },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ]

  const handleOpenModal = () => {
    form.resetFields()
    form.setFieldsValue({ roomCount: 1, deliveryToDoor: false, thirdPartyInstall: false, rooms: [{}] })
    setOpen(true)
  }

  const handleSubmit = async () => {
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
          mediaUrls: r.mediaUrls
            ? String(r.mediaUrls)
                .split('\n')
                .map((x: string) => x.trim())
                .filter(Boolean)
            : undefined,
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
      message.success('创建成功')
      form.resetFields()
      setOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.message ?? e?.response?.data?.message ?? '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <PageHeader
        title="窗帘下单"
        subtitle="创建窗帘订单，支持多房间动态表单。"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增下单
            </Button>
          </>
        }
      />

      <div style={{ height: 12 }} />

      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={open}
        title="新增窗帘下单"
        onCancel={() => setOpen(false)}
        width={MODAL_WIDTH.xlarge}
        confirmLoading={saving}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            if ('roomCount' in changed) {
              const roomCount = Number(changed.roomCount || 1)
              const current = form.getFieldValue('rooms') || []
              const next = Array.from({ length: roomCount }, (_, i) => current[i] ?? {})
              form.setFieldValue('rooms', next)
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="关联项目" name="projectId" rules={[formRules.select('请选择项目')]}>
                <Select
                  showSearch
                  placeholder={`${PLACEHOLDER.select}项目`}
                  options={projectOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="房间数量" name="roomCount" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="送货上门" name="deliveryToDoor" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="第三方安装" name="thirdPartyInstall" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const deliveryToDoor = !!form.getFieldValue('deliveryToDoor')
              return (
                <Row gutter={16}>
                  {deliveryToDoor ? (
                    <Col span={12}>
                      <Form.Item label="货物接收人" name="receiverName" rules={[formRules.required('请输入接收人')]}>
                        <Input placeholder="项目客户/技术人员/录入人" maxLength={INPUT_MAX_LENGTH.name} showCount />
                      </Form.Item>
                    </Col>
                  ) : (
                    <Col span={12}>
                      <Form.Item label="送货地址/仓库" name="deliveryAddress" rules={[formRules.required('请输入送货地址')]}>
                        <Input placeholder="例如：公司仓库 / 具体地址" maxLength={INPUT_MAX_LENGTH.description} showCount />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={12}>
                    <Form.Item label="备注" name="remark">
                      <Input.TextArea rows={1} placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
                    </Form.Item>
                  </Col>
                </Row>
              )
            }}
          </Form.Item>

          <Form.List name="rooms">
            {(fields) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fields.map((field, idx) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`房间 ${idx + 1}`}
                    style={{ background: 'rgba(0,0,0,0.02)' }}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          label="房间名称"
                          name={[field.name, 'roomName']}
                          rules={[formRules.required('请输入房间名称')]}
                        >
                          <Input placeholder="例如：主卧/客厅" maxLength={INPUT_MAX_LENGTH.name} showCount />
                        </Form.Item>
                      </Col>
                      <Col span={16}>
                        <Form.Item
                          {...field}
                          label="窗帘详情 JSON"
                          name={[field.name, 'detailJson']}
                          rules={[formRules.required('请输入详情 JSON')]}
                          tooltip="后续会按测试反馈拆分为可视化字段"
                        >
                          <Input.TextArea
                            rows={2}
                            placeholder='{"curtainType":"卷帘","length":3.7}'
                            maxLength={INPUT_MAX_LENGTH.description}
                            showCount
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item {...field} label="媒体 URL（每行一个）" name={[field.name, 'mediaUrls']}>
                          <Input.TextArea rows={2} placeholder="https://.../a.jpg" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item {...field} label="备注" name={[field.name, 'remark']}>
                          <Input.TextArea rows={2} placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
                        </Form.Item>
                      </Col>
                    </Row>
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
