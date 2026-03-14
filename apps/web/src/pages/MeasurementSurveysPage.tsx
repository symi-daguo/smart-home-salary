import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Table, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { http } from '../api/http'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH, PLACEHOLDER } from '../utils/formRules'

type Project = { id: string; name: string }
type Survey = {
  id: string
  projectId: string
  occurredAt: string
  remark?: string | null
  mediaUrls?: string[] | null
  project?: Project
}

export function MeasurementSurveysPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Survey[]>([])
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
      const [pRes, sRes] = await Promise.all([
        http.get<Project[]>('/projects'),
        http.get<Survey[]>('/measurement-surveys'),
      ])
      setProjects(pRes.data ?? [])
      setRows(sRes.data ?? [])
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
    {
      title: '时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '媒体数量',
      dataIndex: 'mediaUrls',
      key: 'mediaUrls',
      width: 100,
      render: (v: string[] | null | undefined) => (v?.length ?? 0),
    },
  ]

  const handleOpenModal = () => {
    form.resetFields()
    setOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      await http.post('/measurement-surveys', {
        projectId: values.projectId,
        occurredAt: values.occurredAt ? values.occurredAt.toISOString() : undefined,
        remark: values.remark,
        mediaUrls: values.mediaUrls
          ? String(values.mediaUrls)
              .split('\n')
              .map((x: string) => x.trim())
              .filter(Boolean)
          : undefined,
      })
      message.success('创建成功')
      form.resetFields()
      setOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <PageHeader
        title="测量工勘 - 信息记录"
        subtitle="记录测量工勘信息，支持上传媒体文件。"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              新增记录
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
        title="新增信息记录"
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={MODAL_WIDTH.medium}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
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
            <Col span={12}>
              <Form.Item label="时间" name="occurredAt" tooltip="不填则为当前时间">
                <DatePicker showTime style={{ width: '100%' }} placeholder={PLACEHOLDER.date} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder={PLACEHOLDER.remark} maxLength={INPUT_MAX_LENGTH.remark} showCount />
          </Form.Item>

          <Form.Item
            label="媒体 URL（每行一个）"
            name="mediaUrls"
            tooltip="请先用 uploads 接口上传，复制返回的 url 粘贴到这里"
          >
            <Input.TextArea
              rows={4}
              placeholder="https://.../a.jpg&#10;https://.../b.mp4"
              maxLength={INPUT_MAX_LENGTH.description}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
