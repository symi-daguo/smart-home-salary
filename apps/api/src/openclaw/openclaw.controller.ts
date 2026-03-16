import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OpenclawService } from './openclaw.service';
import { VoiceInputDto, ParsedIntentDto, FormSummaryDto } from './dto/voice-input.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('OpenClaw - 语音/文字交互')
@Controller('openclaw')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OpenclawController {
  constructor(private readonly openclawService: OpenclawService) {}

  @Post('parse')
  @ApiOperation({ summary: '解析语音/文字输入，识别意图和实体' })
  async parseIntent(
    @Body() dto: VoiceInputDto,
    @CurrentUser() user: any,
    @CurrentTenant() tenant: any,
  ): Promise<ParsedIntentDto> {
    // 添加租户上下文
    const dtoWithContext = {
      ...dto,
      employeeId: user.id,
      tenantId: tenant.id,
    };
    return this.openclawService.parseIntent(dtoWithContext);
  }

  @Post('summary')
  @ApiOperation({ summary: '生成表单摘要，用于二次确认' })
  async generateSummary(
    @Body() body: { intent: string; entities: Record<string, any> },
    @CurrentUser() user: any,
  ): Promise<FormSummaryDto> {
    return this.openclawService.generateFormSummary(
      body.intent as any,
      body.entities,
      user.id,
    );
  }

  @Post('candidates/projects')
  @ApiOperation({ summary: '查找候选项目' })
  async findCandidateProjects(
    @Body() body: { keyword: string },
    @CurrentTenant() tenant: any,
  ) {
    return this.openclawService.findCandidateProjects(tenant.id, body.keyword);
  }

  @Post('candidates/products')
  @ApiOperation({ summary: '查找候选产品' })
  async findCandidateProducts(
    @Body() body: { keyword: string },
    @CurrentTenant() tenant: any,
  ) {
    return this.openclawService.findCandidateProducts(tenant.id, body.keyword);
  }

  @Post('parse-amount')
  @ApiOperation({ summary: '解析金额（支持中文数字）' })
  async parseAmount(@Body() body: { text: string }) {
    const amount = this.openclawService.parseAmount(body.text);
    return { amount, text: body.text };
  }

  @Post('correct-voice')
  @ApiOperation({ summary: '语音输入纠错' })
  async correctVoiceInput(@Body() body: { text: string }) {
    const corrected = this.openclawService.correctVoiceInput(body.text);
    return { original: body.text, corrected };
  }
}
