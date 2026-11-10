import type { Message } from '../api'
import type { AwardNotice, Contract, ContractSection, ContractConsistencyItem } from '@/entities/contract/model/types'
import type { TenderDocument } from '@/entities/tender/model/types'
import type { EvaluationReport } from '@/entities/evaluation/model/types'

// ── 合同生成 ──
// 依据：222号第二十九条至第三十二条；223号第九条、第十条
export function generateContractMessages(
  awardNotice: AwardNotice,
  tenderDoc: TenderDocument,
  winnerBid: { supplierName: string; price: string; content: string },
): Message[] {
  const contractTemplates = tenderDoc.sections
    .filter(s => s.title.includes('合同条款') || s.title.includes('第四章'))
    .map(s => s.content.slice(0, 2000))
    .join('\n\n')

  const isImport = tenderDoc.projectInfo.isImport
  const contractDeptHint = isImport
    ? '\n注意：本项目为进口货物，合同应由采招办委托具有资质的外贸公司签订（223号第九条），并代办报关等手续。每个进口货物采购项目需签订外贸代理协议。'
    : tenderDoc.projectInfo.projectType === '工程'
      ? '\n注意：工程类合同应由后勤保障部起草（222号第二十九条）。'
      : '\n注意：国产货物、服务合同应由项目需求部门起草（222号第二十九条）。'

  return [
    {
      role: 'system',
      content: `你是中国建设工程合同编制专家，服务于高校采购管理系统。
依据法规：《上海大学采购管理办法》（222号）第二十九条至第三十二条；《进口货物采购实施细则》（223号）第九条、第十条。
重要规则（222号第三十一条）：
1. 合同不得对采购或招标文件确定事项、报价响应文件或投标文件作实质性修改
2. 合同标的、数量、价格、技术参数、交付、验收、付款、质保等内容必须与招标文件、投标文件一致
3. 进口货物外贸合同中，技术参数和配置清单应由项目负责人审核确认，商务条款应由采招办审核确认（223号第十条）
输出 Markdown 格式，每个条款用 ## 标题标记。`,
    },
    {
      role: 'user',
      content: `请根据以下信息生成合同文本：

招标人（甲方）：${tenderDoc.projectInfo.purchaser}
中标人（乙方）：${winnerBid.supplierName}
合同金额：${awardNotice.awardAmount}
项目名称：${tenderDoc.projectInfo.projectName}
实施地点：${tenderDoc.projectInfo.location}
工期要求：${tenderDoc.projectInfo.duration}
需求部门：${tenderDoc.projectInfo.demandDepartment || '待确认'}
${isImport ? '进口货物：是\n外贸代理：需委托具有资质的外贸公司' : ''}
招标文件合同条款参考：
${contractTemplates || '无'}${contractDeptHint}

请生成以下合同条款（每条款200-300字）：
## 一、合同标的
## 二、合同价款与支付方式
## 三、工期与进度
## 四、质量标准与验收
## 五、双方权利义务
## 六、违约责任
## 七、争议解决
## 八、其他条款

注意：
1. 合同内容必须与招标文件和中标人投标文件一致（222号第三十一条）
2. 中标人需提交履约保证金（不超过合同金额10%）
3. 合同签订期限：中标通知书发出后30日内（222号第二十九条）
${isImport ? '4. 需同步生成外贸代理协议材料（223号第九条）' : ''}`,
    },
  ]
}

// ── 合同一致性检查 ──
// 依据：222号第三十一条；223号第十条
export function checkContractConsistencyMessages(
  contract: Contract,
  tenderDoc: TenderDocument,
  winnerBid: { supplierName: string; price: string; content: string },
): Message[] {
  const contractContent = contract.sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n')
  const tenderContent = tenderDoc.sections.map(s => `【${s.title}】\n${s.content.slice(0, 2000)}`).join('\n\n')
  const isImport = tenderDoc.projectInfo.isImport

  return [
    {
      role: 'system',
      content: `你是中国招标采购合同一致性审查专家，服务于高校采购管理系统。
依据法规：《上海大学采购管理办法》（222号）第三十一条；《进口货物采购实施细则》（223号）第十条。
重要规则（222号第三十一条）：
合同不得对采购或招标文件确定事项、报价响应文件或投标文件作实质性修改。
只输出严格 JSON，不要输出其他内容。`,
    },
    {
      role: 'user',
      content: `请逐项对比合同与招标文件/投标文件的一致性：

合同内容：
${contractContent.slice(0, 8000)}

招标文件摘要：
${tenderContent.slice(0, 8000)}

中标人投标报价：${winnerBid.price}
中标人：${winnerBid.supplierName}
${isImport ? '\n本项目为进口货物，需额外检查：技术参数和配置清单是否经项目负责人确认，商务条款是否经采招办确认（223号第十条）' : ''}

请对比以下12个维度，输出 JSON 数组：
[
  {
    "field": "标的/数量/价格/技术参数/配置清单/交付/验收/付款/质保/售后/违约责任/其他",
    "consistent": true/false,
    "contractValue": "合同中的值",
    "tenderValue": "招标文件/投标文件中的值",
    "deviation": "偏差描述（如一致则为空字符串）",
    "severity": "high/medium/low"
  }
]

规则：
1. severity: high=实质性偏离（违法），medium=明显差异，low=轻微差异
2. consistent为true时deviation为空字符串
3. 价格、技术参数、配置清单不一致必须标为high
4. 必须检查全部12个维度`,
    },
  ]
}

export const CONTRACT_PROMPTS = {
  generateContract: generateContractMessages,
  checkContractConsistency: checkContractConsistencyMessages,
}
