// Test script to verify Prisma client generation
import { PrismaClient, TenantStatus, TenantPlan } from '@prisma/client'

const prisma = new PrismaClient()

async function testTenantOperations() {
  try {
    console.log('Testing Tenant model access...')
    
    // Test enum access
    console.log('TenantStatus.ACTIVE:', TenantStatus.ACTIVE)
    console.log('TenantPlan.FREE:', TenantPlan.FREE)
    
    // Test client method access
    console.log('Prisma client has tenant methods:', 'tenant' in prisma)
    console.log('Prisma client has tenantAuditLog methods:', 'tenantAuditLog' in prisma)
    
    // Test count operation (doesn't require data)
    const tenantCount = await prisma.tenant.count()
    console.log('Current tenant count:', tenantCount)
    
    console.log('✅ All tests passed! Prisma client is working correctly.')
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTenantOperations()
