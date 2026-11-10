# contract-fulfillment-agent · 履约验收与支付协同

> 《协同采购：人工智能时代政府采购治理变革》**第 8 章**配套开源项目。
> 五章对应五个独立仓库，本仓库聚焦「履约验收与支付协同」场景，clone 后即可按下方步骤复现该章实践案例。

面向财采资一体化闭环的合同、质疑、进口免税与归档协同系统；中标通知书与合同流式生成、合同与招标文件一致性校验、OCR 扫描件解析与八维度风险审查、7 个工作日质疑时限核查。

- **技术栈**：Python 3.9+ / Flask / 百度 OCR / Dify；附 TypeScript 履约算法参考实现
- **服务端口**：5001（Flask Web）
- **许可证**：MIT（见 `LICENSE`）

## 场景能力

1. 中标通知书与合同正文的流式生成及关键字段回填
2. 合同与招标文件、中标结果的一致性校验
3. 扫描件 OCR 混合解析与合同八维度风险审查（主体、价款、期限、验收、违约、争议、签章、附件）
4. 质疑投诉 7 个工作日期限核查与防泄密校验
5. 进口免税专项、3 年监管期与 15 日归档移交、全链条项目状态台账

## 快速开始

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py                              # http://localhost:5001
# reference/ 为算法参考实现，无需安装即可阅读
```

> 所有 API 密钥、数据库口令与签名密钥均通过 `.env` 注入，源码不含真实凭据。
> 复制 `.env.example` 为 `.env` 后填写；`.env` 已被 `.gitignore` 排除，详见 `SECURITY.md`。
>
> **密钥配置（部署前必读）**：完整申请入口、字段表与校验方法见 [docs/密钥配置指南.md](docs/密钥配置指南.md)；
> 复制模板填值后运行 `python3 scripts/check_env.py` 校验，返回 `[OK]` 再启动服务。
> 绝不把 `.env` 提交到 Git，也不要把密钥回填进源码，详见 `SECURITY.md`。

## 本章核心模块

| 路径 | 作用 |
|---|---|
| `app.py` | /review_contract、/analyze_contracts、/full_chain_link |
| `app.py::_get_baidu_ocr_token` | 扫描件 OCR 令牌与 300DPI 识别 |
| `reference/contract.ts` | 中标通知书与合同生成逻辑（TypeScript 参考） |
| `reference/contractAudit.ts` | 合同八维度审查定义 |
| `reference/inquiry.ts` | 质疑时限与工作日计算 |
| `reference/importGoods.ts` | 进口免税与归档移交 |

完整流程、接口参数与演练步骤见 `docs/场景指南.md`；可直接运行的调用示例见 `examples/`。

## 完整部署文档

- `docs/场景指南.md`：本章场景的操作流程、接口示例与验证点
- `docs/`：安装说明、架构说明、规则清单与系统截图说明
- 原系统架构文档位于 `docs/ARCHITECTURE.md`（若适用）

## 安全与数据

请勿把 `.env`、运行日志、业务数据库或含真实供应商信息的文件提交到公开仓库。
涉及合同、发票、投标文件的运行数据应置于校内网络或本地环境。

---

*本项目由本书团队以 MIT 许可证公开发布，欢迎 Issue 与 Pull Request。*
