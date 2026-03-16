import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  VoiceInputDto,
  IntentType,
  ParsedIntentDto,
  FormSummaryDto,
} from './dto/voice-input.dto';

@Injectable()
export class OpenclawService {
  constructor(private readonly prisma: PrismaService) {}

  // 自然语言解析 - 意图识别
  async parseIntent(dto: VoiceInputDto): Promise<ParsedIntentDto> {
    const { content, employeeId } = dto;
    const lowerContent = content.toLowerCase();

    // 意图识别规则
    let intent = IntentType.UNKNOWN;
    let confidence = 0;
    const entities: Record<string, any> = {};

    // 1. 工资查询意图
    if (
      lowerContent.includes('工资') ||
      lowerContent.includes('薪资') ||
      lowerContent.includes('发钱') ||
      lowerContent.includes('本月收入')
    ) {
      intent = IntentType.SALARY_QUERY;
      confidence = 0.9;

      // 解析月份
      const monthMatch = content.match(/(\d{4})[-/](\d{1,2})/);
      if (monthMatch) {
        entities.year = parseInt(monthMatch[1]);
        entities.month = parseInt(monthMatch[2]);
      } else if (lowerContent.includes('本月')) {
        const now = new Date();
        entities.year = now.getFullYear();
        entities.month = now.getMonth() + 1;
      } else if (lowerContent.includes('上月')) {
        const now = new Date();
        entities.year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        entities.month = now.getMonth() === 0 ? 12 : now.getMonth();
      }
    }

    // 2. 销售上报意图
    else if (
      lowerContent.includes('销售') ||
      lowerContent.includes('收款') ||
      lowerContent.includes('报单') ||
      lowerContent.includes('订单') ||
      lowerContent.includes('回款') ||
      lowerContent.includes('签单')
    ) {
      intent = IntentType.SALES_REPORT;
      confidence = 0.85;

      // 解析金额
      const amountMatch = content.match(/(\d+\.?\d*)\s*[万w]/i);
      if (amountMatch) {
        entities.amount = parseFloat(amountMatch[1]) * 10000;
      } else {
        const simpleAmount = content.match(/(\d{4,})/);
        if (simpleAmount) {
          entities.amount = parseFloat(simpleAmount[1]);
        }
      }

      // 解析折扣率
      const discountMatch = content.match(/(\d{1,2})\s*折/);
      if (discountMatch) {
        entities.discountRate = parseInt(discountMatch[1]) / 10;
      } else if (lowerContent.includes('九五折')) {
        entities.discountRate = 0.95;
      } else if (lowerContent.includes('九折')) {
        entities.discountRate = 0.9;
      }

      // 解析项目名称
      const projectMatch = content.match(/项目[：:]?\s*(\S+)/);
      if (projectMatch) {
        entities.projectName = projectMatch[1];
      }
    }

    // 3. 技术上报意图
    else if (
      lowerContent.includes('安装') ||
      lowerContent.includes('调试') ||
      lowerContent.includes('售后') ||
      lowerContent.includes('维修') ||
      lowerContent.includes('上门')
    ) {
      intent = IntentType.TECH_REPORT;
      confidence = 0.85;

      // 解析服务类型
      if (lowerContent.includes('安装')) {
        entities.serviceType = 'INSTALL';
      } else if (lowerContent.includes('调试')) {
        entities.serviceType = 'DEBUG';
      } else if (lowerContent.includes('售后') || lowerContent.includes('维修')) {
        entities.serviceType = 'AFTER_SALES';
      }

      // 解析数量
      const quantityMatch = content.match(/(\d+)\s*[个套]/);
      if (quantityMatch) {
        entities.quantity = parseInt(quantityMatch[1]);
      }

      // 解析产品名称
      const productMatch = content.match(/(开关|窗帘|门锁|网关|灯|传感器)/);
      if (productMatch) {
        entities.productKeyword = productMatch[1];
      }

      // 解析项目名称
      const projectMatch = content.match(/项目[：:]?\s*(\S+)/);
      if (projectMatch) {
        entities.projectName = projectMatch[1];
      }
    }

    // 4. 项目查询意图
    else if (
      lowerContent.includes('项目') ||
      lowerContent.includes('客户') ||
      lowerContent.includes('合同')
    ) {
      intent = IntentType.PROJECT_QUERY;
      confidence = 0.7;
    }

    // 5. 产品查询意图
    else if (
      lowerContent.includes('产品') ||
      lowerContent.includes('商品') ||
      lowerContent.includes('库存')
    ) {
      intent = IntentType.PRODUCT_QUERY;
      confidence = 0.7;
    }

    // 确定缺失字段
    const missingFields = this.getMissingFields(intent, entities);

    // 生成建议追问
    const suggestedQuestion = this.generateSuggestedQuestion(intent, missingFields, entities);

    return {
      intent,
      confidence,
      entities,
      missingFields,
      suggestedQuestion,
    };
  }

