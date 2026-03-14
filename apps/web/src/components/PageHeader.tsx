import type { ReactNode } from 'react'
import { Space, Typography } from 'antd'

type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  extra?: ReactNode
}

export function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        )}
      </div>
      {extra && (
        <Space wrap>
          {extra}
        </Space>
      )}
    </div>
  )
}

