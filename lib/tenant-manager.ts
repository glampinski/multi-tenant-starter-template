import { prisma } from '@/lib/prisma'
import { TenantStatus, TenantPlan, UserRole } from '@prisma/client'
import crypto from 'crypto'

export interface CreateTenantData {
  name: string
  slug?: string
  domain?: string
  description?: string
  plan?: TenantPlan
  maxUsers?: number
  maxStorage?: bigint
  maxApiCalls?: number
  primaryColor?: string
  secondaryColor?: string
  adminEmail: string
  adminFirstName: string
  adminLastName: string
  adminPassword?: string
}

export interface TenantSettings {
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
  customCss?: string
  maxUsers?: number
  maxStorage?: bigint
  maxApiCalls?: number
}

export class TenantManager {
  /**
   * Helper method to serialize objects containing BigInt values for JSON
   */
  private static serializeForJson(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ))
  }
  /**
   * Helper function to safely serialize objects with BigInt values
   */
  private static serializeForLogging(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ))
  }

  /**
   * Create a new tenant with an admin user
   */
  static async createTenant(data: CreateTenantData) {
    const slug = data.slug || this.generateSlug(data.name)
    
    // Validate slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })
    
    if (existingTenant) {
      throw new Error(`Tenant with slug "${slug}" already exists`)
    }
    
    // Validate domain if provided
    if (data.domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain: data.domain }
      })
      
      if (existingDomain) {
        throw new Error(`Tenant with domain "${data.domain}" already exists`)
      }
    }
    
    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug,
          domain: data.domain,
          description: data.description,
          plan: data.plan || TenantPlan.FREE,
          maxUsers: data.maxUsers || 5,
          maxStorage: data.maxStorage || BigInt(1073741824), // 1GB
          maxApiCalls: data.maxApiCalls || 10000,
          status: TenantStatus.TRIAL
        }
      })
      
      // Create default team for the tenant
      const defaultTeam = await tx.teamSettings.create({
        data: {
          name: 'Main Team',
          description: 'Default team for ' + data.name,
          tenantId: tenant.id,
          commissionRate: 10.0,
          referralBonusRate: 5.0,
          maxReferralLevels: 5
        }
      })
      
      // Create admin user
      const adminUser = await tx.userProfile.create({
        data: {
          email: data.adminEmail,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          role: UserRole.ADMIN,
          tenantId: tenant.id,
          teamId: defaultTeam.id,
          inviteVerified: true,
          username: this.generateUsername(data.adminFirstName, data.adminLastName)
        }
      })
      
      
      return { tenant, adminUser, defaultTeam }
    })
    
    return result
  }
  
  /**
   * Get tenant by slug or domain
   */
  static async getTenant(identifier: string, type: 'slug' | 'domain' = 'slug') {
    const where = type === 'slug' 
      ? { slug: identifier }
      : { domain: identifier }
      
    return await prisma.tenant.findUnique({
      where,
      include: {
        users: {
          where: { role: UserRole.ADMIN },
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        teams: true,
        _count: {
          select: {
            users: true,
            customers: true,
            referralRelationships: true
          }
        }
      }
    })
  }
  
  /**
   * Update tenant settings
   */
  static async updateTenantSettings(tenantId: string, settings: TenantSettings, updatedBy?: string) {
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })
    
    if (!currentTenant) {
      throw new Error('Tenant not found')
    }
    
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        logoUrl: settings.logoUrl,
        customCss: settings.customCss,
        maxUsers: settings.maxUsers,
        maxStorage: settings.maxStorage,
        maxApiCalls: settings.maxApiCalls
      }
    })
    
    // Log the settings update
    if (updatedBy) {
      await prisma.tenantAuditLog.create({
        data: {
          tenantId,
          userId: currentTenant.createdById || currentTenant.id,
          action: 'tenant_updated',
          entityType: 'tenant',
          entityId: tenantId,
          oldValues: { settings: this.serializeForLogging(currentTenant) },
          newValues: { settings: this.serializeForLogging(updatedTenant) }
        }
      })
    }
    
    return updatedTenant
  }
  
  /**
   * Update tenant status
   */
  static async updateTenantStatus(tenantId: string, status: TenantStatus, updatedBy?: string) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status }
    })
    
    // Log status change
    if (updatedBy) {
      await prisma.tenantAuditLog.create({
        data: {
          tenantId,
          userId: updatedBy,
          action: 'tenant_status_changed',
          entityType: 'tenant',
          entityId: tenantId,
          newValues: { status }
        }
      })
    }
    
    return tenant
  }
  
  /**
   * Delete tenant and all associated data
   */
  static async deleteTenant(tenantId: string, deletedBy?: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })
    
    if (!tenant) {
      throw new Error('Tenant not found')
    }
    
    // Log deletion before actual deletion
    if (deletedBy) {
      await prisma.tenantAuditLog.create({
        data: {
          tenantId,
          userId: deletedBy,
          action: 'tenant_deleted',
          entityType: 'tenant',
          entityId: tenantId,
          oldValues: { tenant: this.serializeForLogging(tenant) }
        }
      })
    }
    
    // Delete tenant (cascade will handle related data)
    await prisma.tenant.delete({
      where: { id: tenantId }
    })
    
    return { success: true, message: 'Tenant deleted successfully' }
  }
  
  /**
   * Get tenant usage statistics
   */
  static async getTenantUsage(tenantId: string) {
    const [users, customers, referrals, activities] = await Promise.all([
      prisma.userProfile.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.referralRelationship.count({ where: { tenantId } }),
      prisma.salesActivity.count({ where: { tenantId } })
    ])
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true, maxStorage: true, maxApiCalls: true }
    })
    
    return {
      users: {
        current: users,
        max: tenant?.maxUsers || 0,
        percentage: tenant?.maxUsers ? (users / tenant.maxUsers) * 100 : 0
      },
      customers: {
        current: customers
      },
      referrals: {
        current: referrals
      },
      activities: {
        current: activities
      }
    }
  }
  
  /**
   * List all tenants (Super Admin only)
   */
  static async listTenants(filters?: {
    status?: TenantStatus
    plan?: TenantPlan
    search?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    
    if (filters?.status) {
      where.status = filters.status
    }
    
    if (filters?.plan) {
      where.plan = filters.plan
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              customers: true
            }
          }
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ])
    
    return { tenants, total }
  }
  
  /**
   * Generate a URL-safe slug from tenant name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 50) // Limit length
  }
  
  /**
   * Generate username from first and last name
   */
  private static generateUsername(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      .replace(/[^a-z0-9.]/g, '')
    
    // Add random suffix to ensure uniqueness
    const randomSuffix = crypto.randomBytes(2).toString('hex')
    return `${base}.${randomSuffix}`
  }

  /**
   * Get user's tenant information for session management
   */
  static async getUserTenantInfo(userId: string) {
    const userProfile = await (prisma.userProfile.findUnique as any)({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: true
          }
        }
      }
    })

    if (!userProfile || !userProfile.tenant) {
      return null
    }

    return {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        teamId: userProfile.teamId,
        tenantId: userProfile.tenantId,
        lineagePath: userProfile.lineagePath,
        inviteVerified: userProfile.inviteVerified
      },
      tenant: {
        id: userProfile.tenant.id,
        name: userProfile.tenant.name,
        slug: userProfile.tenant.slug,
        status: userProfile.tenant.status,
        plan: userProfile.tenant.plan
      }
    }
  }

  /**
   * Validate user has access to a specific tenant
   */
  static async validateUserTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const userProfile = await (prisma.userProfile.findFirst as any)({
      where: {
        id: userId,
        tenantId: tenantId
      }
    })

    return !!userProfile
  }

  /**
   * Get user's accessible tenants (for future multi-tenant user support)
   */
  static async getUserAccessibleTenants(userId: string) {
    // For now, users only have access to their primary tenant
    // In the future, this could be extended to support users with access to multiple tenants
    const userProfile = await (prisma.userProfile.findUnique as any)({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    })

    if (!userProfile || !userProfile.tenant) {
      return []
    }

    return [{
      id: userProfile.tenant.id,
      name: userProfile.tenant.name,
      slug: userProfile.tenant.slug,
      role: userProfile.role
    }]
  }
}
