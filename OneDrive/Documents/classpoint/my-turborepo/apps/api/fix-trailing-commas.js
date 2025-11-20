/**
 * Fix trailing commas before closing brackets
 */

const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts', {
  cwd: __dirname,
  absolute: true,
  ignore: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
});

console.log(`Checking ${files.length} TypeScript files\n`);

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;

  // Remove trailing commas before closing brackets/parentheses
  content = content.replace(/,\s*\]\s*\)/g, '])');
  content = content.replace(/,\s*\}\s*\)/g, '})');
  content = content.replace(/,\s*\}\s*;/g, '};');

  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files`);
