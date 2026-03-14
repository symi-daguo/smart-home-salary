import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Card, Col, Dropdown, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Typography, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { CreateProductInput, Product } from '../api/products'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/products'
import { exportExcel, exportJson, importExcel } from '../api/excel'
import { downloadBlob } from '../utils/download'
import type { ProductCategory, CreateProductCategoryInput } from '../api/productCategories'
import { createProductCategory, deleteProductCategory, listProductCategories, updateProductCategory } from '../api/productCategories'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

type FormValues = {
  name: string
  category: string
  standardPrice: number
  costPrice?: number
  installationFee: number
  debuggingFee?: number
  otherFee?: number
  maintenanceDeposit?: number
  isSpecialInstallation?: boolean
  suggestedStockQty?: number
  techCommissionInstall?: number
  techCommissionDebug?: number
  techCommissionMaintenance?: number
  techCommissionAfterSales?: number
  specification?: string
  unit?: string
  isFabric?: boolean
}

const CATEGORY_OPTIONS = [
  '开关类',
  '窗帘类',
  '传感器类',
  '网关类',
  '灯光类',
  '门锁类',
  '其他',
].map((x) => ({ value: x, label: x }))

export function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form] = Form.useForm<FormValues>()
  const [categoryForm] = Form.useForm<CreateProductCategoryInput>()
  const [categories, setCategories] = useState<ProductCategory[]>([])

  async function refresh() {
    setLoading(true)
    try {
      const [products, cats] = await Promise.all([listProducts(), listProductCategories()])
      setRows(products)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch((e) => message.error(e?.message ?? '加载失败'))
  }, [])

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.name,
        label: c.name,
      })),
    [categories],
  )

  const columns: ColumnsType<Product> = useMemo(
    () => [
      { title: '商品名称', dataIndex: 'name', width: 150 },
      { title: '分类', dataIndex: 'category', width: 100 },
      { title: '标准价', dataIndex: 'standardPrice', width: 100, render: (v) => `¥${Number(v).toFixed(2)}` },
      { title: '成本价', dataIndex: 'costPrice', width: 100, render: (v) => v ? `¥${Number(v).toFixed(2)}` : '-' },
      { title: '安装费', dataIndex: 'installationFee', width: 100, render: (v) => `¥${Number(v).toFixed(2)}` },
      {
        title: '建议库存',
        dataIndex: 'suggestedStockQty',
        width: 100,
        render: (v) => (v == null ? '-' : Number(v)),
      },
      {
        title: '布匹',
        dataIndex: 'isFabric',
        width: 70,
        render: (v) => v ? '是' : '否',
      },
      {
        title: '特殊安装',
        dataIndex: 'isSpecialInstallation',
        width: 90,
        render: (v) => (v ? '是' : '否'),
      },
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
                  category: r.category,
                  standardPrice: Number(r.standardPrice),
                  costPrice: r.costPrice ? Number(r.costPrice) : undefined,
                  installationFee: Number(r.installationFee),
                  debuggingFee: r.debuggingFee === null || r.debuggingFee === undefined ? undefined : Number(r.debuggingFee),
                  otherFee: r.otherFee === null || r.otherFee === undefined ? undefined : Number(r.otherFee),
                  maintenanceDeposit:
                    r.maintenanceDeposit === null || r.maintenanceDeposit === undefined
                      ? undefined
                      : Number(r.maintenanceDeposit),
                  isSpecialInstallation: r.isSpecialInstallation,
                  specification: r.specification || undefined,
                  unit: r.unit || undefined,
                  isFabric: r.isFabric || false,
                  suggestedStockQty: r.suggestedStockQty == null ? undefined : Number(r.suggestedStockQty),
                  techCommissionInstall: r.techCommissionInstall == null ? undefined : Number(r.techCommissionInstall),
                  techCommissionDebug: r.techCommissionDebug == null ? undefined : Number(r.techCommissionDebug),
                  techCommissionMaintenance: r.techCommissionMaintenance == null ? undefined : Number(r.techCommissionMaintenance),
                  techCommissionAfterSales: r.techCommissionAfterSales == null ? undefined : Number(r.techCommissionAfterSales),
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
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除商品「${r.name}」吗？删除后不可恢复。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteProduct(r.id)
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
      category: categories[0]?.name ?? '开关类',
      isSpecialInstallation: false,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    const v = await form.validateFields()
    const payload: CreateProductInput = {
      name: v.name,
      category: v.category,
      standardPrice: v.standardPrice,
      costPrice: v.costPrice,
      installationFee: v.installationFee,
      ...(v.debuggingFee !== undefined ? { debuggingFee: v.debuggingFee } : {}),
      ...(v.otherFee !== undefined ? { otherFee: v.otherFee } : {}),
      ...(v.maintenanceDeposit !== undefined ? { maintenanceDeposit: v.maintenanceDeposit } : {}),
      isSpecialInstallation: !!v.isSpecialInstallation,
      specification: v.specification,
      unit: v.unit,
      isFabric: v.isFabric,
      ...(v.suggestedStockQty !== undefined ? { suggestedStockQty: v.suggestedStockQty } : {}),
      ...(v.techCommissionInstall !== undefined ? { techCommissionInstall: v.techCommissionInstall } : {}),
      ...(v.techCommissionDebug !== undefined ? { techCommissionDebug: v.techCommissionDebug } : {}),
      ...(v.techCommissionMaintenance !== undefined ? { techCommissionMaintenance: v.techCommissionMaintenance } : {}),
      ...(v.techCommissionAfterSales !== undefined ? { techCommissionAfterSales: v.techCommissionAfterSales } : {}),
    }
    if (editing) {
      await updateProduct(editing.id, payload)
      message.success('更新成功')
    } else {
      await createProduct(payload)
      message.success('创建成功')
    }
    setOpen(false)
    await refresh()
  }

  return (
    <Card>
      <PageHeader
        title="商品管理"
        subtitle="管理商品信息，用于销售订单与技术记录的费用计算。"
        extra={
          <>
            <Button icon={<SettingOutlined />} onClick={() => setCategoryManagerOpen(true)}>
              分类管理
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
              刷新
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'xlsx',
                    label: '导出 Excel',
                    onClick: async () => {
                      const buf = await exportExcel('/excel/products/export')
                      downloadBlob(
                        'products.xlsx',
                        new Blob([buf], {
                          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        }),
                      )
                    },
                  },
                  {
                    key: 'json',
                    label: '导出 JSON',
                    onClick: async () => {
                      const rows = await exportJson<any[]>('/excel/products/export-json')
                      downloadBlob(
                        'products.json',
                        new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
                      )
                    },
                  },
                  {
                    key: 'tpl',
                    label: '下载 Excel 模板',
                    onClick: async () => {
                      const buf = await exportExcel('/excel/products/template')
                      downloadBlob(
                        'products.template.xlsx',
                        new Blob([buf], {
                          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        }),
                      )
                    },
                  },
                ],
              }}
            >
              <Button icon={<DownloadOutlined />}>导出/模板</Button>
            </Dropdown>
            <Upload
              accept=".xlsx"
              showUploadList={false}
              beforeUpload={async (file) => {
                const resp = await importExcel('/excel/products/import', file as any)
                message.success(`导入完成：upserted=${resp.upserted}`)
                await refresh()
                return false
              }}
            >
              <Button icon={<UploadOutlined />}>导入 Excel</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增商品
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
        title={editing ? '编辑商品' : '新增商品'}
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
              <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
                <Input placeholder="例如：智能开关 / 网关" maxLength={INPUT_MAX_LENGTH.name} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
                <Select
                  style={{ width: '100%' }}
                  options={categoryOptions.length ? categoryOptions : CATEGORY_OPTIONS}
                  showSearch
                  optionFilterProp="label"
                  onChange={(name) => {
                    const cat = categories.find((c) => c.name === name)
                    if (!cat) return
                    const current = form.getFieldsValue([
                      'installationFee',
                      'debuggingFee',
                      'otherFee',
                    ])
                    const patch: Partial<FormValues> = {}
                    if (current.installationFee == null || current.installationFee === undefined) {
                      patch.installationFee = Number(cat.recommendedInstallationFee)
                    }
                    if (
                      (current.debuggingFee == null || current.debuggingFee === undefined) &&
                      cat.recommendedDebuggingFee != null
                    ) {
                      patch.debuggingFee = Number(cat.recommendedDebuggingFee)
                    }
                    if (
                      (current.otherFee == null || current.otherFee === undefined) &&
                      cat.recommendedOtherFee != null
                    ) {
                      patch.otherFee = Number(cat.recommendedOtherFee)
                    }
                    if (Object.keys(patch).length > 0) {
                      form.setFieldsValue(patch)
                      message.info('已按分类带出推荐费用，可根据实际项目调整。')
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="标准价" name="standardPrice" rules={formRules.amount(0, '请输入标准价')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder={PLACEHOLDER.amount} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="成本价" name="costPrice">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="用于库存成本计算" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="安装费" name="installationFee" rules={formRules.amount(0, '请输入安装费')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder={PLACEHOLDER.amount} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="调试费" name="debuggingFee">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="售后费" name="otherFee">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="维护押金" name="maintenanceDeposit">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="建议库存" name="suggestedStockQty">
                <InputNumber style={{ width: '100%' }} min={0} precision={0} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="单位" name="unit">
                <Input placeholder="个/套/米" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="规格型号" name="specification">
                <Input placeholder="可选" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="布匹类型" name="isFabric" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="特殊安装标记" name="isSpecialInstallation" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong>技术提成（可选）</Typography.Text>
          <div style={{ height: 8 }} />
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="安装提成" name="techCommissionInstall">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="调试提成" name="techCommissionDebug">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="维保提成" name="techCommissionMaintenance">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="售后提成" name="techCommissionAfterSales">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong>技术提成（可选）</Typography.Text>
          <div style={{ height: 8 }} />
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="安装提成" name="techCommissionInstall">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="调试提成" name="techCommissionDebug">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="维保提成" name="techCommissionMaintenance">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="售后提成" name="techCommissionAfterSales">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="商品分类管理"
        open={categoryManagerOpen}
        onCancel={() => setCategoryManagerOpen(false)}
        width={MODAL_WIDTH.large}
        footer={[
          <Button key="close" onClick={() => setCategoryManagerOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          配置商品分类的推荐安装/调试费用。新建商品时会自动带出对应分类的推荐费用。
        </Typography.Paragraph>
        <Form
          form={categoryForm}
          layout="inline"
          onFinish={async (v) => {
            await createProductCategory(v)
            message.success('创建成功')
            categoryForm.resetFields()
            const cats = await listProductCategories()
            setCategories(cats)
          }}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：开关类" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item
            label="推荐安装费"
            name="recommendedInstallationFee"
            rules={[{ required: true, message: '请输入' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="推荐调试费" name="recommendedDebuggingFee">
            <InputNumber min={0} precision={2} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="推荐售后费" name="recommendedOtherFee">
            <InputNumber min={0} precision={2} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input placeholder="可选" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              新增
            </Button>
          </Form.Item>
        </Form>

        <div style={{ height: 16 }} />

        <Table
          rowKey="id"
          dataSource={categories}
          pagination={false}
          size="small"
          columns={[
            { title: '名称', dataIndex: 'name', width: 100 },
            {
              title: '推荐安装费',
              dataIndex: 'recommendedInstallationFee',
              width: 100,
              render: (v: any) => Number(v),
            },
            {
              title: '推荐调试费',
              dataIndex: 'recommendedDebuggingFee',
              width: 100,
              render: (v: any) => (v == null ? '-' : Number(v)),
            },
            {
              title: '推荐售后费',
              dataIndex: 'recommendedOtherFee',
              width: 100,
              render: (v: any) => (v == null ? '-' : Number(v)),
            },
            { title: '备注', dataIndex: 'remark', ellipsis: true },
            {
              title: '操作',
              key: 'actions',
              width: 140,
              render: (_: any, r: ProductCategory) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: `编辑分类：${r.name}`,
                        content: (
                          <Form
                            layout="vertical"
                            initialValues={{
                              name: r.name,
                              recommendedInstallationFee: Number(r.recommendedInstallationFee),
                              recommendedDebuggingFee:
                                r.recommendedDebuggingFee == null
                                  ? undefined
                                  : Number(r.recommendedDebuggingFee),
                              recommendedOtherFee:
                                r.recommendedOtherFee == null
                                  ? undefined
                                  : Number(r.recommendedOtherFee),
                              remark: r.remark ?? undefined,
                            }}
                            onFinish={async (values) => {
                              await updateProductCategory(r.id, values)
                              message.success('更新成功')
                              const cats = await listProductCategories()
                              setCategories(cats)
                              Modal.destroyAll()
                            }}
                          >
                            <Form.Item label="名称" name="name" rules={[{ required: true }]}>
                              <Input />
                            </Form.Item>
                            <Form.Item label="推荐安装费" name="recommendedInstallationFee" rules={[{ required: true }]}>
                              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="推荐调试费" name="recommendedDebuggingFee">
                              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="推荐售后费" name="recommendedOtherFee">
                              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="备注" name="remark">
                              <Input />
                            </Form.Item>
                            <Form.Item>
                              <Space>
                                <Button type="primary" htmlType="submit">保存</Button>
                                <Button onClick={() => Modal.destroyAll()}>取消</Button>
                              </Space>
                            </Form.Item>
                          </Form>
                        ),
                        icon: null,
                        okButtonProps: { style: { display: 'none' } },
                        cancelButtonProps: { style: { display: 'none' } },
                      })
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除分类「${r.name}」吗？仅删除分类配置，不会删除已存在的商品记录。`,
                        okText: '删除',
                        okButtonProps: { danger: true },
                        cancelText: '取消',
                        onOk: async () => {
                          await deleteProductCategory(r.id)
                          message.success('删除成功')
                          const cats = await listProductCategories()
                          setCategories(cats)
                        },
                      })
                    }}
                  >
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  )
}
