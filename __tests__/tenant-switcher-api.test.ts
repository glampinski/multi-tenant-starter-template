/**
 * @jest-environment node
 */

import { GET } from '@/app/api/auth/tenant-info/route'
import { POST } from '@/app/api/auth/switch-tenant/route'
import { TenantManager } from '@/lib/tenant-manager'
import { TenantPlan } from '@prisma/client'
import { NextRequest } from 'next/server'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock the auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

const { getServerSession } = require('next-auth')

describe('Tenant Switcher API Routes', () => {
  let testTenantId: string
  let testUserId: string
  
  beforeEach(async () => {
    // Create a test tenant for the tests
    const tenantData = {
      name: 'Tenant Switcher Test Company',
      slug: 'tenant-switcher-test',
      adminEmail: 'admin@tenantswitcher.com',
      adminFirstName: 'Admin',
      adminLastName: 'User',
      plan: TenantPlan.FREE
    }

    const result = await TenantManager.createTenant(tenantData)
    testTenantId = result.tenant.id
    testUserId = result.adminUser.id
  })

  afterEach(async () => {
    // Cleanup test tenant
    if (testTenantId) {
      try {
        await TenantManager.deleteTenant(testTenantId)
      } catch (error) {
        // Tenant might already be deleted
      }
    }
  })

  describe('GET /api/auth/tenant-info', () => {
    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/tenant-info')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Not authenticated')
    })

    it('should return tenant info when authenticated', async () => {
      getServerSession.mockResolvedValue({
        user: { id: testUserId }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/tenant-info')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tenant).toHaveProperty('id')
      expect(data.tenant).toHaveProperty('name')
      expect(data.tenant).toHaveProperty('slug')
      expect(data.tenant).toHaveProperty('status')
      expect(data.tenant).toHaveProperty('plan')
      expect(data.tenant.name).toBe('Tenant Switcher Test Company')
    })

    it('should return 404 when user has no tenant', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'non-existent-user' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/tenant-info')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No tenant information found')
    })
  })

  describe('POST /api/auth/switch-tenant', () => {
    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/switch-tenant', {
        method: 'POST',
        body: JSON.stringify({ tenantId: testTenantId })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Not authenticated')
    })

    it('should return 400 when tenantId is missing', async () => {
      getServerSession.mockResolvedValue({
        user: { id: testUserId }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/switch-tenant', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Tenant ID is required')
    })

    it('should return 403 when user has no access to tenant', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'different-user-id' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/switch-tenant', {
        method: 'POST',
        body: JSON.stringify({ tenantId: testTenantId })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Access denied to this tenant')
    })

    it('should allow switching to accessible tenant', async () => {
      getServerSession.mockResolvedValue({
        user: { id: testUserId }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/switch-tenant', {
        method: 'POST',
        body: JSON.stringify({ tenantId: testTenantId })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tenantId).toBe(testTenantId)
    })
  })
})
