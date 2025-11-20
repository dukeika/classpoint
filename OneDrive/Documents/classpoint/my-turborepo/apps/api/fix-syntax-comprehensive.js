const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Running comprehensive syntax fixes...\n');

// Find all .ts files in src directory
const files = glob.sync('src/**/*.ts', { cwd: __dirname });

let totalFixed = 0;
let filesModified = 0;

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix 1: Remove trailing commas in function/constructor calls
  // Matches: functionName(arg1, ) or new ClassName(, )
  content = content.replace(/([a-zA-Z_$][\w$]*)\s*\(([^)]*),\s*\)/g, (match, funcName, args) => {
    // Clean up any trailing commas in the arguments
    const cleanArgs = args.trim();
    return `${funcName}(${cleanArgs})`;
  });

  // Fix 2: Fix Promise.all array syntax - remove trailing commas before ]
  content = content.replace(/,\s*\]\s*\)/g, '\n    ])');

  // Fix 3: Fix object literals with trailing commas before }
  content = content.replace(/,\s*\}\s*\)/g, '\n    })');

  // Fix 4: Fix new Date() calls with empty arguments
  content = content.replace(/new\s+Date\s*\(\s*,\s*\)/g, 'new Date()');
  content = content.replace(/new\s+Date\s*\(\s*\)/g, 'new Date()');

  // Fix 5: Fix new Set() and new Map() with empty arguments
  content = content.replace(/new\s+Set\s*\(\s*,\s*\)/g, 'new Set()');
  content = content.replace(/new\s+Map\s*\(\s*,\s*\)/g, 'new Map()');

  // Fix 6: Fix missing closing parentheses in decorators
  // Pattern: @Decorator(args
  content = content.replace(/@([A-Z][a-zA-Z]*)\(([^)]*)\s+([a-z])/g, '@$1($2) $3');

  // Fix 7: Fix double commas
  content = content.replace(/,\s*,/g, ',');

  // Fix 8: Fix trailing comma before }
  content = content.replace(/,(\s*)\}/g, '$1}');

  // Fix 9: Fix empty object destructuring
  content = content.replace(/\{\s*,\s*\}/g, '{}');

  // Fix 10: Fix Record<string, X> trailing issues
  content = content.replace(/Record<([^>]+)>,\s*\}/g, 'Record<$1> }');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files scanned: ${files.length}`);
console.log(`   Files modified: ${filesModified}`);
console.log('\n✅ Comprehensive syntax fix complete!');
