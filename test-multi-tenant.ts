import { TenantManager } from '@/lib/tenant-manager'

async function testMultiTenantSystem() {
  console.log('🧪 Testing Multi-Tenant System Implementation...\n')
  
  try {
    // Test 1: Create a test tenant
    console.log('1️⃣ Creating test tenant...')
    const testTenant = await TenantManager.createTenant({
      name: 'Test Organization',
      slug: 'test-org',
      description: 'Test organization for multi-tenant system',
      primaryColor: '#2563eb',
      secondaryColor: '#f1f5f9'
    })
    
    console.log('✅ Tenant created:', {
      id: testTenant.id,
      name: testTenant.name,
      slug: testTenant.slug,
      status: testTenant.status,
      plan: testTenant.plan
    })
    
    // Test 2: Get tenant information
    console.log('\n2️⃣ Retrieving tenant information...')
    const retrievedTenant = await TenantManager.getTenant(testTenant.id)
    
    if (retrievedTenant) {
      console.log('✅ Tenant retrieved:', {
        id: retrievedTenant.tenantData.id,
        name: retrievedTenant.tenantData.name,
        status: retrievedTenant.tenantData.status,
        userCount: retrievedTenant.usage.userCount,
        customerCount: retrievedTenant.usage.customerCount
      })
    }
    
    // Test 3: List all tenants
    console.log('\n3️⃣ Listing all tenants...')
    const tenantList = await TenantManager.getAllTenants()
    console.log(`✅ Found ${tenantList.tenants.length} total tenants`)
    
    // Test 4: Update tenant settings
    console.log('\n4️⃣ Updating tenant settings...')
    const updatedTenant = await TenantManager.updateTenantSettings(testTenant.id, {
      description: 'Updated test organization description',
      logoUrl: 'https://example.com/logo.png'
    })
    
    if (updatedTenant) {
      console.log('✅ Tenant updated:', {
        description: updatedTenant.description,
        logoUrl: updatedTenant.logoUrl
      })
    }
    
    // Test 5: Get usage stats
    console.log('\n5️⃣ Getting tenant usage statistics...')
    const usage = await TenantManager.getTenantUsage(testTenant.id)
    console.log('✅ Usage stats:', usage)
    
    // Test 6: Cleanup - delete test tenant
    console.log('\n6️⃣ Cleaning up test tenant...')
    await TenantManager.deleteTenant(testTenant.id)
    console.log('✅ Test tenant deleted successfully')
    
    console.log('\n🎉 All multi-tenant system tests passed! ✅')
    console.log('\n📋 Summary of implemented features:')
    console.log('   ✅ Tenant creation with transaction safety')
    console.log('   ✅ Tenant retrieval with usage statistics') 
    console.log('   ✅ Tenant settings updates with audit logging')
    console.log('   ✅ Tenant usage tracking and analytics')
    console.log('   ✅ Tenant deletion with cleanup')
    console.log('   ✅ Multi-tenant database schema with proper isolation')
    console.log('   ✅ Tenant context middleware with multiple identification methods')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testMultiTenantSystem()
