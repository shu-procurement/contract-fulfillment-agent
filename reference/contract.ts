// M6: 定标与合同管理业务逻辑

import { chatStream, chatJson } from './api'
import { generateContractMessages, checkContractConsistencyMessages } from './prompts/contract'
import { buildSimpleDocx } from './docx'
import { generateId } from '@/entities/common/model/types'
import type { TenderDocument } from '@/entities/tender/model/types'
import type { EvaluationReport, RankingEntry } from '@/entities/evaluation/model/types'
import type {
  AwardNotice, Contract, ContractSection, KeyDeadline,
  ArchiveRecord, ArchiveDocument, ContractConsistencyResult, ContractConsistencyItem,
  DocumentStatusTable, DocumentStatusEntry, ArchiveCatalog, ArchiveCategory,
  TransferChecklist, TransferItem,
} from '@/entities/contract/model/types'

/**
 * 生成中标通知书
 */
export function generateAwardNotice(
  tenderDoc: TenderDocument,
  winner: RankingEntry,
  evaluationReport: EvaluationReport,
): AwardNotice {
  const noticeDate = new Date().toISOString().slice(0, 10)
  // 合同签订期限：中标通知书发出后30日内
  const contractDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  // 履约保证金：不超过合同金额10%
  const performanceBond = Math.round(parseFloat(tenderDoc.projectInfo.budget.replace(/[^0-9.]/g, '')) * 0.1) + '万元'

  return {
    id: generateId(),
    tenderDocumentId: tenderDoc.id,
    winnerId: winner.bidId,
    winnerName: winner.supplierName,
    awardAmount: winner.priceScore + '万元', // 实际应从中标报价获取
    noticeDate,
    contractDeadline,
    performanceBond,
  }
}

/**
 * AI 生成合同文本（流式）
 */
export async function generateContract(
  awardNotice: AwardNotice,
  tenderDoc: TenderDocument,
  winnerBid: { supplierName: string; price: string; content: string },
  onToken?: (token: string) => void,
): Promise<Contract> {
  const messages = generateContractMessages(awardNotice, tenderDoc, winnerBid)
  let fullText = ''
  await chatStream(messages, token => {
    fullText += token
    onToken?.(token)
  })

  // 解析 Markdown 章节为 ContractSection[]
  const sections = parseContractSections(fullText)

  return {
    id: generateId(),
    tenderDocumentId: tenderDoc.id,
    awardNoticeId: awardNotice.id,
    contractNo: `${tenderDoc.projectInfo.projectName.slice(0, 10)}-${new Date().getFullYear()}`,
    partyA: tenderDoc.projectInfo.purchaser,
    partyB: awardNotice.winnerName,
    contractAmount: awardNotice.awardAmount,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + parseInt(tenderDoc.projectInfo.duration) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    sections,
    status: 'draft',
  }
}

/**
 * 法定时间节点提醒
 */
