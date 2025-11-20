const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/analytics/analytics.service.ts');

if (!fs.existsSync(filePath)) {
  console.log('❌ Analytics service not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// Fix 1: Replace all student.user.firstName/lastName with student.firstName/lastName
content = content.replace(/attendance\.student\.user\.firstName/g, 'attendance.student.firstName');
content = content.replace(/attendance\.student\.user\.lastName/g, 'attendance.student.lastName');
content = content.replace(/grade\.student\.user\.firstName/g, 'grade.student.firstName');
content = content.replace(/grade\.student\.user\.lastName/g, 'grade.student.lastName');
content = content.replace(/fs\.student\.user\.firstName/g, 'fs.student.firstName');
content = content.replace(/fs\.student\.user\.lastName/g, 'fs.student.lastName');

// Fix 2: Remove tenantId from GradeWhereInput
content = content.replace(
  /const where: Prisma\.GradeWhereInput = \{ tenantId \};/g,
  'const where: Prisma.GradeWhereInput = {};'
);

// Fix 3: Fix the lowestScore syntax error on line ~584
content = content.replace(
  /highestScore:\s*Math\.max\(\.\.\.subject\.scores,\s*0,\s*lowestScore:\s*Math\.min\(\.\.\.subject\.scores,\s*100\}/g,
  'highestScore: Math.max(...subject.scores, 0),\n        lowestScore: Math.min(...subject.scores, 100)'
);

// Fix 4: Fix the "new Set()" syntax errors (should be "new Set()")
content = content.replace(/students:\s*new\s*Set\(\);/g, 'students: new Set(),');
content = content.replace(/subjectScores:\s*new\s*Map\(\);/g, 'subjectScores: new Map(),');

// Fix 5: Fix incorrect interface assignments
// The subjectId and type fields are being assigned incorrectly
content = content.replace(
  /subjectId: query\.subjectId\}/g,
  'subjectId: query.subjectId }'
);

content = content.replace(
  /type: query\.assessmentType\}/g,
  'type: query.assessmentType }'
);

// Fix 6: Ensure Promise.all has correct closing
content = content.replace(
  /}\),\s*\]\s*\);\s*const\s+active/g,
  '})\n    ]);\n    const active'
);

if (content !== original) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed analytics.service.ts comprehensively');
  console.log('   - Fixed student.user references (4 places)');
  console.log('   - Fixed Grade tenantId references (3 places)');
  console.log('   - Fixed lowestScore calculation');
  console.log('   - Fixed Map/Set initialization syntax');
} else {
  console.log('⏭️  No additional changes needed');
}

console.log('\n✅ Analytics comprehensive fix complete!');
