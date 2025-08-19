import { PrismaClient, Status } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create sample categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'food-beverage' },
        update: {},
        create: {
          name: 'Food & Beverage',
          slug: 'food-beverage',
          status: true,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'technology' },
        update: {},
        create: {
          name: 'Technology',
          slug: 'technology',
          status: true,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'health-fitness' },
        update: {},
        create: {
          name: 'Health & Fitness',
          slug: 'health-fitness',
          status: true,
        },
      }),
    ]);

    console.log('✅ Created categories:', categories.map(c => c.name));

    // Create sample locations
    const locations = await Promise.all([
      prisma.location.upsert({
        where: { id: '1' }, // You'll need to replace with actual unique identifier
        update: {},
        create: {
          name: 'HOME',
          latitude: 40.7128,
          longitude: -74.0060, // New York coordinates
        },
      }),
      prisma.location.upsert({
        where: { id: '2' }, // You'll need to replace with actual unique identifier  
        update: {},
        create: {
          name: 'OFFICE',
          latitude: 37.7749,
          longitude: -122.4194, // San Francisco coordinates
        },
      }),
    ]);

    console.log('✅ Created locations:', locations.map(l => l.name));

    // Create sample tags
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { id: '1' }, // You'll need to replace with actual unique constraint
        update: {},
        create: {
          name: 'trending',
        },
      }),
      prisma.tag.upsert({
        where: { id: '2' }, // You'll need to replace with actual unique constraint
        update: {},
        create: {
          name: 'popular',
        },
      }),
      prisma.tag.upsert({
        where: { id: '3' }, // You'll need to replace with actual unique constraint
        update: {},
        create: {
          name: 'featured',
        },
      }),
    ]);

    console.log('✅ Created tags:', tags.map(t => t.name));

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
