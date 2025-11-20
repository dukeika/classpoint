const fs = require('fs');
const path = require('path');

// Comprehensive Promise.all fixer
const files = [
  'src/academic/term.service.ts',
  'src/analytics/analytics.service.ts',
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Fix: }, this.prisma.X.count({ where }); pattern
  // Replace with: }),\n      this.prisma.X.count({ where }),
  content = content.replace(
    /(\s+)}\),\s*this\.prisma\.(\w+)\.count\(\{\s*where\s*\}\);/g,
    '$1}),\n$1this.prisma.$2.count({ where }),'
  );

  // Fix pattern: }, this.prisma.X.Y({ ... }); to }),\n this.prisma.X.Y({ ... }),
  content = content.replace(
    /(\s+)},\s*this\.prisma\.(\w+)\.(\w+)\(\{/g,
    '$1}),\n$1this.prisma.$2.$3({'
  );

  // Fix terminal }); after Promise.all array to just ]);
  // Look for pattern where we have closing of findMany followed by count
  content = content.replace(
    /(\s+)}\)\);(\s+)return\s+\{/g,
    '$1}),\n$1]);$2\n$2return {'
  );

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed in ${filePath}`);
  }
});

console.log('\n✅ Promise.all comprehensive fix complete!');
