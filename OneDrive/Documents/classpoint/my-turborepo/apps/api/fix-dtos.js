const fs = require('fs');
const path = require('path');

const dtoFiles = [
  'src/academic/dto/create-class.dto.ts',
  'src/academic/dto/create-department.dto.ts',
  'src/academic/dto/create-session.dto.ts',
  'src/academic/dto/create-subject.dto.ts',
  'src/academic/dto/create-term.dto.ts',
  'src/academic/dto/update-class.dto.ts',
  'src/academic/dto/update-department.dto.ts',
  'src/academic/dto/update-session.dto.ts',
  'src/academic/dto/update-subject.dto.ts',
  'src/academic/dto/update-term.dto.ts',
  'src/assessment/dto/bulk-grades.dto.ts',
  'src/assessment/dto/create-grade.dto.ts',
  'src/attendance/dto/update-attendance.dto.ts',
  'src/auth/dto/auth-response.dto.ts',
  'src/auth/dto/login.dto.ts',
  'src/auth/dto/refresh-token.dto.ts',
  'src/auth/dto/register.dto.ts',
  'src/cms/dto/branding.dto.ts',
  'src/cms/dto/event.dto.ts',
  'src/cms/dto/gallery.dto.ts',
  'src/comment/dto/create-comment.dto.ts',
  'src/comment/dto/update-comment.dto.ts',
  'src/enrollment/dto/bulk-enroll.dto.ts',
  'src/enrollment/dto/create-enrollment.dto.ts',
  'src/enrollment/dto/update-enrollment.dto.ts',
  'src/external-report/dto/create-external-report.dto.ts',
  'src/external-report/dto/generate-presigned-url.dto.ts',
  'src/external-report/dto/update-external-report.dto.ts',
  'src/fee-status/dto/update-fee-status.dto.ts',
  'src/plan/dto/create-plan.dto.ts',
  'src/plan/dto/update-plan.dto.ts',
  'src/promotion/dto/execute-promotion.dto.ts',
  'src/promotion/dto/promotion-preview.dto.ts',
  'src/tenant/dto/create-tenant.dto.ts',
  'src/tenant/dto/update-tenant.dto.ts',
  'src/analytics/dto/enrollment-analytics.dto.ts',
  'src/resources/dto/update-assignment.dto.ts',
  'src/resources/dto/create-submission.dto.ts',
  'src/resources/dto/update-resource.dto.ts',
  'src/calendar/dto/calendar-query.dto.ts',
  'src/integration/dto/export.dto.ts',
  'src/integration/dto/import.dto.ts',
  'src/calendar/dto/create-reminder.dto.ts',
  'src/resources/dto/create-assignment.dto.ts',
  'src/resources/dto/create-resource.dto.ts',
  'src/resources/dto/upload-url.dto.ts',
  'src/contact/dto/create-contact.dto.ts',
  'src/contact/dto/contact-response.dto.ts',
  'src/tenant/dto/tenant-response.dto.ts',
  'src/analytics/dto/fee-status-report.dto.ts',
  'src/analytics/dto/performance-metrics.dto.ts',
  'src/analytics/dto/attendance-report.dto.ts',
  'src/plan/dto/plan-response.dto.ts',
  'src/fee-status/dto/create-fee-status.dto.ts',
  'src/fee-status/dto/bulk-update-fee-status.dto.ts',
  'src/cms/dto/news.dto.ts',
  'src/attendance/dto/create-attendance.dto.ts',
  'src/attendance/dto/bulk-attendance.dto.ts',
  'src/assessment/dto/create-assessment.dto.ts',
  'src/announcement/dto/update-announcement.dto.ts',
  'src/announcement/dto/create-announcement.dto.ts',
];

let totalFiles = 0;
let totalFixes = 0;

dtoFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileFixCount = 0;

    // Fix property declarations that need definite assignment assertion
    // Pattern: property name followed by colon and type, but NOT already having !, ?, or =
    // This regex matches lines like:  propertyName: Type;
    const lines = content.split('\n');
    const fixedLines = lines.map((line) => {
      // Match property declarations: "  propertyName: Type;" (with decorators above)
      // Skip if already has !, ?, or =
      const propertyMatch = line.match(/^(\s+)(\w+):\s*([^;=?!]+);?\s*$/);

      if (propertyMatch && !line.includes('!') && !line.includes('?') && !line.includes('=')) {
        // Check if previous lines have @IsOptional decorator
        const lineIndex = lines.indexOf(line);
        const previousLines = lines.slice(Math.max(0, lineIndex - 5), lineIndex);
        const hasIsOptional = previousLines.some(l => l.includes('@IsOptional'));

        if (hasIsOptional) {
          // Make it optional with ?
          const [, indent, propName, type] = propertyMatch;
          fileFixCount++;
          return `${indent}${propName}?: ${type.trim()};`;
        } else {
          // Add definite assignment assertion !
          const [, indent, propName, type] = propertyMatch;
          fileFixCount++;
          return `${indent}${propName}!: ${type.trim()};`;
        }
      }

      return line;
    });

    content = fixedLines.join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixes += fileFixCount;
      totalFiles++;
      console.log(`✅ Fixed ${file} (${fileFixCount} properties)`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log(`\n✨ Done! Fixed ${totalFiles} files with ${totalFixes} property declarations.`);