export function getKeyDeadlines(awardNotice: AwardNotice): KeyDeadline[] {
  const now = new Date()
  const contractDeadlineDate = new Date(awardNotice.contractDeadline)
  const daysLeftToSign = Math.ceil((contractDeadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  // 投标保证金退还期限：合同签订后5日内
  const bondReturnDate = new Date(contractDeadlineDate.getTime() + 5 * 24 * 60 * 60 * 1000)
  const daysLeftToReturnBond = Math.ceil((bondReturnDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  return [
    {
      label: '合同签订期限',
      deadline: awardNotice.contractDeadline,
      daysLeft: daysLeftToSign,
      isOverdue: daysLeftToSign < 0,
    },
    {
      label: '投标保证金退还',
      deadline: bondReturnDate.toISOString().slice(0, 10),
      daysLeft: daysLeftToReturnBond,
      isOverdue: daysLeftToReturnBond < 0,
    },
  ]
}

/**
 * 创建归档记录
 */
export function createArchiveRecord(
  tenderDoc: TenderDocument,
  allDocuments: { category: string; fileName: string; filePath: string }[],
): ArchiveRecord {
  return {
    id: generateId(),
    tenderDocumentId: tenderDoc.id,
    documents: allDocuments.map(d => ({
      category: d.category as ArchiveDocument['category'],
      fileName: d.fileName,
      filePath: d.filePath,
    })),
    archivedAt: Date.now(),
    archivedBy: 'system',
  }
}

/**
 * 导出中标通知书为 DOCX
 */
export function exportAwardNoticeDocx(awardNotice: AwardNotice, tenderDoc: TenderDocument): Uint8Array {
  const content = `中标通知书

招标项目：${tenderDoc.projectInfo.projectName}
招标人：${tenderDoc.projectInfo.purchaser}

经评标委员会评审，确定你单位为本项目中标人。

中标人：${awardNotice.winnerName}
中标金额：${awardNotice.awardAmount}

请你单位于 ${awardNotice.contractDeadline} 前与招标人签订合同。
履约保证金金额：${awardNotice.performanceBond}

中标通知书发出日期：${awardNotice.noticeDate}

招标人（盖章）：${tenderDoc.projectInfo.purchaser}
日期：${awardNotice.noticeDate}`

  return buildSimpleDocx('中标通知书', content)
}

/**
 * 导出合同为 DOCX
 */
export function exportContractDocx(contract: Contract): Uint8Array {
  const allContent = contract.sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n')
  const header = `合同编号：${contract.contractNo}

甲方：${contract.partyA}
乙方：${contract.partyB}

合同金额：${contract.contractAmount}
合同期限：${contract.startDate} 至 ${contract.endDate}

`

  return buildSimpleDocx('合同', header + allContent)
}

// ── 辅助函数 ──

const SECTION_PATTERN = /^## (.+)$/

function parseContractSections(text: string): ContractSection[] {
  const lines = text.split('\n')
  const sections: ContractSection[] = []
  let currentTitle = ''
  let currentLines: string[] = []

  for (const line of lines) {
    const match = SECTION_PATTERN.exec(line)
    if (match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() })
      }
      currentTitle = match[1]
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() })
  }

  return sections
}

// ── 合同一致性检查 ──
// 依据：222号第三十一条；223号第十条

export async function checkContractConsistency(
  contract: Contract,
  tenderDoc: TenderDocument,
  winnerBid: { supplierName: string; price: string; content: string },
): Promise<ContractConsistencyResult> {
  const messages = checkContractConsistencyMessages(contract, tenderDoc, winnerBid)
  const items = await chatJson<ContractConsistencyItem[]>(messages)
  const result: ContractConsistencyResult = {
    consistent: items.every(i => i.consistent),
    items,
  }
  if (tenderDoc.projectInfo.isImport) {
    result.importGoodsChecks = {
      technicalParamsConfirmed: false, // 需人工确认
      commercialTermsConfirmed: false, // 需人工确认
    }
  }
  return result
}

// ── 文件状态追踪 ──

const DOCUMENT_NAMES: { name: string; phase: number }[] = [
  { name: '采购需求计划', phase: 1 },
  { name: '采购需求技术文件', phase: 1 },
  { name: '采购实施计划', phase: 1 },
  { name: '项目立项申请材料', phase: 2 },
  { name: '需求论证材料', phase: 2 },
  { name: '技术论证材料', phase: 2 },
  { name: '采购方式判断说明', phase: 3 },
  { name: '招标方案', phase: 4 },
  { name: '招标工作计划', phase: 4 },
  { name: '招标文件', phase: 5 },
  { name: '资格预审文件', phase: 5 },
  { name: '公告', phase: 6 },
  { name: '评审报告', phase: 10 },
  { name: '中标通知书', phase: 10 },
  { name: '合同草案', phase: 12 },
  { name: '归档目录', phase: 14 },
]

export function createDocumentStatusTable(projectId: string): DocumentStatusTable {
  return {
    id: generateId(),
    projectId,
    entries: DOCUMENT_NAMES.map(d => ({
      docName: d.name,
      phase: d.phase,
      status: 'not_started' as const,
    })),
    lastUpdated: Date.now(),
  }
}

export function trackDocumentStatus(
  table: DocumentStatusTable,
  docName: string,
  status: DocumentStatusEntry['status'],
  updatedBy?: string,
): DocumentStatusTable {
  const entries = table.entries.map(e => {
    if (e.docName === docName) {
      const updated: DocumentStatusEntry = { ...e, status }
      if (status === 'approved') { updated.approvedAt = Date.now(); updated.approvedBy = updatedBy }
      if (status === 'in_progress' || status === 'pending_review') { updated.generatedAt = Date.now() }
      if (status === 'filed') { updated.filedAt = Date.now() }
      return updated
    }
    return e
  })
  return { ...table, entries, lastUpdated: Date.now() }
}

