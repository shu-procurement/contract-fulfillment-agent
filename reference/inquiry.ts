// 质疑投诉业务逻辑
// 依据：222号第三十四条至第三十六条

import { chatStream } from './api'
import { generateInquiryReplyMessages, generateChallengeReplyMessages, generateComplaintMaterialMessages } from './prompts/inquiry'
import { generateId } from '@/entities/common/model/types'
import type { Inquiry, Challenge, Complaint, ReplyDeadlineCheck, LeakCheckResult } from '@/entities/inquiry/model/types'
import type { TenderDocument } from '@/entities/tender/model/types'

/**
 * AI 生成询问回复（流式）
 */
export async function generateInquiryReply(
  inquiry: Inquiry,
  tenderDoc: TenderDocument,
  onToken?: (token: string) => void,
): Promise<string> {
  const messages = generateInquiryReplyMessages(inquiry, tenderDoc)
  let fullText = ''
  await chatStream(messages, token => { fullText += token; onToken?.(token) })
  return fullText
}

/**
 * AI 生成质疑回复（流式）
 */
export async function generateChallengeReply(
  challenge: Challenge,
  tenderDoc: TenderDocument,
  onToken?: (token: string) => void,
): Promise<string> {
  const messages = generateChallengeReplyMessages(challenge, tenderDoc)
  let fullText = ''
  await chatStream(messages, token => { fullText += token; onToken?.(token) })
  return fullText
}

/**
 * AI 生成投诉处理材料（流式）
 */
export async function generateComplaintMaterial(
  complaint: Complaint,
  context: string,
  onToken?: (token: string) => void,
): Promise<string> {
  const messages = generateComplaintMaterialMessages(complaint, context)
  let fullText = ''
  await chatStream(messages, token => { fullText += token; onToken?.(token) })
  return fullText
}

/**
 * 回复截止日期检查（纯函数）
 * 依据：222号第三十六条 — 收到后7个工作日内回复
 */
export function checkReplyDeadline(receivedDate: string, deadlineDate: string): ReplyDeadlineCheck {
  const received = new Date(receivedDate)
  const deadline = new Date(deadlineDate)

  // 计算工作日差（排除周末）
  let workingDays = 0
  const d = new Date(received)
  d.setHours(0, 0, 0, 0)
  const end = new Date(deadline)
  end.setHours(0, 0, 0, 0)
  while (d < end) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) workingDays++
  }

  const diffMs = deadline.getTime() - Date.now()
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

  return {
    withinDeadline: daysRemaining > 0,
    daysRemaining,
    isOverdue: daysRemaining < 0,
  }
}

/**
 * 保密泄露检查（纯函数）
 * 检查回复内容是否泄露了保密信息
 */
export function validateNoSecretLeak(replyContent: string, confidentialItems: string[]): LeakCheckResult {
  const leakedItems: string[] = []
  for (const item of confidentialItems) {
    if (replyContent.includes(item)) {
      leakedItems.push(item)
    }
  }
  return { hasLeak: leakedItems.length > 0, leakedItems }
}
