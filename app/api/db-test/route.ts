import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple database connectivity test
    console.log('🔍 Testing database connectivity...')
    
    // Test 1: Check if we can connect to the database
    const tenantCount = await prisma.tenant.count()
    console.log(`✅ Database connected. Found ${tenantCount} tenants.`)
    
    // Test 2: Check if we can query user profiles
    const userCount = await prisma.userProfile.count()
    console.log(`✅ Found ${userCount} users in the system.`)
    
    // Test 3: Check basic schema tables
    const customerCount = await prisma.customer.count()
    console.log(`✅ Found ${customerCount} customers in the system.`)
    
    return NextResponse.json({
      success: true,
      message: 'Database connectivity test passed',
      stats: {
        tenants: tenantCount,
        users: userCount,
        customers: customerCount
      },
      status: 'Database fully operational',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
