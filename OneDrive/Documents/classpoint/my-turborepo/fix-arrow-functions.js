const fs = require('fs');
const path = require('path');

function findServiceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        findServiceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.service.ts') || file.endsWith('.controller.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const apiSrcDir = path.join(process.cwd(), 'apps', 'api', 'src');
const files = findServiceFiles(apiSrcDir);

console.log(`Found ${files.length} files to fix`);

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  // Fix broken arrow function syntax from previous script
  // Pattern: (sum) , c) => should be (sum, c) =>
  content = content.replace(/\((\w+)\)\s*,\s*(\w+)\)/g, '($1, $2)');

  // Fix: (data) : any) => should be (data): any =>
  content = content.replace(/\((\w+)\)\s*:\s*any\)\s*=>/g, '($1): any =>');

  // Fix: (s) : any) => should be (s): any =>
  content = content.replace(/\(([a-z])\)\s*:\s*any\)\s*=>/g, '($1): any =>');

  // Fix reduce with incorrect spacing
  content = content.replace(/reduce\(\(sum\)\s*,\s*(\w+)\)\s*=>/g, 'reduce((sum, $1) =>');

  // Fix map with incorrect spacing
  content = content.replace(/map\(\((\w+)\)\s*:\s*any\)\s*=>/g, 'map(($1): any =>');

  // Fix filter with incorrect spacing
  content = content.replace(/filter\(\((\w+)\)\s*:\s*any\)\s*=>/g, 'filter(($1): any =>');

  // Revert the broken space insertion: ") , " back to ", "
  content = content.replace(/\)\s*,\s*/g, ', ');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
