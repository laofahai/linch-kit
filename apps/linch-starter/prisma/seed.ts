import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { globalEmail: 'admin@example.com' },
    update: {},
    create: {
      id: nanoid(),
      globalEmail: 'admin@example.com',
      globalUsername: 'admin',
      name: 'Admin User',
      globalStatus: 'active',
    },
  })

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { globalEmail: 'user@example.com' },
    update: {},
    create: {
      id: nanoid(),
      globalEmail: 'user@example.com',
      globalUsername: 'user',
      name: 'Regular User',
      globalStatus: 'active',
    },
  })

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      id: nanoid(),
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access',
      type: 'system',
      enabled: true,
      priority: 100,
    },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      id: nanoid(),
      name: 'user',
      displayName: 'User',
      description: 'Standard user access',
      type: 'system',
      enabled: true,
      priority: 1,
    },
  })

  // Assign roles to users
  const adminUserRole = await prisma.userRole.create({
    data: {
      id: nanoid(),
      userId: adminUser.id,
      roleId: adminRole.id,
      assignedAt: new Date(),
      enabled: true,
    },
  })

  const regularUserRole = await prisma.userRole.create({
    data: {
      id: nanoid(),
      userId: regularUser.id,
      roleId: userRole.id,
      assignedAt: new Date(),
      enabled: true,
    },
  })

  // Create a department
  const department = await prisma.department.upsert({
    where: { path: '/engineering' },
    update: {},
    create: {
      id: nanoid(),
      name: 'Engineering',
      path: '/engineering',
      level: 0,
      managerId: adminUser.id,
      description: 'Engineering department',
      status: 'active',
      sort: 1,
    },
  })

  // Assign users to department
  const adminDepartment = await prisma.userDepartment.create({
    data: {
      id: nanoid(),
      userId: adminUser.id,
      departmentId: department.id,
      position: 'Engineering Manager',
      isManager: true,
      joinedAt: new Date(),
      isPrimary: true,
    },
  })

  const userDepartment = await prisma.userDepartment.create({
    data: {
      id: nanoid(),
      userId: regularUser.id,
      departmentId: department.id,
      position: 'Software Engineer',
      isManager: false,
      reportToId: adminUser.id,
      joinedAt: new Date(),
      isPrimary: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: ${adminUser.globalEmail}`)
  console.log(`👤 Regular user: ${regularUser.globalEmail}`)
  console.log(`🏢 Department: ${department.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
