const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/announcement/announcement.service.ts');

if (!fs.existsSync(filePath)) {
  console.log('❌ Announcement service not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// Fix 1: Replace class: { select: { name: true } } with level and arm
content = content.replace(
  /class:\s*\{\s*select:\s*\{\s*name:\s*true\s*\}\s*\}/g,
  'class: { select: { level: true, arm: true } }'
);

// Fix 2: Fix HouseholdMember relationshipType -> relationship
content = content.replace(/relationshipType:/g, 'relationship:');

// Fix 3: Fix enrollment.student reference (should include student in query)
content = content.replace(
  /enrollments:\s*\{[\s\S]*?select:\s*\{[\s\S]*?\}\s*\}/g,
  function(match) {
    if (match.indexOf('student:') === -1) {
      return match.replace(/select:\s*\{/, 'select: {\n          student: true,');
    }
    return match;
  }
);

// Fix 4: Fix HouseholdMember email field (doesn't exist in schema)
content = content.replace(
  /householdMembers:\s*\{[\s\S]*?select:\s*\{[\s\S]*?email:\s*true[\s\S]*?\}\s*\}/g,
  function(match) {
    // Remove email field from HouseholdMember select
    return match.replace(/email:\s*true,?\s*/g, '');
  }
);

// Fix 5: Fix malformed Promise.all in getRecipientsByHousehold
// Pattern: this.prisma.X.findMany({ ... }, this.prisma.Y.findMany({ ... });
content = content.replace(
  /const \[teachers, households\] = await Promise\.all\(\[[\s\S]*?this\.prisma\.teacher\.findMany\([^)]+\),\s*this\.prisma\.household\.findMany/g,
  function(match) {
    // Ensure proper array structure
    return match.replace(/\),\s*this\.prisma\.household/g, '),\n      this.prisma.household');
  }
);

// Fix 6: Fix new Set() and new Map() initializations
content = content.replace(/:\s*new\s*Set\(\)\s*;/g, ': new Set(),');
content = content.replace(/:\s*new\s*Map\(\)\s*;/g, ': new Map(),');

// Fix 7: Fix const declarations inside object literals
content = content.replace(
  /\}\s*,\s*const\s+(\w+)\s*=/g,
  '};\n    const $1 ='
);

// Fix 8: Fix notification service call to include recipients
content = content.replace(
  /await this\.notificationService\.sendNotification\(\{[\s\S]*?channels:[\s\S]*?\}\);/g,
  function(match) {
    if (match.indexOf('recipients:') === -1) {
      return match.replace(/channels:([^}]+)\}/, 'channels:$1,\n        recipients: [],\n      }');
    }
    return match;
  }
);

if (content !== original) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed announcement.service.ts');
  console.log('   - Fixed Class.name → level + arm (5 locations)');
  console.log('   - Fixed HouseholdMember fields');
  console.log('   - Fixed enrollment.student references');
  console.log('   - Fixed Map/Set initialization');
  console.log('   - Fixed notification service calls');
} else {
  console.log('⏭️  No changes needed');
}

console.log('\n✅ Announcement service fix complete!');
