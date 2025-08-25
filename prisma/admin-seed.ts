import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');

    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { user_type: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash('admin123', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@tapsy.com',
        username: 'Admin',
        password: hashedPassword,
        user_type: 'ADMIN',
        status: 'ACTIVE',
        verification_method: 'EMAIL',
      },
    });

    console.log('✅ Admin created:', admin.email);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('🎉 Admin seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdmin;
