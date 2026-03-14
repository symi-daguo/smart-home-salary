import type { Rule } from 'antd/es/form'

export const formRules = {
  required: (message: string = '此项为必填项'): Rule => ({
    required: true,
    message,
  }),

  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确，请输入11位有效手机号' },
  ] as Rule[],

  email: [
    { type: 'email' as const, message: '邮箱格式不正确' },
  ] as Rule[],

  name: (min = 2, max = 20): Rule[] => [
    { required: true, message: '请输入姓名' },
    { min, max, message: `姓名长度必须在${min}-${max}个字符之间` },
  ],

  password: [
    { required: true, message: '请输入密码' },
    { min: 6, max: 20, message: '密码长度必须在6-20个字符之间' },
  ] as Rule[],

  amount: (min = 0, message = '请输入金额'): Rule[] => [
    { required: true, message },
    { type: 'number' as const, min, message: `金额不能小于${min}` },
  ],

  positiveNumber: (message = '请输入正数'): Rule => ({
    type: 'number' as const,
    min: 0,
    message,
  }),

  rate: [
    { required: true, message: '请输入折扣率' },
    { type: 'number' as const, min: 0, max: 1, message: '折扣率必须在0-1之间' },
  ] as Rule[],

  date: (message = '请选择日期'): Rule => ({
    required: true,
    message,
  }),

  select: (message = '请选择此项'): Rule => ({
    required: true,
    message,
  }),
}

export const MODAL_WIDTH = {
  small: 480,
  medium: 640,
  large: 800,
  xlarge: 960,
  full: 1200,
}

export const INPUT_MAX_LENGTH = {
  name: 20,
  phone: 11,
  email: 50,
  password: 20,
  remark: 500,
  description: 1000,
  code: 50,
  title: 100,
}

export const PLACEHOLDER = {
  name: '请输入姓名',
  phone: '请输入11位手机号',
  email: '请输入邮箱地址',
  password: '请输入密码',
  select: '请选择',
  date: '请选择日期',
  amount: '请输入金额',
  remark: '请输入备注信息',
  search: '请输入搜索关键词',
}
