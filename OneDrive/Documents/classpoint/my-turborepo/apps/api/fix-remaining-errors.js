/**
 * Fix Remaining Backend TypeScript Errors
 * Handles complex patterns not caught by first pass
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Enhanced patterns to fix
const fixes = [
  // Pattern 1: Fix Promise.all closing brackets
  {
    name: 'Promise.all closing bracket (pattern 1)',
    find: /\},\s*orderBy:([^}]+)\},\s*\},\s*this\.prisma\.([\w]+)\.count\(\{\s*where\s*\}\)\s*\]\);/gs,
    replace: '},\n      orderBy:$1},\n      }),\n      this.prisma.$2.count({ where }),\n    ]);',
  },
  // Pattern 2: Fix Promise.all for findMany with count
  {
    name: 'Promise.all with findMany and count',
    find: /(\s+)\},\s*this\.prisma\.([\w]+)\.count\(\{\s*where\s*\}\)\s*\]\);/g,
    replace: '$1}),\n$1this.prisma.$2.count({ where }),\n$1]);',
  },
  // Pattern 3: Fix null assignments for arm field
  {
    name: 'Null to empty string for arm',
    find: /arm:\s*(\w+)\.arm\s*\|\|\s*null,/g,
    replace: 'arm: $1.arm ?? \'\',',
  },
  // Pattern 4: Fix double count in Promise.all
  {
    name: 'Fix double count in Promise.all',
    find: /this\.prisma\.([\w]+)\.count\(\{\s*where:[^}]+\}\s*\},\s*this\.prisma\.([\w]+)\.count\(\{[^}]+\}\s*\}\s*\]\);/g,
    replace: 'this.prisma.$1.count({ where: { subjectId: id } }),\n      this.prisma.$2.count({ where: { subjectId: id } }),\n    ]);',
  },
  // Pattern 5: Remove startYear and endYear from Session operations (not in Prisma schema)
  {
    name: 'Remove startYear from where clause',
    find: /\{\s*startYear:\s*[^}]+\},?/g,
    replace: '',
  },
  {
    name: 'Remove endYear from where clause',
    find: /\{\s*endYear:\s*[^}]+\},?/g,
    replace: '',
  },
  // Pattern 6: Remove startYear from orderBy
  {
    name: 'Remove startYear from orderBy',
    find: /orderBy:\s*\{\s*startYear:\s*['"]desc['"]\s*\}/g,
    replace: 'orderBy: { startDate: \'desc\' }',
  },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  let fixCount = 0;

  fixes.forEach(fix => {
    const before = content;
    content = content.replace(fix.find, fix.replace);
    if (content !== before) {
      changed = true;
      fixCount++;
      console.log(`  Applied: ${fix.name}`);
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath} (${fixCount} patterns)\n`);
    return true;
  }
  return false;
}

// Find all TypeScript files in src
const files = glob.sync('src/**/*.ts', {
  cwd: __dirname,
  absolute: true,
  ignore: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
});

console.log(`Found ${files.length} TypeScript files\n`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files out of ${files.length} total files`);
