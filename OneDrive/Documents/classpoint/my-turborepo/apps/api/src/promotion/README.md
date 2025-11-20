# Promotion Module - Quick Reference

## Overview
Manual student promotion system for end-of-term class transitions.

## Endpoints

### 1. Preview Promotion
```http
POST /promotions/preview
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "fromTermId": "cm4term123",
  "toTermId": "cm4term456",
  "mappings": [
    {
      "fromClassId": "cm4class-jss1a",
      "toClassId": "cm4class-jss2a",
      "studentIds": ["student1", "student2"]  // Optional
    }
  ]
}
```

**Response:**
```json
{
  "summary": {
    "canProceed": true,
    "totalPromotions": 25,
    "totalConflicts": 0
  },
  "promotions": [...],
  "conflicts": []
}
```

---

### 2. Execute Promotion
```http
POST /promotions/execute
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "fromTermId": "cm4term123",
  "toTermId": "cm4term456",
  "mappings": [...],
  "promotedBy": "cm4user789",
  "force": false,
  "notes": "End of 2024/2025 promotions"
}
```

---

### 3. Student History
```http
GET /promotions/student/:studentId/history
Authorization: Bearer <jwt_token>
```

---

### 4. Term Statistics
```http
GET /promotions/term/:termId/statistics
Authorization: Bearer <jwt_token>
```

---

### 5. Rollback
```http
POST /promotions/rollback/:auditLogId
Authorization: Bearer <jwt_token>

{
  "rolledBackBy": "cm4user789"
}
```

## Roles Required

| Endpoint | Roles |
|----------|-------|
| Preview | SCHOOL_ADMIN, EXAMS_OFFICER |
| Execute | SCHOOL_ADMIN, EXAMS_OFFICER |
| History | SCHOOL_ADMIN, TEACHER, PARENT |
| Statistics | SCHOOL_ADMIN, TEACHER, EXAMS_OFFICER |
| Rollback | SUPER_ADMIN, SCHOOL_ADMIN |

## Common Use Cases

### 1. End-of-Year Promotions
```typescript
// 1. Preview
const preview = await fetch('/promotions/preview', {
  method: 'POST',
  body: JSON.stringify({
    fromTermId: 'term-2024-third',
    toTermId: 'term-2025-first',
    mappings: [
      { fromClassId: 'jss1a', toClassId: 'jss2a' },
      { fromClassId: 'jss1b', toClassId: 'jss2b' }
    ]
  })
});

// 2. Check for conflicts
if (preview.summary.canProceed) {
  // 3. Execute
  await fetch('/promotions/execute', { ... });
}
```

### 2. Selective Promotion
```typescript
// Promote only specific students
const result = await fetch('/promotions/execute', {
  method: 'POST',
  body: JSON.stringify({
    mappings: [{
      fromClassId: 'jss1a',
      toClassId: 'jss2a',
      studentIds: ['student1', 'student2', 'student3']
    }],
    promotedBy: userId
  })
});
```

### 3. Force Promotion (Override Capacity)
```typescript
const result = await fetch('/promotions/execute', {
  method: 'POST',
  body: JSON.stringify({
    ...,
    force: true,  // Override capacity constraints
    notes: 'Emergency promotion approved by principal'
  })
});
```

## Error Handling

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Validation error or conflicts (without force) |
| 404 | Term, class, student, or audit log not found |
| 401 | Unauthorized (no JWT token) |
| 403 | Forbidden (insufficient role) |

## Transaction Safety

All promotions are wrapped in transactions:
- ✅ Atomic: Either all students promoted or none
- ✅ Rollback: Automatic on any error
- ✅ Consistent: No partial state in database

## Audit Trail

Every promotion creates an audit log with:
- Who performed it
- When it happened
- What changed (student list)
- Force flag status
- Admin notes

Retrieve via audit log API or rollback endpoint.

## Best Practices

1. **Always preview first** - Catch issues before execution
2. **Check conflicts** - Review capacity and duplicate warnings
3. **Use notes** - Document why promotion was done
4. **Avoid force mode** - Only use when absolutely necessary
5. **Monitor statistics** - Track promotion rates per class
6. **Test rollback** - Ensure you can reverse if needed

## Testing

```bash
# Run API tests
cd my-turborepo/apps/api
npm test

# Manual testing checklist
# 1. Create terms and classes
# 2. Enroll students
# 3. Preview promotion
# 4. Execute promotion
# 5. Verify enrollments
# 6. Check audit log
# 7. Test rollback
```

## Troubleshooting

### "Promotion has conflicts"
- Check preview response for details
- Fix capacity issues or duplicates
- Or use `force: true` to override

### "Target term must start after source term"
- Verify term dates are correct
- Ensure toTerm starts after fromTerm ends

### "Student already enrolled in target term"
- Student has existing enrollment
- Remove duplicate or skip this student

### Transaction timeout
- Reduce batch size
- Promote in smaller chunks
- Check database performance
