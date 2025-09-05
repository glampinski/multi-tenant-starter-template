/**
 * @jest-environment node
 */

import { TenantManager } from '@/lib/tenant-manager'
import { TenantStatus, TenantPlan } from '@prisma/client'

describe('TenantManager', () => {
  let testTenantId: string
  
  afterEach(async () => {
    // Cleanup any test tenant
    if (testTenantId) {
      try {
        await TenantManager.deleteTenant(testTenantId)
      } catch (error) {
        // Tenant might already be deleted
      }
      testTenantId = ''
    }
  })

  describe('createTenant', () => {
    it('should create a new tenant with admin user', async () => {
      const tenantData = {
        name: 'Test Company',
        slug: 'test-company-jest',
        description: 'A test company for Jest testing',
        adminEmail: 'admin@testcompany.com',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        plan: TenantPlan.FREE
      }

      const result = await TenantManager.createTenant(tenantData)
      testTenantId = result.tenant.id

      expect(result).toHaveProperty('tenant')
      expect(result).toHaveProperty('adminUser')
      expect(result).toHaveProperty('defaultTeam')
      
      expect(result.tenant.name).toBe(tenantData.name)
      expect(result.tenant.slug).toBe(tenantData.slug)
      expect(result.tenant.status).toBe(TenantStatus.TRIAL)
      expect(result.tenant.plan).toBe(TenantPlan.FREE)
      
      expect(result.adminUser.email).toBe(tenantData.adminEmail)
      expect(result.adminUser.firstName).toBe(tenantData.adminFirstName)
      expect(result.adminUser.lastName).toBe(tenantData.adminLastName)
      expect(result.adminUser.tenantId).toBe(result.tenant.id)
    })

    it('should throw error for duplicate slug', async () => {
      const tenantData = {
        name: 'Test Company 1',
        slug: 'duplicate-slug-test',
        adminEmail: 'admin1@test.com',
        adminFirstName: 'Admin',
        adminLastName: 'One'
      }

      const result1 = await TenantManager.createTenant(tenantData)
      testTenantId = result1.tenant.id

      const tenantData2 = {
        ...tenantData,
        name: 'Test Company 2',
        adminEmail: 'admin2@test.com'
      }

      await expect(TenantManager.createTenant(tenantData2))
        .rejects
        .toThrow('Tenant with slug "duplicate-slug-test" already exists')
    })
  })

  describe('getTenant', () => {
    beforeEach(async () => {
      const tenantData = {
        name: 'Get Test Company',
        slug: 'get-test-company',
        adminEmail: 'admin@gettest.com',
        adminFirstName: 'Admin',
        adminLastName: 'User'
      }
      const result = await TenantManager.createTenant(tenantData)
      testTenantId = result.tenant.id
    })

    it('should retrieve tenant by slug', async () => {
      const tenant = await TenantManager.getTenant('get-test-company', 'slug')
      
      expect(tenant).toBeTruthy()
      expect(tenant?.name).toBe('Get Test Company')
      expect(tenant?.slug).toBe('get-test-company')
      expect(tenant?.users).toHaveLength(1)
      expect(tenant?._count.users).toBe(1)
    })

    it('should return null for non-existent tenant', async () => {
      const tenant = await TenantManager.getTenant('non-existent-slug', 'slug')
      expect(tenant).toBeNull()
    })
  })

  describe('updateTenantSettings', () => {
    beforeEach(async () => {
      const tenantData = {
        name: 'Update Test Company',
        slug: 'update-test-company',
        adminEmail: 'admin@updatetest.com',
        adminFirstName: 'Admin',
        adminLastName: 'User'
      }
      const result = await TenantManager.createTenant(tenantData)
      testTenantId = result.tenant.id
    })

    it('should update tenant settings', async () => {
      const settings = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        logoUrl: 'https://example.com/new-logo.png',
        maxUsers: 10
      }

      const updatedTenant = await TenantManager.updateTenantSettings(
        testTenantId, 
        settings, 
        'test-user-id'
      )

      expect(updatedTenant.primaryColor).toBe('#ff0000')
      expect(updatedTenant.secondaryColor).toBe('#00ff00')
      expect(updatedTenant.logoUrl).toBe('https://example.com/new-logo.png')
      expect(updatedTenant.maxUsers).toBe(10)
    })

    it('should throw error for non-existent tenant', async () => {
      const settings = { primaryColor: '#ff0000' }
      
      await expect(TenantManager.updateTenantSettings('non-existent-id', settings))
        .rejects
        .toThrow('Tenant not found')
    })
  })

  describe('getTenantUsage', () => {
    beforeEach(async () => {
      const tenantData = {
        name: 'Usage Test Company',
        slug: 'usage-test-company',
        adminEmail: 'admin@usagetest.com',
        adminFirstName: 'Admin',
        adminLastName: 'User'
      }
      const result = await TenantManager.createTenant(tenantData)
      testTenantId = result.tenant.id
    })

    it('should return tenant usage statistics', async () => {
      const usage = await TenantManager.getTenantUsage(testTenantId)

      expect(usage).toHaveProperty('users')
      expect(usage).toHaveProperty('customers')
      expect(usage).toHaveProperty('referrals')
      expect(usage).toHaveProperty('activities')

      expect(usage.users.current).toBe(1) // Admin user
      expect(usage.users.max).toBe(5) // Default max
      expect(usage.users.percentage).toBe(20) // 1/5 = 20%
      expect(usage.customers.current).toBe(0)
      expect(usage.referrals.current).toBe(0)
      expect(usage.activities.current).toBe(0)
    })
  })

  describe('listTenants', () => {
    beforeEach(async () => {
      // Create multiple test tenants
      const tenant1Data = {
        name: 'List Test Company 1',
        slug: 'list-test-company-1',
        adminEmail: 'admin1@listtest.com',
        adminFirstName: 'Admin',
        adminLastName: 'One'
      }
      const result1 = await TenantManager.createTenant(tenant1Data)
      testTenantId = result1.tenant.id
    })

    it('should list tenants with default pagination', async () => {
      const result = await TenantManager.listTenants()

      expect(result).toHaveProperty('tenants')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.tenants)).toBe(true)
      expect(typeof result.total).toBe('number')
      expect(result.total).toBeGreaterThan(0)
    })

    it('should filter tenants by status', async () => {
      const result = await TenantManager.listTenants({
        status: TenantStatus.TRIAL
      })

      expect(result.tenants.every(t => t.status === TenantStatus.TRIAL)).toBe(true)
    })

    it('should search tenants by name', async () => {
      const result = await TenantManager.listTenants({
        search: 'List Test'
      })

      expect(result.tenants.some(t => t.name.includes('List Test'))).toBe(true)
    })
  })
})
