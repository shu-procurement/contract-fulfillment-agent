import type { Message } from '../api'
import type { Inquiry, Challenge, Complaint } from '@/entities/inquiry/model/types'
import type { TenderDocument } from '@/entities/tender/model/types'

// ── 询问回复 ──
// 依据：222号第三十四条
export function generateInquiryReplyMessages(inquiry: Inquiry, tenderDoc: TenderDocument): Message[] {
  return [
    {
      role: 'system',
      content: `你是中国高校采购管理系统的询问回复专家。
依据法规：《上海大学采购管理办法》（222号）第三十四条。
回复应客观、准确、及时，不得泄露其他供应商的商业秘密。
输出 Markdown 格式。`,
    },
    {
      role: 'user',
      content: `请为以下询问起草回复（222号第三十四条）：

项目名称：${tenderDoc.projectInfo.projectName}
招标人：${tenderDoc.projectInfo.purchaser}

询问人：${inquiry.questionFrom}
询问内容：${inquiry.questionContent}
收到日期：${inquiry.receivedDate}
回复期限：${inquiry.replyDeadline}

请起草专业、准确的回复，注意：
1. 回复内容仅针对询问人提出的问题
2. 不得泄露其他供应商的商业秘密
3. 回复应在法定期限内完成
4. 如涉及招标文件修改，应通过公告方式通知所有投标人`,
    },
  ]
}

// ── 质疑回复 ──
// 依据：222号第三十六条
export function generateChallengeReplyMessages(challenge: Challenge, tenderDoc: TenderDocument): Message[] {
  const typeMap: Record<string, string> = {
    tender_doc: '招标文件',
    evaluation_result: '评标结果',
    award_result: '中标结果',
    other: '其他',
  }
  return [
    {
      role: 'system',
      content: `你是中国高校采购管理系统的质疑回复专家。
依据法规：《上海大学采购管理办法》（222号）第三十六条。
质疑回复须经采招办审查同意后方可发出。
输出 Markdown 格式。`,
    },
    {
      role: 'user',
      content: `请为以下质疑起草回复（222号第三十六条）：

项目名称：${tenderDoc.projectInfo.projectName}
招标人：${tenderDoc.projectInfo.purchaser}

质疑人：${challenge.challengerName}
质疑类型：${typeMap[challenge.challengeType] || challenge.challengeType}
质疑内容：${challenge.challengeContent}
收到日期：${challenge.receivedDate}
回复期限：${challenge.replyDeadline}
采招办审批状态：${challenge.procurementOfficeApproved ? '已审批' : '待审批'}

请起草回复，注意：
1. 回复须经采招办审查同意后方可发出
2. 回复应在收到质疑后7个工作日内完成
3. 如质疑成立，应说明纠正措施
4. 如质疑不成立，应说明理由和法律依据`,
    },
  ]
}

// ── 投诉材料 ──
// 依据：政府采购法
export function generateComplaintMaterialMessages(complaint: Complaint, context: string): Message[] {
  return [
    {
      role: 'system',
      content: `你是中国高校采购管理系统的投诉处理材料生成专家。
依据法规：《中华人民共和国政府采购法》相关规定。
投诉处理材料应完整、规范，包含投诉事项、调查情况、处理意见。
输出 Markdown 格式。`,
    },
    {
      role: 'user',
      content: `请根据以下投诉信息生成投诉处理材料：

投诉人：${complaint.complainantName}
投诉内容：${complaint.complaintContent}
投诉类型：${complaint.complaintType}
收到日期：${complaint.receivedDate}
状态：${complaint.status}

背景信息：
${context}

请生成投诉处理材料，包含：
## 一、投诉基本信息
## 二、投诉事项
## 三、调查情况
## 四、处理意见
## 五、法律依据`,
    },
  ]
}

export const INQUIRY_PROMPTS = {
  generateInquiryReply: generateInquiryReplyMessages,
  generateChallengeReply: generateChallengeReplyMessages,
  generateComplaintMaterial: generateComplaintMaterialMessages,
}
