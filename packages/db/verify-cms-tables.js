// Verify CMS tables exist in database
const { PrismaClient } = require('./node_modules/.prisma/client');

const prisma = new PrismaClient();

async function verifyTables() {
  console.log('========================================');
  console.log('  CMS Tables Verification');
  console.log('========================================\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✓ Database connection successful\n');

    // Check SchoolBranding table
    try {
      const brandingCount = await prisma.schoolBranding.count();
      console.log(`✓ school_branding table exists (${brandingCount} records)`);
    } catch (e) {
      console.log('✗ school_branding table NOT found');
    }

    // Check News table
    try {
      const newsCount = await prisma.news.count();
      console.log(`✓ news table exists (${newsCount} records)`);
    } catch (e) {
      console.log('✗ news table NOT found');
    }

    // Check Event table
    try {
      const eventCount = await prisma.event.count();
      console.log(`✓ event table exists (${eventCount} records)`);
    } catch (e) {
      console.log('✗ event table NOT found');
    }

    // Check Gallery table
    try {
      const galleryCount = await prisma.gallery.count();
      console.log(`✓ gallery table exists (${galleryCount} records)`);
    } catch (e) {
      console.log('✗ gallery table NOT found');
    }

    // Check GalleryImage table
    try {
      const imageCount = await prisma.galleryImage.count();
      console.log(`✓ gallery_image table exists (${imageCount} records)`);
    } catch (e) {
      console.log('✗ gallery_image table NOT found');
    }

    // Get total table count
    console.log('\n========================================');
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log(`Total database tables: ${result[0].count}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error verifying tables:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
