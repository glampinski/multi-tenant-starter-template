import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data for impersonation system...');

  // Create test team
  const testTeamId = 'team_test_123';
  
  // Create test users with different roles
  const testUsers = [
    {
      id: 'user_super_admin_1',
      username: 'superadmin',
      role: UserRole.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@example.com',
      teamId: testTeamId
    },
    {
      id: 'user_admin_1',
      username: 'admin1',
      role: UserRole.ADMIN,
      firstName: 'Alice',
      lastName: 'Manager',
      email: 'alice@example.com',
      teamId: testTeamId
    },
    {
      id: 'user_employee_1',
      username: 'employee1',
      role: UserRole.EMPLOYEE,
      firstName: 'Bob',
      lastName: 'Worker',
      email: 'bob@example.com',
      teamId: testTeamId
    },
    {
      id: 'user_sales_1',
      username: 'sales1',
      role: UserRole.SALES_PERSON,
      firstName: 'Carol',
      lastName: 'Sales',
      email: 'carol@example.com',
      teamId: testTeamId
    },
    {
      id: 'user_sales_2',
      username: 'sales2',
      role: UserRole.SALES_PERSON,
      firstName: 'David',
      lastName: 'Seller',
      email: 'david@example.com',
      teamId: testTeamId
    },
    {
      id: 'user_customer_1',
      username: 'customer1',
      role: UserRole.CUSTOMER,
      firstName: 'Eve',
      lastName: 'Customer',
      email: 'eve@example.com',
      teamId: testTeamId
    },
    {
      id: 'user_customer_2',
      username: 'customer2',
      role: UserRole.CUSTOMER,
      firstName: 'Frank',
      lastName: 'Buyer',
      email: 'frank@example.com',
      teamId: testTeamId
    }
  ];

  console.log(`👥 Creating ${testUsers.length} test users...`);

  for (const userData of testUsers) {
    await prisma.userProfile.upsert({
      where: { id: userData.id },
      update: userData,
      create: userData
    });
  }

  // Create team settings
  await prisma.teamSettings.upsert({
    where: { teamId: testTeamId },
    update: {
      referralEnabled: true,
      maxReferralLevels: 5,
      referralRewardEnabled: true
    },
    create: {
      teamId: testTeamId,
      referralEnabled: true,
      maxReferralLevels: 5,
      referralRewardEnabled: true
    }
  });

  // Create some test customers for the sales people
  const testCustomers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Doe Enterprises',
      salesPersonId: 'user_sales_1',
      teamId: testTeamId,
      status: 'ACTIVE' as const,
      estimatedValue: 5000
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      company: 'Smith Corp',
      salesPersonId: 'user_sales_1',
      teamId: testTeamId,
      status: 'ACTIVE' as const,
      estimatedValue: 8000
    },
    {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      company: 'Johnson LLC',
      salesPersonId: 'user_sales_2',
      teamId: testTeamId,
      status: 'LEAD' as const,
      estimatedValue: 3000
    }
  ];

  console.log(`💼 Creating ${testCustomers.length} test customers...`);

  for (const customerData of testCustomers) {
    await prisma.customer.upsert({
      where: { email: customerData.email },
      update: customerData,
      create: customerData
    });
  }

  console.log('✅ Test data seeded successfully!');
  console.log('\n📋 Test Users Created:');
  console.log('- Super Admin: superadmin@example.com (user_super_admin_1)');
  console.log('- Admin: alice@example.com (user_admin_1)');
  console.log('- Employee: bob@example.com (user_employee_1)');
  console.log('- Sales Person 1: carol@example.com (user_sales_1)');
  console.log('- Sales Person 2: david@example.com (user_sales_2)');
  console.log('- Customer 1: eve@example.com (user_customer_1)');
  console.log('- Customer 2: frank@example.com (user_customer_2)');
  console.log(`\n🏢 Team ID: ${testTeamId}`);
}

async function main() {
  try {
    await seedTestData();
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Test data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestData };
