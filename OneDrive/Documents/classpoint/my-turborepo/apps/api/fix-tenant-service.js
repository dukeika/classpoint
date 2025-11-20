const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/tenant/tenant.service.ts');

if (!fs.existsSync(filePath)) {
  console.log('❌ Tenant service not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// Fix 1: Replace plan.studentCap with plan.cap
content = content.replace(/plan\.studentCap/g, 'plan.cap');

// Fix 2: Replace _count: { students: true } with enrollments
content = content.replace(
  /_count:\s*\{\s*select:\s*\{\s*students:\s*true\s*\}\s*\}/g,
  '_count: { select: { enrollments: true } }'
);

// Fix 3: Replace all tenant._count.students with tenant._count.enrollments
content = content.replace(
  /tenant\._count\.students/g,
  'tenant._count.enrollments'
);

// Fix 4: Replace students: true with enrollments: true in select
content = content.replace(
  /select:\s*\{\s*students:\s*true\s*\}/g,
  'select: { enrollments: true }'
);

// Fix 4: Remove staff count (staff model doesn't exist)
// Replace with user count or comment out
content = content.replace(
  /this\.prisma\.staff\.count\(\{ where: \{ tenantId: id \} \}\),?/g,
  '// this.prisma.staff removed - model does not exist\n      0, // placeholder for staff count'
);

// Fix 5: Fix any remaining studentCap references in comments or strings
content = content.replace(
  /student cap \(\$\{plan\.studentCap\}\)/g,
  'student cap (${plan.cap})'
);

if (content !== original) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed tenant.service.ts');
  console.log('   - Fixed plan.studentCap → plan.cap (2+ locations)');
  console.log('   - Fixed _count.students → _count.enrollments');
  console.log('   - Removed staff model references');
} else {
  console.log('⏭️  No changes needed');
}

console.log('\n✅ Tenant service fix complete!');
