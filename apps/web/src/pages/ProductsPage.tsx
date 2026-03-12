import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { CreateProductInput, Product } from '../api/products'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/products'
import { exportExcel, exportJson, importExcel, importJson } from '../api/excel'
import { downloadBlob } from '../utils/download'
import type { ProductCategory, CreateProductCategoryInput } from '../api/productCategories'
import { createProductCategory, deleteProductCategory, listProductCategories, updateProductCategory } from '../api/productCategories'

type FormValues = {
  name: string
  category: string
  standardPrice: number
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
      { title: '商品名称', dataIndex: 'name' },
      { title: '分类', dataIndex: 'category' },
      { title: '标准价', dataIndex: 'standardPrice' },
      { title: '安装费', dataIndex: 'installationFee' },
      {
        title: '建议库存',
        dataIndex: 'suggestedStockQty',
        render: (v) => (v == null ? '-' : Number(v)),
      },
      {
        title: '特殊安装',
        dataIndex: 'isSpecialInstallation',
        render: (v) => (v ? '是' : '否'),
      },
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
                  category: r.category,
                  standardPrice: Number(r.standardPrice),
                  installationFee: Number(r.installationFee),
                  debuggingFee: r.debuggingFee === null || r.debuggingFee === undefined ? undefined : Number(r.debuggingFee),
                  otherFee: r.otherFee === null || r.otherFee === undefined ? undefined : Number(r.otherFee),
                  maintenanceDeposit:
                    r.maintenanceDeposit === null || r.maintenanceDeposit === undefined
                      ? undefined
                      : Number(r.maintenanceDeposit),
                  isSpecialInstallation: r.isSpecialInstallation,
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
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除该商品？',
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteProduct(r.id)
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
            商品管理
          </Typography.Title>
          <Typography.Text type="secondary">用于销售订单与技术记录的费用计算。</Typography.Text>
        </div>
        <Space wrap>
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
                    downloadBlob('products.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
                  },
                },
                {
                  key: 'json',
                  label: '导出 JSON',
                  onClick: async () => {
                    const rows = await exportJson<any[]>('/excel/products/export-json')
                    downloadBlob('products.json', new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }))
                  },
                },
                {
                  key: 'tpl',
                  label: '下载 Excel 模板',
                  onClick: async () => {
                    const buf = await exportExcel('/excel/products/template')
                    downloadBlob('products.template.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
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
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={async (file) => {
              const text = await file.text()
              const rows = JSON.parse(text)
              const resp = await importJson<{ upserted: number }>('/excel/products/import-json', rows)
              message.success(`导入完成：upserted=${resp.upserted}`)
              await refresh()
              return false
            }}
          >
            <Button>导入 JSON</Button>
          </Upload>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              form.resetFields()
              form.setFieldsValue({
                category: categories[0]?.name ?? '开关类',
                isSpecialInstallation: false,
              })
              setOpen(true)
            }}
          >
            新增商品
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
        title={editing ? '编辑商品' : '新增商品'}
        open={open}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields()
          const payload: CreateProductInput = {
            name: v.name,
            category: v.category,
            standardPrice: v.standardPrice,
            installationFee: v.installationFee,
            ...(v.debuggingFee !== undefined ? { debuggingFee: v.debuggingFee } : {}),
            ...(v.otherFee !== undefined ? { otherFee: v.otherFee } : {}),
            ...(v.maintenanceDeposit !== undefined ? { maintenanceDeposit: v.maintenanceDeposit } : {}),
            isSpecialInstallation: !!v.isSpecialInstallation,
            ...(v.suggestedStockQty !== undefined ? { suggestedStockQty: v.suggestedStockQty } : {}),
            ...(v.techCommissionInstall !== undefined ? { techCommissionInstall: v.techCommissionInstall } : {}),
            ...(v.techCommissionDebug !== undefined ? { techCommissionDebug: v.techCommissionDebug } : {}),
            ...(v.techCommissionMaintenance !== undefined ? { techCommissionMaintenance: v.techCommissionMaintenance } : {}),
            ...(v.techCommissionAfterSales !== undefined ? { techCommissionAfterSales: v.techCommissionAfterSales } : {}),
          }
          if (editing) {
            await updateProduct(editing.id, payload)
            message.success('已更新')
          } else {
            await createProduct(payload)
            message.success('已创建')
          }
          setOpen(false)
          await refresh()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="例如：智能开关 / 网关" />
          </Form.Item>
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
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="标准价" name="standardPrice" rules={[{ required: true, message: '请输入标准价' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="安装费" name="installationFee" rules={[{ required: true, message: '请输入安装费' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="调试费（可选）" name="debuggingFee" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="售后费（可选）" name="otherFee" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Space>
          <Form.Item label="维护押金（可选）" name="maintenanceDeposit">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>

          <Form.Item label="建议库存数量（可选）" name="suggestedStockQty">
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>

          <Typography.Text strong>技术提成（可选）</Typography.Text>
          <div style={{ height: 8 }} />
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="安装提成" name="techCommissionInstall" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="调试提成" name="techCommissionDebug" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="维保提成" name="techCommissionMaintenance" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item label="售后提成" name="techCommissionAfterSales" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Space>

          <Form.Item label="特殊安装标记" name="isSpecialInstallation" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="商品分类管理（含推荐安装/调试费）"
        open={categoryManagerOpen}
        okText="关闭"
        cancelText="关闭"
        footer={[
          <Button key="close" onClick={() => setCategoryManagerOpen(false)}>
            关闭
          </Button>,
        ]}
        onCancel={() => setCategoryManagerOpen(false)}
        width={720}
      >
        <Typography.Paragraph type="secondary">
          这里配置的是按分类的“参考价”，来自 2023–2025 年公开的智能家居安装/调试服务报价（安装费通常为设备价
          10%–20%，门锁/窗帘等略高）。你可以根据自己公司的人工成本和服务标准自由调整，商品级别仍然可以单独覆写。
        </Typography.Paragraph>
        <Form
          form={categoryForm}
          layout="inline"
          onFinish={async (v) => {
            await createProductCategory(v)
            message.success('已创建分类')
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
            <Input placeholder="例如：开关类" />
          </Form.Item>
          <Form.Item
            label="推荐安装费"
            name="recommendedInstallationFee"
            rules={[{ required: true, message: '请输入推荐安装费' }]}
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item label="推荐调试费" name="recommendedDebuggingFee">
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item label="推荐售后费" name="recommendedOtherFee">
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input placeholder="可备注来源/说明" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              新增分类
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
            { title: '名称', dataIndex: 'name' },
            {
              title: '推荐安装费',
              dataIndex: 'recommendedInstallationFee',
              render: (v: any) => Number(v),
            },
            {
              title: '推荐调试费',
              dataIndex: 'recommendedDebuggingFee',
              render: (v: any) => (v == null ? '-' : Number(v)),
            },
            {
              title: '推荐售后费',
              dataIndex: 'recommendedOtherFee',
              render: (v: any) => (v == null ? '-' : Number(v)),
            },
            { title: '备注', dataIndex: 'remark' },
            {
              title: '操作',
              key: 'actions',
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
                              message.success('已更新分类')
                              const cats = await listProductCategories()
                              setCategories(cats)
                              Modal.destroyAll()
                            }}
                          >
                            <Form.Item
                              label="名称"
                              name="name"
                              rules={[{ required: true, message: '请输入分类名称' }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              label="推荐安装费"
                              name="recommendedInstallationFee"
                              rules={[{ required: true, message: '请输入推荐安装费' }]}
                            >
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
                                <Button type="primary" htmlType="submit">
                                  保存
                                </Button>
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
                        title: `确认删除分类「${r.name}」？`,
                        content: '仅删除分类配置，不会删除已存在的商品记录。',
                        okText: '删除',
                        okButtonProps: { danger: true },
                        cancelText: '取消',
                        onOk: async () => {
                          await deleteProductCategory(r.id)
                          message.success('已删除分类')
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

