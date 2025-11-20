/**
 * Comprehensive Backend TypeScript Error Fix Script
 * Fixes all remaining major error patterns systematically
 */

const fs = require('fs');
const glob = require('glob');

const fixes = [
  // 1. Fix DefaultValuePipe syntax in controllers
  {
    name: 'DefaultValuePipe syntax (ParseIntPipe)',
    find: /new DefaultValuePipe\((\d+),\s*ParseIntPipe\)/g,
    replace: 'new DefaultValuePipe($1), ParseIntPipe',
  },

  // 2. Fix new Date() with extra parameters
  {
    name: 'new Date() with trailing params',
    find: /new Date\(([^)]+)\),\s*(\w+):/g,
    replace: 'new Date($1),\n      $2:',
  },

  // 3. Fix empty Set/Map with trailing params
  {
    name: 'Empty Set/Map initialization',
    find: /new (Set|Map)\(\s*,\s*\}/g,
    replace: 'new $1()',
  },

  // 4. Fix toISOString with trailing params
  {
    name: 'toISOString() with trailing params',
    find: /\.toISOString\(\s*,\s*\}/g,
    replace: '.toISOString()',
  },

  // 5. Fix config.get() with extra trailing param
  {
    name: 'ConfigService.get() extra param',
    find: /this\.configService\.get<([^>]+)>\(([^)]+)\),\s*\}/g,
    replace: 'this.configService.get<$1>($2)',
  },
  {
    name: 'ConfigService.get() simpler pattern',
    find: /this\.configService\.get\(([^)]+)\),\s*\}/g,
    replace: 'this.configService.get($1)',
  },

  // 6. Fix Math functions with trailing commas
  {
    name: 'Math functions trailing params',
    find: /Math\.(ceil|max|min)\(([^)]+)\),\s*\}/g,
    replace: 'Math.$1($2)',
  },

  // 7. Fix reduce with extra params
  {
    name: 'Reduce with extra params',
    find: /\},\s*\{\}\s*as\s*Record<([^>]+)>,\s*\}/g,
    replace: '}, {} as Record<$1>)',
  },

  // 8. Fix object literals with trailing issues
  {
    name: 'Object trailing comma cleanup',
    find: /,\s*\}\s*\)/g,
    replace: '})',
  },

  // 9. Fix leading commas in objects
  {
    name: 'Leading comma in object',
    find: /\{\s*,\s*(\w+):/g,
    replace: '{ $1:',
  },

  // 10. Fix Promise.all array structure
  {
    name: 'Promise.all array structure',
    find: /await Promise\.all\(\[\s*([^,\]]+),\s*\]\)/g,
    replace: 'await Promise.all([$1])',
  },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const appliedFixes = [];

  fixes.forEach(fix => {
    const before = content;
    content = content.replace(fix.find, fix.replace);
    if (content !== before) {
      changed = true;
      appliedFixes.push(fix.name);
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    appliedFixes.forEach(name => console.log(`   - ${name}`));
    return true;
  }
  return false;
}

// Find all TypeScript files
const files = glob.sync('src/**/*.ts', {
  cwd: __dirname,
  absolute: true,
  ignore: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
});

console.log(`\n🔍 Scanning ${files.length} TypeScript files...\n`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files out of ${files.length} total`);
console.log(`\n🎯 Run 'pnpm run build' to check remaining errors\n`);
