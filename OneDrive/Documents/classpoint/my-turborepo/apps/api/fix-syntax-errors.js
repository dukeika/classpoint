/**
 * Fix Backend TypeScript Syntax Errors
 * Applies systematic fixes to common error patterns
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to fix
const fixes = [
  // Pattern 1: Remove trailing comma before ]
  {
    name: 'Trailing comma before ]',
    find: /, \]\);/g,
    replace: ']);',
  },
  // Pattern 2: Fix DefaultValuePipe syntax
  {
    name: 'DefaultValuePipe syntax',
    find: /new DefaultValuePipe\((\d+), ParseIntPipe\)/g,
    replace: 'new DefaultValuePipe($1), ParseIntPipe',
  },
  // Pattern 3: Fix Math.ceil trailing comma
  {
    name: 'Math.ceil trailing comma',
    find: /Math\.ceil\(([^)]+), \}/g,
    replace: 'Math.ceil($1)',
  },
  // Pattern 4: Fix new Date trailing comma
  {
    name: 'new Date trailing comma',
    find: /new Date\(([^)]*), ([a-z]+):/g,
    replace: 'new Date($1), $2:',
  },
  // Pattern 5: Fix empty Set/Map
  {
    name: 'Empty Set/Map',
    find: /new (Set|Map)\(, \}\)/g,
    replace: 'new $1()',
  },
  // Pattern 6: Fix toISOString trailing comma
  {
    name: 'toISOString trailing comma',
    find: /\.toISOString\(, \}/g,
    replace: '.toISOString()',
  },
  // Pattern 7: Fix reduce trailing comma
  {
    name: 'Reduce trailing comma',
    find: /}, {} as Record<[^>]+>, \}/g,
    replace: '}, {} as Record<string, any>)',
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
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath} (${fixCount} patterns)`);
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
