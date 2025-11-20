const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/analytics/analytics.service.ts');

if (!fs.existsSync(filePath)) {
  console.log('❌ Analytics service not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// Fix 1: Remove references to non-existent 'session' field in Enrollment
// Replace where.session with where.term
content = content.replace(/where\.session\s*=\s*\{\s*id:\s*query\.sessionId\s*\}/g, 'where.term = { id: query.sessionId }');
content = content.replace(/session:\s*\{\s*id:\s*query\.sessionId\s*\}/g, 'term: { id: query.sessionId }');

// Fix 2: Replace enrolledAt with createdAt (Enrollment doesn't have enrolledAt)
content = content.replace(/where\.enrolledAt/g, 'where.createdAt');
content = content.replace(/select:\s*\{\s*enrolledAt:\s*true\s*\}/g, 'select: { createdAt: true }');
content = content.replace(/orderBy:\s*\{\s*enrolledAt:/g, 'orderBy: { createdAt:');
content = content.replace(/enrollment\.enrolledAt/g, 'enrollment.createdAt');

// Fix 3: Remove tenantId from Attendance where clause (not in schema)
content = content.replace(/const where: Prisma\.AttendanceWhereInput = \{ tenantId \};/g, 'const where: Prisma.AttendanceWhereInput = {};');

// Fix 4: Remove 'user' include from Student (doesn't exist)
content = content.replace(/user:\s*true,/g, '// user removed - not in schema');

// Fix 5: Fix the malformed reduce expression on line 102
content = content.replace(
  /\(sum, c\) => sum \+ \(c\.capacity \|\| 0, 0\s*\);/g,
  '(sum, c) => sum + (c.capacity || 0),\n      0\n    );'
);

// Fix 6: Add enrollments include to class queries
content = content.replace(
  /this\.prisma\.class\.findMany\(\{(\s+)where: query\.sessionId/g,
  'this.prisma.class.findMany({$1where: query.sessionId'
);

// Fix 7: For analytics methods that need enrollments count, add the include
const includeEnrollments = `
        include: {
          enrollments: true,
        },`;

// Find the classAnalytics method and add enrollments include
content = content.replace(
  /(async getClassAnalytics[\s\S]*?this\.prisma\.class\.findMany\(\{[\s\S]*?where,)/,
  function(match) {
    if (match.indexOf('include:') === -1) {
      return match + includeEnrollments;
    }
    return match;
  }
);

// Fix 8: Fix Promise.all syntax in analytics
content = content.replace(
  /this\.prisma\.enrollment\.count\(\{ where \}, this\.prisma\.enrollment\.findMany\(\{/g,
  'this.prisma.enrollment.count({ where }),\n      this.prisma.enrollment.findMany({'
);

content = content.replace(
  /}\),\s*\]\s*\);(\s+)const activeEnrollments/g,
  '})\n    ]);\n$1const activeEnrollments'
);

if (content !== original) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed analytics.service.ts');
} else {
  console.log('⏭️  No changes needed');
}

console.log('\n✅ Analytics service fix complete!');
