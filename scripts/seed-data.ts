// Sample data seeding script for testing real data integration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create sample user profiles
    const userProfiles = await Promise.all([
      prisma.userProfile.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
          role: 'ADMIN',
          teamId: 'team_1',
          username: 'admin_user',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          referralCode: 'ADMIN001',
        }
      }),
      prisma.userProfile.upsert({
        where: { email: 'sales@example.com' },
        update: {},
        create: {
          role: 'SALES_PERSON',
          teamId: 'team_1',
          username: 'sales_person_1',
          email: 'sales@example.com',
          firstName: 'Sales',
          lastName: 'Person',
          referralCode: 'SALES001',
        }
      }),
      prisma.userProfile.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
          role: 'CUSTOMER',
          teamId: 'team_1',
          username: 'customer_1',
          email: 'customer@example.com',
          firstName: 'Customer',
          lastName: 'One',
          referralCode: 'CUST001',
        }
      }),
    ]);

    console.log('✅ Created user profiles');

    // Create sample customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          phone: '+1-555-0101',
          company: 'TechCorp Inc.',
          status: 'ACTIVE',
          actualValue: 5000,
          salesPersonId: 'user_2_test',
          teamId: 'team_1',
          tags: ['enterprise', 'high-value'],
          notes: 'Important enterprise client',
          priority: 'high',
        }
      }),
      prisma.customer.create({
        data: {
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob@example.com',
          phone: '+1-555-0102',
          company: 'StartupXYZ',
          status: 'ACTIVE',
          actualValue: 2500,
          salesPersonId: 'user_2_test',
          teamId: 'team_1',
          tags: ['startup', 'tech'],
          notes: 'Growing startup with potential',
          priority: 'medium',
        }
      }),
      prisma.customer.create({
        data: {
          firstName: 'Carol',
          lastName: 'Wilson',
          email: 'carol@example.com',
          phone: '+1-555-0103',
          company: 'MegaCorp',
          status: 'LEAD',
          estimatedValue: 10000,
          salesPersonId: 'user_2_test',
          teamId: 'team_1',
          tags: ['enterprise', 'prospect'],
          notes: 'Interested in our premium package',
          priority: 'high',
        }
      }),
    ]);

    console.log('✅ Created customers');

    // Create referral relationships
    const referrals = await Promise.all([
      prisma.referralRelationship.create({
        data: {
          referrerId: 'user_1_test',
          referredId: 'user_2_test',
          level: 1,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        }
      }),
      prisma.referralRelationship.create({
        data: {
          referrerId: 'user_2_test',
          referredId: 'user_3_test',
          level: 1,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        }
      }),
    ]);

    console.log('✅ Created referral relationships');

    // Create sample sales activities
    const salesActivities = await Promise.all([
      prisma.salesActivity.create({
        data: {
          customerId: customers[0].id,
          salesPersonId: 'user_2_test',
          type: 'call',
          subject: 'Initial contact call',
          description: 'First contact with the customer',
          outcome: 'positive',
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        }
      }),
      prisma.salesActivity.create({
        data: {
          customerId: customers[0].id,
          salesPersonId: 'user_2_test',
          type: 'meeting',
          subject: 'Product demo meeting',
          description: 'Premium feature demonstration',
          outcome: 'positive',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        }
      }),
      prisma.salesActivity.create({
        data: {
          customerId: customers[1].id,
          salesPersonId: 'user_2_test',
          type: 'proposal',
          subject: 'Startup package proposal',
          description: 'Sent startup package proposal',
          outcome: 'positive',
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        }
      }),
    ]);

    console.log('✅ Created sales activities');

    // Create referral rewards
    const rewards = await Promise.all([
      prisma.referralReward.create({
        data: {
          userId: 'user_1_test',
          relationshipId: referrals[0].id,
          amount: 250,
          rewardType: 'COMMISSION',
          isPaid: true,
          level: 1,
          currency: 'USD',
          paidAt: new Date(),
        }
      }),
      prisma.referralReward.create({
        data: {
          userId: 'user_2_test',
          relationshipId: referrals[1].id,
          amount: 125,
          rewardType: 'COMMISSION',
          isPaid: false,
          level: 1,
          currency: 'USD',
        }
      }),
    ]);

    console.log('✅ Created referral rewards');

    // Create team settings
    const teamSettings = await prisma.teamSettings.upsert({
      where: { teamId: 'team_1' },
      update: {},
      create: {
        teamId: 'team_1',
        referralEnabled: true,
        maxReferralLevels: 5,
        referralRewardEnabled: true,
      }
    });

    console.log('✅ Created team settings');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📊 Summary:
- ${userProfiles.length} user profiles created
- ${customers.length} customers created  
- ${referrals.length} referral relationships created
- ${salesActivities.length} sales activities created
- ${rewards.length} referral rewards created
- 1 team settings configuration created
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
