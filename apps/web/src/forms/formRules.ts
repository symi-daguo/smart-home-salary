import type { Rule } from 'antd/es/form'

const PHONE_REGEX = /^1\d{10}$/

export const formRules = {
  required: (message: string): Rule[] => [{ required: true, message }],

  nameRequired: (label: string): Rule[] => [
    { required: true, message: `请输入${label}` },
    { max: 50, message: `${label}不能超过 50 个字符` },
  ],

  phoneRequired: (): Rule[] => [
    { required: true, message: '请输入手机号' },
    { pattern: PHONE_REGEX, message: '手机号格式不正确，应为 1 开头的 11 位数字' },
  ],

  optionalMax: (max: number, label: string): Rule[] => [
    { max, message: `${label}不能超过 ${max} 个字符` },
  ],
}

