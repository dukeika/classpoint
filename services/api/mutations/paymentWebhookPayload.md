Example payment webhook payload to emit to EventBridge (after signature verification):
```json
{
  "provider": "paystack",
  "schoolId": "SCH-123",
  "invoiceId": "INV-456",
  "amount": 10000,
  "reference": "REF-789",
  "raw": { "gatewayPayload": "..." }
}
```

Enqueue Messaging job payload (example):
```json
{
  "schoolId": "SCH-123",
  "recipientId": "REC-1",
  "templateId": "TPL-1",
  "parentId": "PARENT-1",
  "studentId": "STU-1",
  "amountDue": "10000",
  "dueDate": "2025-01-31",
  "invoiceLink": "https://school.classpoint.ng/invoices/INV-456",
  "channel": "WHATSAPP",
  "provider": "default"
}
```