  // 获取缺失的必填字段
  private getMissingFields(intent: IntentType, entities: Record<string, any>): string[] {
    const missing: string[] = [];

    switch (intent) {
      case IntentType.SALES_REPORT:
        if (!entities.amount) missing.push('amount');
        if (!entities.projectName) missing.push('projectName');
        break;

      case IntentType.TECH_REPORT:
        if (!entities.serviceType) missing.push('serviceType');
        if (!entities.quantity) missing.push('quantity');
        if (!entities.projectName) missing.push('projectName');
        break;

      case IntentType.SALARY_QUERY:
        // 工资查询不需要必填字段，默认查本月
        break;
    }

    return missing;
  }

  // 生成建议追问
  private generateSuggestedQuestion(
    intent: IntentType,
    missingFields: string[],
    entities: Record<string, any>,
  ): string | undefined {
    if (missingFields.length === 0) {
      return undefined;
    }

    const questions: string[] = [];

    for (const field of missingFields) {
      switch (field) {
        case 'amount':
          questions.push('金额是多少（元）？');
          break;
        case 'projectName':
          questions.push('关联哪个项目？');
          break;
        case 'serviceType':
          questions.push('这是安装、调试还是售后？');
          break;
        case 'quantity':
          questions.push('数量是多少（个/套）？');
          break;
        case 'productName':
          questions.push('产品名称是什么？');
          break;
      }
    }

    return questions.join('；');
  }

  // 生成表单摘要
  async generateFormSummary(
    intent: IntentType,
    entities: Record<string, any>,
    employeeId: string,
  ): Promise<FormSummaryDto> {
    let formType = '';
    let summary = '';

    switch (intent) {
      case IntentType.SALES_REPORT:
        formType = '销售上报';
        summary = `销售上报：项目"${entities.projectName || '未指定'}"，金额 ${entities.amount || 0} 元`;
        if (entities.discountRate) {
          summary += `，折扣率 ${(entities.discountRate * 10).toFixed(1)} 折`;
        }
        break;

      case IntentType.TECH_REPORT:
        formType = '技术上报';
        const serviceTypeMap: Record<string, string> = {
          INSTALL: '安装',
          DEBUG: '调试',
          AFTER_SALES: '售后',
        };
        summary = `技术上报：${serviceTypeMap[entities.serviceType] || '服务'}，项目"${entities.projectName || '未指定'}"，数量 ${entities.quantity || 0} ${entities.productKeyword || '个/套'}`;
        break;

      case IntentType.SALARY_QUERY:
        formType = '工资查询';
        const year = entities.year || new Date().getFullYear();
        const month = entities.month || new Date().getMonth() + 1;
        summary = `查询 ${year} 年 ${month} 月工资`;
        break;

      default:
        formType = '未知';
        summary = '无法识别的表单类型';
    }

    return {
      formType,
      data: entities,
      summary,
    };
  }

  // 查找候选项目
  async findCandidateProjects(tenantId: string, keyword: string, limit: number = 3) {
    return this.prisma.project.findMany({
      where: {
        tenantId,
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        customerName: true,
      },
    });
  }

  // 查找候选产品
  async findCandidateProducts(tenantId: string, keyword: string, limit: number = 3) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
      },
    });
  }

  // 金额解析：处理中文数字
  parseAmount(text: string): number | null {
    // 处理"五万"、"3.5万"、"50000"等格式
    const patterns = [
      { regex: /(\d+\.?\d*)\s*[万w]/i, multiplier: 10000 },
      { regex: /(\d+\.?\d*)\s*[千k]/i, multiplier: 1000 },
      { regex: /(\d+\.?\d*)\s*百/i, multiplier: 100 },
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        return parseFloat(match[1]) * pattern.multiplier;
      }
    }

    // 纯数字
    const simpleMatch = text.match(/(\d{3,})/);
    if (simpleMatch) {
      return parseFloat(simpleMatch[1]);
    }

    return null;
  }

  // 语音识别容错处理
  correctVoiceInput(text: string): string {
    // 常见语音识别错误纠正
    const corrections: Record<string, string> = {
      '万科': '万科',
      '五万': '50000',
      '十万': '100000',
      '安装': '安装',
      '销售': '销售',
      '工资': '工资',
    };

    let corrected = text;
    for (const [wrong, right] of Object.entries(corrections)) {
      // 简单的模糊匹配，实际应用中可以使用更复杂的算法
      if (this.calculateSimilarity(text, wrong) > 0.7) {
        corrected = corrected.replace(new RegExp(wrong, 'g'), right);
      }
    }

    return corrected;
  }

  // 计算字符串相似度（简单的编辑距离）
  private calculateSimilarity(s1: string, s2: string): number {
    const len = Math.max(s1.length, s2.length);
    if (len === 0) return 1;

    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / len;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }
}
