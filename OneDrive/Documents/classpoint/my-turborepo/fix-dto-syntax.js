const fs = require('fs');
const path = require('path');

function findDtoFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        findDtoFiles(filePath, fileList);
      }
    } else if (file.endsWith('.dto.ts') || file.endsWith('-report.dto.ts') || file.endsWith('.service.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const apiSrcDir = path.join(process.cwd(), 'apps', 'api', 'src');
const files = findDtoFiles(apiSrcDir);

console.log(`Found ${files.length} files to fix`);

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  // Fix misuse of `!:` in object type definitions
  // Pattern: `property!:` should be `property:`
  content = content.replace(/(\s+)(\w+)!:/g, '$1$2:');

  // Fix example!: to example:
  content = content.replace(/example!:/g, 'example:');

  // Fix other common patterns
  content = content.replace(/type!:/g, 'type:');
  content = content.replace(/data!:/g, 'data:');
  content = content.replace(/\(data: any/g, '(data) : any');
  content = content.replace(/\(s: any/g, '(s) : any');
  content = content.replace(/\(sum, /g, '(sum) , ');
  content = content.replace(/\(c\) =>/g, '(c): any =>');
  content = content.replace(/map\(([\w]+): any/g, 'map(($ 1) : any');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
