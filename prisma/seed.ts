import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...\n');

  // ──────────────────────────────────────────────
  // 1. Create the default tenant
  // ──────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      
    },
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // ──────────────────────────────────────────────
  // 2. Create the admin user
  // ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@acme-corp.com' },
  });

  if (existingAdmin) {
    console.log(`ℹ️  Admin user already exists: ${existingAdmin.email}`);
  } else {
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Admin User',
        email: 'admin@acme-corp.com',
        passwordHash: adminPassword,
        role: Role.ADMIN,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Admin created: ${admin.email} (role: ${admin.role})`);
  }

  // ──────────────────────────────────────────────
  // 3. Create a regular user
  // ──────────────────────────────────────────────
  const userPassword = await bcrypt.hash('User1234!', 12);

  const existingUser = await prisma.user.findUnique({
    where: { email: 'user@acme-corp.com' },
  });

  if (existingUser) {
    console.log(`ℹ️  Regular user already exists: ${existingUser.email}`);
  } else {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Regular User',
        email: 'user@acme-corp.com',
        passwordHash: userPassword,
        role: Role.USER,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ User created: ${user.email} (role: ${user.role})`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Tenant slug: acme-corp');
  console.log('  Admin login: admin@acme-corp.com / Admin123!');
  console.log('  User login:  user@acme-corp.com / User1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
