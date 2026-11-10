// 独立合同上传审核（移植 Flask review_contract）

import { chatJson, mineruParsePdf } from './api'

export type ContractAuditItem = {
  type: string
  title: string
  has_problem: boolean
  problem: string
  suggestion: string
}

const AUDIT_DIMENSIONS = [
  '合同主体信息',
  '合同标的与金额',
  '履约期限',
  '付款条款',
  '验收条款',
  '违约责任',
  '争议解决',
  '合同附件',
]

export async function extractContractText(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<{ text: string; needsOcr: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') {
    const result = await mineruParsePdf(file, undefined, onProgress)
    const trimmed = result.content.trim()
    if (trimmed.length < 100) {
      return { text: trimmed, needsOcr: true }
    }
    return { text: result.content, needsOcr: false }
  }
  if (ext === 'txt' || ext === 'md') {
    return { text: await file.text(), needsOcr: false }
  }
  throw new Error('暂不支持该格式，请上传 PDF 或 TXT 文件')
}

export async function auditUploadedContract(
  contractText: string,
  contractName: string,
): Promise<ContractAuditItem[]> {
  const messages = [
    {
      role: 'system' as const,
      content: `你是政府采购合同审核专家。从以下维度逐项检查，以 JSON 数组返回，不要 markdown 代码块：
${AUDIT_DIMENSIONS.map((d, i) => `${i + 1}. ${d}`).join('\n')}

返回格式：
[{ "type": "维度名", "title": "具体审核项", "has_problem": true/false, "problem": "问题描述", "suggestion": "整改建议" }]`,
    },
    {
      role: 'user' as const,
      content: `请审核合同文件《${contractName}》：\n\n${contractText.slice(0, 8000)}`,
    },
  ]

  const result = await chatJson<ContractAuditItem[]>(messages)
  return Array.isArray(result) ? result : []
}

export async function reviewContractFile(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<{ items: ContractAuditItem[]; needsOcr: boolean; contractName: string }> {
  const { text, needsOcr } = await extractContractText(file, onProgress)
  if (needsOcr && text.length < 100) {
    return { items: [], needsOcr: true, contractName: file.name }
  }
  const items = await auditUploadedContract(text, file.name)
  return { items, needsOcr: false, contractName: file.name }
}
