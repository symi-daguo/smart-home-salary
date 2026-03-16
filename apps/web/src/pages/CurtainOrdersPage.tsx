import { PlusOutlined, ReloadOutlined, CalculatorOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Switch, Table, message, Divider, Typography, Space, Popconfirm } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

const { Text } = Typography

type Project = { id: string; name: string; customerName?: string }
type Product = { id: string; name: string; category: string; standardPrice: number }

// 窗帘类型
const CurtainType = {
  STRAIGHT_TRACK: 'STRAIGHT_TRACK',
  L_TRACK: 'L_TRACK',
  EMBEDDED_TRACK: 'EMBEDDED_TRACK',
  EMBEDDED_L_TRACK: 'EMBEDDED_L_TRACK',
  DREAM_TRACK: 'DREAM_TRACK',
  ROLLER_BLIND: 'ROLLER_BLIND',
  ARC_TRACK: 'ARC_TRACK',
  U_TRACK: 'U_TRACK',
  LIFT_BLIND: 'LIFT_BLIND',
} as const

// 单双层
const LayerType = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
} as const

// L型方向
const LDirection = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const

// 安装位置
const InstallPosition = {
  CENTER: 'CENTER',
  LEFT_FABRIC: 'LEFT_FABRIC',
  RIGHT_FABRIC: 'RIGHT_FABRIC',
} as const

// 电源位置
const PowerPosition = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const

// 安装类型
const InstallType = {
  IN_FRAME: 'IN_FRAME',
  OUT_FRAME: 'OUT_FRAME',
} as const

type CurtainTypeValue = typeof CurtainType[keyof typeof CurtainType]
type LayerTypeValue = typeof LayerType[keyof typeof LayerType]
type LDirectionValue = typeof LDirection[keyof typeof LDirection]
type InstallPositionValue = typeof InstallPosition[keyof typeof InstallPosition]
type PowerPositionValue = typeof PowerPosition[keyof typeof PowerPosition]
type InstallTypeValue = typeof InstallType[keyof typeof InstallType]

const CURTAIN_TYPE_LABELS: Record<CurtainTypeValue, string> = {
  [CurtainType.STRAIGHT_TRACK]: '开合帘直轨',
  [CurtainType.L_TRACK]: '开合帘L轨',
  [CurtainType.EMBEDDED_TRACK]: '内嵌预埋轨道',
  [CurtainType.EMBEDDED_L_TRACK]: '内嵌预埋L轨道',
  [CurtainType.DREAM_TRACK]: '梦幻帘轨道',
  [CurtainType.ROLLER_BLIND]: '卷帘',
  [CurtainType.ARC_TRACK]: '开合帘弧形轨',
  [CurtainType.U_TRACK]: '开合帘U型轨道',
  [CurtainType.LIFT_BLIND]: '升降帘',
}

const LAYER_TYPE_LABELS: Record<LayerTypeValue, string> = {
  [LayerType.SINGLE]: '单层',
  [LayerType.DOUBLE]: '双层',
}

const L_DIRECTION_LABELS: Record<LDirectionValue, string> = {
  [LDirection.LEFT]: '左L',
  [LDirection.RIGHT]: '右L',
}

const INSTALL_POSITION_LABELS: Record<InstallPositionValue, string> = {
  [InstallPosition.CENTER]: '居中安装',
  [InstallPosition.LEFT_FABRIC]: '做布留纱',
  [InstallPosition.RIGHT_FABRIC]: '做纱留布',
}

const POWER_POSITION_LABELS: Record<PowerPositionValue, string> = {
  [PowerPosition.LEFT]: '左电源',
  [PowerPosition.RIGHT]: '右电源',
}

const INSTALL_TYPE_LABELS: Record<InstallTypeValue, string> = {
  [InstallType.IN_FRAME]: '框内安装',
  [InstallType.OUT_FRAME]: '框外安装',
}

