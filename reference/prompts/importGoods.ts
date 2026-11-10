import type { Message } from '../api'
import type { StructuredDemand } from '@/entities/demand/model/types'
import type { ImportGoodsDocType } from '@/entities/procurement/model/types'

const DOC_TITLES: Record<ImportGoodsDocType, string> = {
  trade_agency_agreement: '外贸代理协议',
  technical_protocol: '技术协议',
  trade_contract: '外贸合同',
  technical_confirmation: '技术确认书',
  commercial_confirmation: '商务确认书',
  payment_notice: '付款通知',
  tax_exemption_report: '免税报告',
  tax_exemption_application: '免税申请表',
  acceptance_report: '验收报告',
  settlement_list: '结算清单',
  repair_request: '维修申请',
  claim_document: '索赔文件',
  customs_supervision_notice: '监管期提示单',
}

function baseImportMessages(demand: StructuredDemand): { system: string; context: string } {
  const system = `你是中国高校进口货物采购管理专家。
依据法规：《上海大学进口货物采购实施细则》（223号）。
请根据进口货物采购信息生成相应文书。
输出 Markdown 格式。`
  const context = `项目名称：${demand.projectName}
项目类型：${demand.projectType}
预算金额：${demand.budget}
技术规格：${demand.technicalSpecs || '待补充'}
采购需求部门：${demand.demandDepartment || '待确认'}
项目负责人：${demand.projectManager || '待确认'}
${demand.importGoodsDetails ? `批次总额：${demand.importGoodsDetails.batchTotal || ''}
是否国家规定招标范围：${demand.importGoodsDetails.isNationalMandatory ? '是' : '否'}` : ''}`
  return { system, context }
}

export function generateTradeAgencyAgreementMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第九条。' },
    { role: 'user', content: `请根据以下信息生成外贸代理协议（223号第九条）：

${context}

请生成外贸代理协议，包含委托范围、双方权利义务、费用分担、违约责任等条款。` },
  ]
}

export function generateTechnicalProtocolMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system },
    { role: 'user', content: `请根据以下信息生成技术协议：

${context}

请生成技术协议，包含技术参数、配置清单、验收标准等。` },
  ]
}

export function generateTradeContractMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第九条、第十条。技术参数和配置清单需项目负责人确认，商务条款需采招办确认。' },
    { role: 'user', content: `请根据以下信息生成外贸合同（223号第九条、第十条）：

${context}

请生成外贸合同，注意技术参数和配置清单需经项目负责人审核确认，商务条款需经采招办审核确认。` },
  ]
}

export function generateTechnicalConfirmationMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第十条。' },
    { role: 'user', content: `请根据以下信息生成技术确认书（223号第十条）：

${context}

请生成技术确认书模板，供项目负责人审核确认技术参数和配置清单。` },
  ]
}

export function generateCommercialConfirmationMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第十条。' },
    { role: 'user', content: `请根据以下信息生成商务确认书（223号第十条）：

${context}

请生成商务确认书模板，供采招办审核确认商务条款。` },
  ]
}

export function generatePaymentNoticeMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system },
    { role: 'user', content: `请根据以下信息生成付款通知：

${context}

请生成付款通知，包含付款金额、付款方式、收款方信息等。` },
  ]
}

export function generateTaxExemptionReportMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第二十二条。' },
    { role: 'user', content: `请根据以下信息生成免税报告（223号第二十二条）：

${context}

请生成免税报告，包含设备用途、科研必要性、免税依据等。` },
  ]
}

export function generateTaxExemptionApplicationMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第二十二条。' },
    { role: 'user', content: `请根据以下信息生成免税申请表（223号第二十二条）：

${context}

请生成免税申请表模板。` },
  ]
}

export function generateAcceptanceReportMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第十九条。验收应在到货后60日内完成。' },
    { role: 'user', content: `请根据以下信息生成验收报告（223号第十九条）：

${context}

请生成验收报告模板，包含验收标准、验收人员、验收结论等。` },
  ]
}

export function generateSettlementListMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system },
    { role: 'user', content: `请根据以下信息生成结算清单：

${context}

请生成结算清单模板，包含设备清单、金额汇总、税费明细等。` },
  ]
}

export function generateRepairRequestMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第二十八条。' },
    { role: 'user', content: `请根据以下信息生成维修申请（223号第二十八条）：

${context}

请生成维修申请模板，包含故障描述、维修方案、费用预算等。` },
  ]
}

export function generateClaimDocumentMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system },
    { role: 'user', content: `请根据以下信息生成索赔文件：

${context}

请生成索赔文件模板，包含索赔事由、索赔金额、证据材料等。` },
  ]
}

export function generateCustomsSupervisionNoticeMessages(demand: StructuredDemand): Message[] {
  const { system, context } = baseImportMessages(demand)
  return [
    { role: 'system', content: system + '\n依据：223号第二十九条。进口货物海关监管期为3年。' },
    { role: 'user', content: `请根据以下信息生成监管期提示单（223号第二十九条）：

${context}

请生成监管期提示单，提醒设备处于海关监管期内，未经批准不得擅自转让、移作他用或移出学校。` },
  ]
}

export const IMPORT_GOODS_DOC_TITLES = DOC_TITLES

export const IMPORT_GOODS_PROMPTS = {
  generateTradeAgencyAgreement: generateTradeAgencyAgreementMessages,
  generateTechnicalProtocol: generateTechnicalProtocolMessages,
  generateTradeContract: generateTradeContractMessages,
  generateTechnicalConfirmation: generateTechnicalConfirmationMessages,
  generateCommercialConfirmation: generateCommercialConfirmationMessages,
  generatePaymentNotice: generatePaymentNoticeMessages,
  generateTaxExemptionReport: generateTaxExemptionReportMessages,
  generateTaxExemptionApplication: generateTaxExemptionApplicationMessages,
  generateAcceptanceReport: generateAcceptanceReportMessages,
  generateSettlementList: generateSettlementListMessages,
  generateRepairRequest: generateRepairRequestMessages,
  generateClaimDocument: generateClaimDocumentMessages,
  generateCustomsSupervisionNotice: generateCustomsSupervisionNoticeMessages,
}
