// Simple database connectivity test script
// Run with: node --loader ts-node/esm scripts/test-db-connection.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn', 'info'],
})

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connectivity...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection established')
    
    // Test raw SQL to see what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    console.log('📋 Available tables:', tables)
    
    console.log('\n🎉 Database connectivity test successful!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

testDatabaseConnection().catch(console.error)