// 房间详情类型
type RoomDetail = {
  roomName: string
  curtainType: CurtainTypeValue
  hasCurtainBox: boolean
  curtainBoxWidth?: number
  curtainBoxMaterial?: string
  // 长度字段
  leftLength?: number
  rightLength?: number
  middleLength?: number
  lDirection?: LDirectionValue
  // 卷帘专用
  installType?: InstallTypeValue
  hasShell?: boolean
  // 通用
  layerType: LayerTypeValue
  installPosition?: InstallPositionValue
  powerPosition?: PowerPositionValue
  motorProductId?: string
  // 布匹
  withFabric: boolean
  fabricHeight?: number
  fabricProductId?: string
  // 其他
  remark?: string
  mediaUrls?: string[]
}

type CurtainOrder = {
  id: string
  project?: Project
  projectId?: string
  roomCount: number
  deliveryToDoor: boolean
  receiverName?: string | null
  deliveryAddress?: string | null
  thirdPartyInstall: boolean
  remark?: string | null
  rooms?: any[]
  createdAt: string
  priceResult?: {
    fabricPrice: number
    trackPrice: number
    rodPrice: number
    totalPrice: number
    details: any[]
  }
}

// 价格计算结果
type PriceResult = {
  fabricPrice: number
  trackPrice: number
  rodPrice: number
  totalPrice: number
  details: RoomPriceDetail[]
}

type RoomPriceDetail = {
  roomName: string
  curtainType: string
  layerType: string
  fabricPrice: number
  trackPrice: number
  rodPrice: number
}

