# 第 8 章 · 可运行示例

### 1. 合同风险审查

```bash
curl -X POST http://localhost:5001/review_contract \
  -F "file=@samples/采购合同.pdf" \
  -F "contract_name=示例设备采购合同"
```

### 2. 合同一致性比对

```bash
curl -X POST http://localhost:5001/analyze_contracts \
  -H "Content-Type: application/json" \
  -d '{"contract_text": "...", "tender_text": "..."}'
```

### 3. 全链条关联与预览

```bash
curl -X POST http://localhost:5001/full_chain_link -H "Content-Type: application/json" -d '{"project_id": "..."}'
curl "http://localhost:5001/get_linked_preview?project_id=...&step_key=contract_review"
```


> 请把 `samples/` 中的示例文件替换为自己的测试数据；示例数据不含任何真实业务信息。
