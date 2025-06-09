import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // You can add your seeding logic here.
  // For example, creating a default admin user:
  const adminEmail = 'admin@example.com';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await hash('AdminPassword123!', 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        hashedPassword: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin user: ${adminUser.email}`);
  } else {
    console.log(`Admin user already exists.`);
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