export function getDocumentStatus(
  table: DocumentStatusTable,
  docName: string,
): DocumentStatusEntry | undefined {
  return table.entries.find(e => e.docName === docName)
}

// ── 归档补充 ──
// 依据：222号第十一条、第三十三条；223号第二十二条；sdn217第十四条、第十五条

export function generateFullArchiveCatalog(
  tenderDoc: TenderDocument,
  allDocuments: { category: string; fileName: string; filePath: string }[],
): ArchiveCatalog {
  const requiredCategories = ['招标文件', '投标文件', '评标报告', '中标通知', '合同']
  const categories: ArchiveCategory[] = requiredCategories.map(name => ({
    name,
    documents: allDocuments.filter(d => d.category === name).map(d => ({
      category: name as ArchiveDocument['category'],
      fileName: d.fileName,
      filePath: d.filePath,
    })),
    required: true,
  }))
  // 进口货物额外归档
  if (tenderDoc.projectInfo.isImport) {
    const importDocs = ['外贸合同', '报关材料', '征免税确认通知书', '发票', '验收报告']
    categories.push({
      name: '进口货物',
      documents: allDocuments.filter(d => importDocs.some(ic => d.category.includes(ic))).map(d => ({
        category: '合同',
        fileName: d.fileName,
        filePath: d.filePath,
      })),
      required: true,
    })
  }
  const missingItems = categories.filter(c => c.required && c.documents.length === 0).map(c => c.name)
  return {
    id: generateId(),
    tenderDocumentId: tenderDoc.id,
    categories,
    isComplete: missingItems.length === 0,
    missingItems,
  }
}

export function generateMaterialTransferChecklist(tenderDoc: TenderDocument): TransferChecklist {
  const now = new Date()
  const transferDeadline = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const items: TransferItem[] = [
    '招标文件', '投标文件', '评标报告', '中标通知书', '合同',
    '公告', '澄清更正文件', '答疑记录',
  ].map(name => ({ category: '招标采购', documentName: name, prepared: false, transferred: false }))
  if (tenderDoc.projectInfo.isImport) {
    items.push(
      { category: '进口货物', documentName: '外贸代理协议', prepared: false, transferred: false },
      { category: '进口货物', documentName: '外贸合同', prepared: false, transferred: false },
      { category: '进口货物', documentName: '海关征免税确认通知书', prepared: false, transferred: false },
      { category: '进口货物', documentName: '验收报告', prepared: false, transferred: false },
    )
  }
  return {
    id: generateId(),
    tenderDocumentId: tenderDoc.id,
    items,
    transferDeadline,
    isWithinDeadline: true,
  }
}

export function checkImportGoodsArchive(importDocs: {
  bidRecord?: boolean
  tradeAgentAgreement?: boolean
  tradeContract?: boolean
  customsDeclaration?: boolean
  taxExemptionNotice?: boolean
  invoice?: boolean
  acceptanceReport?: boolean
  claimFiles?: boolean
}): { complete: boolean; missing: string[] } {
  const required: { key: keyof typeof importDocs; label: string }[] = [
    { key: 'bidRecord', label: '招标、评标记录' },
    { key: 'tradeAgentAgreement', label: '委托签订外贸合同及代理进口业务协议书' },
    { key: 'tradeContract', label: '外贸合同' },
    { key: 'customsDeclaration', label: '海关进口货物报关材料' },
    { key: 'taxExemptionNotice', label: '海关进出口货物征免税确认通知书' },
    { key: 'invoice', label: '发票复印件' },
    { key: 'acceptanceReport', label: '验收报告' },
  ]
  const missing = required.filter(r => !importDocs[r.key]).map(r => r.label)
  return { complete: missing.length === 0, missing }
}

export function checkTransferDeadline(archiveDate: string, transferDate: string): {
  withinDeadline: boolean
  daysRemaining: number
} {
  const archive = new Date(archiveDate)
  const transfer = new Date(transferDate)
  const diffMs = transfer.getTime() - archive.getTime()
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  return { withinDeadline: daysRemaining <= 15, daysRemaining }
}