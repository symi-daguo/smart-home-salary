import { Card, Typography } from 'antd'

export function PlaceholderPage(props: { title: string }) {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {props.title}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        该页面为 MVP 骨架：待后端业务接口完成后补齐列表/新增/编辑/导入导出等功能。
      </Typography.Paragraph>
    </Card>
  )
}

