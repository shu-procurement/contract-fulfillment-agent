// 进口货物采购业务逻辑
// 依据：223号

import { chatStream } from './api'
import {
  generateTradeAgencyAgreementMessages, generateTechnicalProtocolMessages,
  generateTradeContractMessages, generateTechnicalConfirmationMessages,
  generateCommercialConfirmationMessages, generatePaymentNoticeMessages,
  generateTaxExemptionReportMessages, generateTaxExemptionApplicationMessages,
  generateAcceptanceReportMessages, generateSettlementListMessages,
  generateRepairRequestMessages, generateClaimDocumentMessages,
  generateCustomsSupervisionNoticeMessages,
} from './prompts/importGoods'
import type { Message } from './api'
import { generateId } from '@/entities/common/model/types'
import type { ImportGoodsDocType, ImportGoodsDocument } from '@/entities/procurement/model/types'
import type { StructuredDemand } from '@/entities/demand/model/types'

/**
 * 通用文书生成器（流式）
 */
async function generateImportDoc(
  docType: ImportGoodsDocType,
  demand: StructuredDemand,
  messagesBuilder: (d: StructuredDemand) => Message[],
  onToken?: (token: string) => void,
): Promise<ImportGoodsDocument> {
  const messages = messagesBuilder(demand)
  let fullText = ''
  await chatStream(messages, token => { fullText += token; onToken?.(token) })
  return {
    id: generateId(),
    projectId: demand.projectName,
    docType,
    title: '',
    content: fullText,
    generatedAt: Date.now(),
  }
}

export async function generateTradeAgencyAgreement(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('trade_agency_agreement', demand, generateTradeAgencyAgreementMessages, onToken)
}
export async function generateTechnicalProtocol(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('technical_protocol', demand, generateTechnicalProtocolMessages, onToken)
}
export async function generateTradeContractDoc(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('trade_contract', demand, generateTradeContractMessages, onToken)
}
export async function generateTechnicalConfirmation(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('technical_confirmation', demand, generateTechnicalConfirmationMessages, onToken)
}
export async function generateCommercialConfirmation(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('commercial_confirmation', demand, generateCommercialConfirmationMessages, onToken)
}
export async function generatePaymentNotice(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('payment_notice', demand, generatePaymentNoticeMessages, onToken)
}
export async function generateTaxExemptionReport(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('tax_exemption_report', demand, generateTaxExemptionReportMessages, onToken)
}
export async function generateTaxExemptionApplication(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('tax_exemption_application', demand, generateTaxExemptionApplicationMessages, onToken)
}
export async function generateAcceptanceReport(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('acceptance_report', demand, generateAcceptanceReportMessages, onToken)
}
export async function generateSettlementList(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('settlement_list', demand, generateSettlementListMessages, onToken)
}
export async function generateRepairRequest(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('repair_request', demand, generateRepairRequestMessages, onToken)
}
export async function generateClaimDocument(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('claim_document', demand, generateClaimDocumentMessages, onToken)
}
export async function generateCustomsSupervisionNotice(demand: StructuredDemand, onToken?: (token: string) => void) {
  return generateImportDoc('customs_supervision_notice', demand, generateCustomsSupervisionNoticeMessages, onToken)
}

// ── 纯函数：进口货物业务规则校验 ──

/**
 * 验收期限检查（223号第十九条）
 * 到货后60日内完成验收
 */
export function checkAcceptanceWithin60Days(deliveryDate: string, acceptanceDate: string): {
  withinDeadline: boolean
  daysUsed: number
} {
  const delivery = new Date(deliveryDate)
  const acceptance = new Date(acceptanceDate)
  const diffMs = acceptance.getTime() - delivery.getTime()
  const daysUsed = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  return { withinDeadline: daysUsed <= 60, daysUsed }
}

/**
 * 海关监管期计算（223号第二十九条）
 * 进口货物海关监管期为3年
 */
export function calculateSupervisionPeriod(deliveryDate: string): {
  startDate: string
  endDate: string
  isWithinSupervision: boolean
} {
  const start = new Date(deliveryDate)
  const end = new Date(start.getTime() + 3 * 365 * 24 * 60 * 60 * 1000)
  const now = new Date()
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    isWithinSupervision: now < end,
  }
}

/**
 * 产权变更审批检查（223号第三十三条）
 * 监管期内不得擅自转让、移作他用
 */
export function checkPropertyChangeApproval(isWithinSupervision: boolean, hasApproval: boolean): {
  canChange: boolean
  reason: string
} {
  if (!isWithinSupervision) return { canChange: true, reason: '已过监管期' }
  if (hasApproval) return { canChange: true, reason: '已获审批' }
  return { canChange: false, reason: '223号第三十三条：监管期内未经批准不得擅自转让、移作他用或移出学校' }
}

/**
 * 异地使用审批检查（223号第三十五条）
 */
export function checkOffsiteUseApproval(isWithinSupervision: boolean, hasApproval: boolean): {
  canUse: boolean
  reason: string
} {
  if (!isWithinSupervision) return { canUse: true, reason: '已过监管期' }
  if (hasApproval) return { canUse: true, reason: '已获审批' }
  return { canUse: false, reason: '223号第三十五条：监管期内移出学校使用需经审批' }
}
