const fs = require('fs');
const path = require('path');

const files = [
  'src/contact/contact.controller.ts',
  'src/contact/contact.service.ts',
  'src/contact/dto/contact-response.dto.ts',
  'src/tenant/tenant.controller.ts',
  'src/tenant/tenant.service.ts',
  'src/tenant/dto/tenant-response.dto.ts',
  'src/calendar/reminder.service.ts',
  'src/resources/assignment.service.ts',
  'src/integration/integration.controller.ts',
  'src/calendar/calendar.controller.ts',
  'src/calendar/calendar.service.ts',
  'src/resources/resource.controller.ts',
  'src/resources/assignment.controller.ts',
  'src/resources/resource.service.ts',
  'src/analytics/analytics.controller.ts',
  'src/analytics/analytics.service.ts',
  'src/analytics/dto/fee-status-report.dto.ts',
  'src/analytics/dto/performance-metrics.dto.ts',
  'src/analytics/dto/attendance-report.dto.ts',
  'src/academic/class.service.ts',
  'src/promotion/promotion.service.ts',
  'src/plan/plan.service.ts',
  'src/fee-status/fee-status.service.ts',
  'src/external-report/external-report.service.ts',
  'src/enrollment/enrollment.service.ts',
  'src/attendance/attendance.service.ts',
  'src/assessment/assessment.service.ts',
  'src/announcement/announcement.service.ts',
  'src/academic/term.service.ts',
  'src/academic/subject.service.ts',
  'src/academic/session.service.ts',
  'src/academic/department.service.ts',
  'src/promotion/promotion.controller.ts',
  'src/plan/dto/plan-response.dto.ts',
  'src/fee-status/fee-status.controller.ts',
  'src/fee-status/dto/create-fee-status.dto.ts',
  'src/fee-status/dto/bulk-update-fee-status.dto.ts',
  'src/external-report/external-report.controller.ts',
  'src/enrollment/enrollment.controller.ts',
  'src/comment/comment.service.ts',
  'src/comment/comment.controller.ts',
  'src/cms/services/news.service.ts',
  'src/cms/services/gallery.service.ts',
  'src/cms/services/event.service.ts',
  'src/cms/services/branding.service.ts',
  'src/cms/dto/news.dto.ts',
  'src/cms/controllers/news.controller.ts',
  'src/cms/controllers/gallery.controller.ts',
  'src/cms/controllers/event.controller.ts',
  'src/cms/controllers/branding.controller.ts',
  'src/attendance/dto/create-attendance.dto.ts',
  'src/attendance/dto/bulk-attendance.dto.ts',
  'src/attendance/attendance.controller.ts',
  'src/assessment/dto/create-assessment.dto.ts',
  'src/assessment/assessment.controller.ts',
  'src/announcement/dto/update-announcement.dto.ts',
  'src/announcement/dto/create-announcement.dto.ts',
  'src/announcement/announcement.controller.ts',
  'src/academic/term.controller.ts',
  'src/academic/subject.controller.ts',
  'src/academic/session.controller.ts',
  'src/academic/department.controller.ts',
  'src/academic/class.controller.ts',
];

let totalFiles = 0;
let totalReplacements = 0;

files.forEach((file) => {
  const filePath = path.join(__dirname, file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace @prisma/client imports with @classpoint/db
    content = content.replace(/from '@prisma\/client'/g, "from '@classpoint/db'");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/from '@prisma\/client'/g) || []).length;
      totalReplacements += count;
      totalFiles++;
      console.log(`✅ Fixed ${file} (${count} replacement${count > 1 ? 's' : ''})`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log(`\n✨ Done! Fixed ${totalFiles} files with ${totalReplacements} total replacements.`);
