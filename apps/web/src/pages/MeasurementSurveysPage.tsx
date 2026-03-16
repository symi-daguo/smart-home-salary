import { PlusOutlined, ReloadOutlined, PictureOutlined, VideoCameraOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Table, message, Upload, Image, Space, Typography, Popconfirm } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { http } from '../api/http'
import { PageHeader } from '../components/PageHeader'
import { formRules, MODAL_WIDTH, INPUT_MAX_LENGTH } from '../utils/formRules'
import type { UploadFile } from 'antd/es/upload/interface'

const { Text } = Typography

type Project = { id: string; name: string; customerName?: string }
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: `${p.name}${p.customerName ? ` (${p.customerName})` : ''}` })),
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
    { 
      title: '项目', 
      dataIndex: ['project', 'name'], 
      key: 'project', 
      width: 200,
      render: (name: string, record: Survey) => (
        <div>
          <div>{name}</div>
          {record.project?.customerName && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.project.customerName}</Text>
          )}
        </div>
      )
    },
    {
      title: '时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { 
      title: '图片/视频', 
      dataIndex: 'mediaUrls', 
      key: 'mediaUrls',
      width: 180,
      render: (v: string[] | null | undefined) => {
        if (!v || v.length === 0) return <Text type="secondary">-</Text>
        return (
          <Space>
            {v.slice(0, 3).map((url, idx) => {
              const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i)
              return isVideo ? (
                <div key={idx} style={{ 
                  width: 50, 
                  height: 50, 
                  background: '#f0f0f0',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <VideoCameraOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                </div>
              ) : (
                <Image
                  key={idx}
                  src={url}
                  width={50}
                  height={50}
                  style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                  preview={{ src: url }}
                />
              )
            })}
            {v.length > 3 && <Text type="secondary">+{v.length - 3}</Text>}
          </Space>
        )
      },
    },
    { 
      title: '备注', 
      dataIndex: 'remark', 
      key: 'remark', 
      ellipsis: true,
      render: (v: string | null) => v || <Text type="secondary">-</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: Survey) => (
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

  const handleOpenModal = () => {
    setEditingId(null)
    form.resetFields()
    setFileList([])
    setOpen(true)
  }

  const handleEdit = (record: Survey) => {
    setEditingId(record.id)
    form.setFieldsValue({
      projectId: record.projectId,
      occurredAt: dayjs(record.occurredAt),
      remark: record.remark,
    })
    
    // 设置文件列表
    if (record.mediaUrls && record.mediaUrls.length > 0) {
      const files: UploadFile[] = record.mediaUrls.map((url, idx) => ({
        uid: `-${idx}`,
        name: `文件${idx + 1}`,
        status: 'done',
        url: url,
      }))
      setFileList(files)
    } else {
      setFileList([])
    }
    
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/measurement-surveys/${id}`)
      message.success('删除成功')
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? '删除失败')
    }
  }

  // 自定义上传
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    
    // 检查文件大小（图片5MB，视频50MB）
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    
    if (file.size > maxSize) {
      message.error(`${isImage ? '图片' : '视频'}大小不能超过${isImage ? '5MB' : '50MB'}`)
      onError?.(new Error('文件过大'))
      return
    }
    
    // 检查视频时长（30秒内）
    if (isVideo) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 30) {
          message.error('视频时长不能超过30秒')
          onError?.(new Error('视频过长'))
          return
        }
      }
      video.src = URL.createObjectURL(file)
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadUrl = isImage 
        ? '/uploads/installation-photos' 
        : '/uploads/videos'
      const res = await http.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onSuccess?.(res.data)
      message.success('上传成功')
    } catch (e: any) {
      onError?.(e)
      message.error(e?.response?.data?.message ?? '上传失败')
    }
  }

  const handleUploadChange = (info: any) => {
    // 限制最多3个文件
    const newFileList = info.fileList.slice(0, 3)
    setFileList(newFileList)
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }
    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1))
  }

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      // 从fileList中提取URL
      const mediaUrls = fileList
        .map((f) => f.response?.url || f.url)
        .filter(Boolean)

      if (editingId) {
        // 更新
        await http.patch(`/measurement-surveys/${editingId}`, {
          projectId: values.projectId,
          occurredAt: values.occurredAt ? values.occurredAt.toISOString() : undefined,
          remark: values.remark,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        })
        message.success('更新成功')
      } else {
        // 创建
        await http.post('/measurement-surveys', {
          projectId: values.projectId,
          occurredAt: values.occurredAt ? values.occurredAt.toISOString() : undefined,
          remark: values.remark,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        })
        message.success('创建成功')
      }
      
      form.resetFields()
      setFileList([])
      setEditingId(null)
      setOpen(false)
      await load()
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? (editingId ? '更新失败' : '创建失败'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <PageHeader
        title="测量工勘 - 信息记录"
        subtitle="记录现场测量信息，支持上传图片（最多3张）和30秒内视频。"
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
        title={editingId ? "编辑信息记录" : "新增信息记录"}
        onCancel={() => {
          setOpen(false)
          setEditingId(null)
          form.resetFields()
          setFileList([])
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={MODAL_WIDTH.medium}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {/* 第一行：项目和时间 */}
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item 
                label="关联项目" 
                name="projectId" 
                rules={[formRules.select('请选择项目')]}
              >
                <Select
                  showSearch
                  placeholder="请选择项目"
                  options={projectOptions}
                  optionFilterProp="label"
                  notFoundContent="暂无项目，请先创建项目"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item 
                label="记录时间" 
                name="occurredAt" 
                tooltip="不填则使用当前时间"
                initialValue={dayjs()}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }} 
                  placeholder="选择时间"
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 第二行：图片/视频上传 */}
          <Form.Item 
            label={
              <Space>
                <PictureOutlined />
                <span>现场照片/视频</span>
              </Space>
            }
          >
            <div style={{ 
              padding: 16, 
              background: '#fafafa', 
              borderRadius: 8,
              border: '1px dashed #d9d9d9'
            }}>
              <Upload
                fileList={fileList}
                customRequest={customUpload}
                onChange={handleUploadChange}
                onPreview={handlePreview}
                accept="image/*,video/*"
                multiple
                listType="picture"
                showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
              >
                {fileList.length >= 3 ? null : (
                  <Button icon={<PictureOutlined />}>
                    选择文件 ({fileList.length}/3)
                  </Button>
                )}
              </Upload>
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                <Space direction="vertical" size={0}>
                  <span>• 图片：最多3张，单张≤5MB（jpg/png/webp）</span>
                  <span>• 视频：最多1个，≤50MB，≤30秒（mp4/mov）</span>
                </Space>
              </div>
            </div>
          </Form.Item>

          {/* 第三行：备注 */}
          <Form.Item 
            label="备注" 
            name="remark"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="记录测量现场的补充信息，如特殊安装环境、客户要求等..." 
              maxLength={INPUT_MAX_LENGTH.remark} 
              showCount 
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Card>
  )
}