export function CurtainOrdersPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CurtainOrder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null)

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  )

  const motorProductOptions = useMemo(
    () => products
      .filter(p => p.category?.includes('电机') || p.name?.includes('电机'))
      .map((p) => ({ value: p.id, label: `${p.name}（${p.category}）` })),
    [products],
  )

  const fabricProductOptions = useMemo(
    () => products
      .filter(p => p.category?.includes('布匹') || p.name?.includes('布'))
      .map((p) => ({ value: p.id, label: `${p.name}（${p.category}）` })),
    [products],
  )

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, oRes, prodRes] = await Promise.all([
        http.get<Project[]>('/projects'),
        http.get<CurtainOrder[]>('/curtain-orders'),
        http.get<Product[]>('/products'),
      ])
      setProjects(pRes.data ?? [])
      setRows(oRes.data ?? [])
      setProducts(prodRes.data ?? [])
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
    {
      title: '总价',
      dataIndex: 'priceResult',
      key: 'totalPrice',
      width: 120,
      render: (v: PriceResult | undefined) => v ? `¥${v.totalPrice.toFixed(2)}` : '-',
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: CurtainOrder) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，是否确认？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const [editingId, setEditingId] = useState<string | null>(null)

  const handleOpenModal = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      roomCount: 1,
      deliveryToDoor: false,
      thirdPartyInstall: false,
      rooms: [{
        curtainType: CurtainType.STRAIGHT_TRACK,
        hasCurtainBox: false,
        layerType: LayerType.SINGLE,
        withFabric: false,
      }],
    })
    setPriceResult(null)
    setOpen(true)
  }

  const handleEdit = async (record: CurtainOrder) => {
    setEditingId(record.id)
    
    // 获取完整的订单详情（包含房间信息）
    try {
      const res = await http.get<CurtainOrder>(`/curtain-orders/${record.id}`)
      const order = res.data
      
      // 转换房间详情数据
      const rooms: RoomDetail[] = order.rooms?.map((room: any) => {
        const detail = room.details?.[0]
        return {
          roomName: detail?.roomName || room.roomName,
          curtainType: detail?.curtainType || CurtainType.STRAIGHT_TRACK,
          hasCurtainBox: detail?.hasCurtainBox ?? false,
          curtainBoxWidth: detail?.curtainBoxWidth ? Number(detail.curtainBoxWidth) : undefined,
          curtainBoxMaterial: detail?.curtainBoxMaterial,
          leftLength: detail?.leftLength ? Number(detail.leftLength) : undefined,
          rightLength: detail?.rightLength ? Number(detail.rightLength) : undefined,
          middleLength: detail?.middleLength ? Number(detail.middleLength) : undefined,
          lDirection: detail?.lDirection,
          installType: detail?.installType,
          hasShell: detail?.hasShell,
          layerType: detail?.layerType || LayerType.SINGLE,
          installPosition: detail?.installPosition,
          powerPosition: detail?.powerPosition,
          motorProductId: detail?.motorProductId,
          withFabric: detail?.withFabric ?? false,
          fabricHeight: detail?.fabricHeight ? Number(detail.fabricHeight) : undefined,
          fabricProductId: detail?.fabricProductId,
          remark: detail?.remark || room.remark,
          mediaUrls: detail?.mediaUrls || room.mediaUrls,
        }
      }) || []
      
      form.setFieldsValue({
        projectId: order.project?.id || order.projectId,
        roomCount: order.roomCount,
        deliveryToDoor: order.deliveryToDoor,
        receiverName: order.receiverName,
        deliveryAddress: order.deliveryAddress,
        thirdPartyInstall: order.thirdPartyInstall,
        remark: order.remark,
        rooms: rooms,
      })
      
      setOpen(true)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '加载订单详情失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/curtain-orders/${id}`)
      message.success('删除成功')
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '删除失败')
    }
  }

  // 计算价格
  const handleCalculatePrice = async () => {
    const values = await form.validateFields()
    const rooms: RoomDetail[] = values.rooms || []

    if (rooms.length === 0) {
      message.error('请至少添加一个房间')
      return
    }

    setCalculating(true)
    try {
      const res = await http.post<PriceResult>('/curtain-orders/calculate-price', { rooms })
      setPriceResult(res.data)
      setPriceModalOpen(true)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '计算失败')
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editingId) {
        // 更新
        await http.patch(`/curtain-orders/${editingId}`, {
          projectId: values.projectId,
          roomCount: values.roomCount,
          deliveryToDoor: values.deliveryToDoor ?? false,
          receiverName: values.receiverName,
          deliveryAddress: values.deliveryAddress,
          thirdPartyInstall: values.thirdPartyInstall ?? false,
          remark: values.remark,
          rooms: values.rooms?.map((r: RoomDetail) => ({
            roomName: r.roomName,
            detail: {},
            remark: r.remark,
            mediaUrls: r.mediaUrls,
          })),
          roomDetails: values.rooms,
          autoGenerateOutbound: true,
        })
        message.success('更新成功')
      } else {
        // 创建
        await http.post('/curtain-orders', {
          projectId: values.projectId,
          roomCount: values.roomCount,
          deliveryToDoor: values.deliveryToDoor ?? false,
          receiverName: values.receiverName,
          deliveryAddress: values.deliveryAddress,
          thirdPartyInstall: values.thirdPartyInstall ?? false,
          remark: values.remark,
          rooms: values.rooms?.map((r: RoomDetail) => ({
            roomName: r.roomName,
            detail: {},
            remark: r.remark,
            mediaUrls: r.mediaUrls,
          })),
          roomDetails: values.rooms,
          autoGenerateOutbound: true,
        })
        message.success('创建成功')
      }
      form.resetFields()
      setEditingId(null)
      setOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.message ?? e?.response?.data?.message ?? (editingId ? '更新失败' : '创建失败'))
    } finally {
      setSaving(false)
    }
  }

  // 渲染房间表单
  const renderRoomForm = (field: any, idx: number) => {
    const roomValue = form.getFieldValue(['rooms', field.name]) || {}
    const curtainType = roomValue.curtainType
    const hasCurtainBox = roomValue.hasCurtainBox
    const layerType = roomValue.layerType
    const withFabric = roomValue.withFabric

    return (
      <Card
        key={field.key}
        size="small"
        title={`房间 ${idx + 1}`}
        style={{ background: 'rgba(0,0,0,0.02)', marginBottom: 16 }}
      >
        {/* 基本信息 */}
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
          <Col span={8}>
            <Form.Item
              {...field}
              label="窗帘类型"
              name={[field.name, 'curtainType']}
              rules={[formRules.required('请选择窗帘类型')]}
            >
              <Select
                placeholder="请选择"
                options={Object.entries(CURTAIN_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              {...field}
              label="单/双层"
              name={[field.name, 'layerType']}
              rules={[formRules.required('请选择')]}
            >
              <Select
                placeholder="请选择"
                options={Object.entries(LAYER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 窗帘盒 */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              {...field}
              label="有无窗帘盒"
              name={[field.name, 'hasCurtainBox']}
              valuePropName="checked"
            >
              <Switch checkedChildren="有" unCheckedChildren="无" />
            </Form.Item>
          </Col>
          {hasCurtainBox && (
            <>
              <Col span={6}>
                <Form.Item
                  {...field}
                  label="窗帘盒宽度(米)"
                  name={[field.name, 'curtainBoxWidth']}
                  rules={[formRules.required('请输入宽度')]}
                >
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="例如：0.2" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  {...field}
                  label="窗帘盒材质"
                  name={[field.name, 'curtainBoxMaterial']}
                  rules={[formRules.required('请输入材质')]}
                >
                  <Input placeholder="例如：木质/铝合金" maxLength={50} showCount />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        {/* 长度字段 - 根据窗帘类型动态显示 */}
        <Divider>尺寸信息</Divider>
        {(curtainType === CurtainType.STRAIGHT_TRACK ||
          curtainType === CurtainType.EMBEDDED_TRACK ||
          curtainType === CurtainType.DREAM_TRACK) && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item {...field} label="左边长度(米)" name={[field.name, 'leftLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="右边长度(米)" name={[field.name, 'rightLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="中间长度(米)" name={[field.name, 'middleLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {(curtainType === CurtainType.L_TRACK ||
          curtainType === CurtainType.EMBEDDED_L_TRACK) && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item {...field} label="左边长度(米)" name={[field.name, 'leftLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="右边长度(米)" name={[field.name, 'rightLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="L型方向" name={[field.name, 'lDirection']}>
                <Select
                  placeholder="请选择"
                  options={Object.entries(L_DIRECTION_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {(curtainType === CurtainType.ARC_TRACK ||
          curtainType === CurtainType.U_TRACK) && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item {...field} label="左边长度(米)" name={[field.name, 'leftLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="中间长度(米)" name={[field.name, 'middleLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="右边长度(米)" name={[field.name, 'rightLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {curtainType === CurtainType.ROLLER_BLIND && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item {...field} label="长度(米)" name={[field.name, 'middleLength']}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="安装类型" name={[field.name, 'installType']}>
                <Select
                  placeholder="请选择"
                  options={Object.entries(INSTALL_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item {...field} label="罩壳" name={[field.name, 'hasShell']} valuePropName="checked">
                <Switch checkedChildren="要" unCheckedChildren="不要" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* 安装信息 */}
        <Divider>安装信息</Divider>
        <Row gutter={16}>
          {layerType === LayerType.SINGLE && (
            <Col span={8}>
              <Form.Item
                {...field}
                label="安装位置"
                name={[field.name, 'installPosition']}
                rules={[formRules.required('请选择安装位置')]}
              >
                <Select
                  placeholder="请选择"
                  options={Object.entries(INSTALL_POSITION_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={8}>
            <Form.Item {...field} label="电源位置" name={[field.name, 'powerPosition']}>
              <Select
                placeholder="请选择"
                options={Object.entries(POWER_POSITION_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item {...field} label="电机型号" name={[field.name, 'motorProductId']}>
              <Select
                showSearch
                placeholder="请选择电机"
                options={motorProductOptions}
                optionFilterProp="label"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 布匹信息 */}
        <Divider>布匹信息</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              {...field}
              label="带布销售"
              name={[field.name, 'withFabric']}
              valuePropName="checked"
            >
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </Col>
          {withFabric && (
            <>
              <Col span={9}>
                <Form.Item
                  {...field}
                  label="布匹高度(米)"
                  name={[field.name, 'fabricHeight']}
                  rules={[formRules.required('请输入高度')]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="例如：2.8" />
                </Form.Item>
              </Col>
              <Col span={9}>
                <Form.Item
                  {...field}
                  label="布匹型号"
                  name={[field.name, 'fabricProductId']}
                  rules={[formRules.required('请选择布匹')]}
                >
                  <Select
                    showSearch
                    placeholder="请选择布匹"
                    options={fabricProductOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        {/* 备注和媒体 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item {...field} label="备注" name={[field.name, 'remark']}>
              <Input.TextArea rows={2} placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item {...field} label="媒体 URL（每行一个）" name={[field.name, 'mediaUrls']}>
              <Input.TextArea rows={2} placeholder="https://.../a.jpg" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    )
  }

  return (
    <Card>
      <PageHeader
        title="窗帘下单"
        subtitle="创建窗帘订单，支持多房间配置、自动价格计算。"
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

      {/* 新增窗帘订单弹窗 */}
      <Modal
        open={open}
        title={editingId ? "编辑窗帘下单" : "新增窗帘下单"}
        onCancel={() => {
          setOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        width={MODAL_WIDTH.xlarge}
        confirmLoading={saving}
        onOk={handleSubmit}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => {
            setOpen(false)
            setEditingId(null)
            form.resetFields()
          }}>
            取消
          </Button>,
          <Button
            key="calc"
            icon={<CalculatorOutlined />}
            onClick={handleCalculatePrice}
            loading={calculating}
          >
            计算价格
          </Button>,
          <Button key="submit" type="primary" loading={saving} onClick={handleSubmit}>
            {editingId ? '更新订单' : '创建订单'}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            if ('roomCount' in changed) {
              const roomCount = Number(changed.roomCount || 1)
              const current = form.getFieldValue('rooms') || []
              const next = Array.from({ length: roomCount }, (_, i) =>
                current[i] || {
                  curtainType: CurtainType.STRAIGHT_TRACK,
                  hasCurtainBox: false,
                  layerType: LayerType.SINGLE,
                  withFabric: false,
                }
              )
              form.setFieldValue('rooms', next)
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="关联项目" name="projectId" rules={[formRules.select('请选择项目')]}
              >
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
                    <Form.Item label="订单备注" name="remark">
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
                {fields.map((field, idx) => renderRoomForm(field, idx))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 价格计算结果弹窗 */}
      <Modal
        title="价格计算结果"
        open={priceModalOpen}
        onCancel={() => setPriceModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPriceModalOpen(false)}>
            确定
          </Button>,
        ]}
      >
        {priceResult && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">布匹总价：</Text>
                  <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                    ¥{priceResult.fabricPrice.toFixed(2)}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">轨道费用：</Text>
                  <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                    ¥{priceResult.trackPrice.toFixed(2)}
                  </Text>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text type="secondary">下单根数费用：</Text>
                  <Text strong style={{ fontSize: 18, color: '#fa8c16' }}>
                    ¥{priceResult.rodPrice.toFixed(2)}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">总价：</Text>
                  <Text strong style={{ fontSize: 24, color: '#f5222d' }}>
                    ¥{priceResult.totalPrice.toFixed(2)}
                  </Text>
                </Col>
              </Row>
            </div>

            <Table
              size="small"
              dataSource={priceResult.details}
              rowKey="roomName"
              pagination={false}
              columns={[
                { title: '房间', dataIndex: 'roomName', width: 100 },
                { title: '类型', dataIndex: 'curtainType', width: 120 },
                { title: '布匹', dataIndex: 'fabricPrice', render: (v: number) => `¥${v.toFixed(2)}` },
                { title: '轨道', dataIndex: 'trackPrice', render: (v: number) => `¥${v.toFixed(2)}` },
                { title: '根数', dataIndex: 'rodPrice', render: (v: number) => `¥${v.toFixed(2)}` },
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  )
}
