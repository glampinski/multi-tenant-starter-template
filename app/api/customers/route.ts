import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTenantContext, getTenantContext, getTenantId, createTenantScopedQueries } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { getSessionWithTenant } from '@/lib/session-utils'
import { MODULES, ACTIONS } from '@/types/permissions'

// GET: Fetch customers with tenant isolation and permission checks
async function getCustomers(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenant = getTenantContext(enhancedReq)
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Get session with tenant context and validate permissions
      const session = await getSessionWithTenant()
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Verify session tenant matches request tenant
      if (session.user.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 })
      }

      // Check permissions for viewing customers
      const canViewCustomers = await hasPermission(
        session.user.id, 
        session.user.tenantId,
        session.user.teamId || '', 
        MODULES.CUSTOMERS, 
        ACTIONS.VIEW
      )

      if (!canViewCustomers) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }

      const { searchParams } = new URL(enhancedReq.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || ''
      const salesPersonId = searchParams.get('salesPersonId') || ''

      const skip = (page - 1) * limit

            // Build tenant-scoped where clause
      let baseWhere: any = {
        tenantId // Always include tenant isolation
      }
      
      if (search) {
        baseWhere.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (status) {
        baseWhere.status = status
      }

      if (salesPersonId) {
        baseWhere.salesPersonId = salesPersonId
      }

      // Get customers with tenant scoping
      const [customers, totalCount] = await Promise.all([
        (prisma.customer.findMany as any)({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            salesPerson: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }),
        (prisma.customer.count as any)({ where: baseWhere })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return NextResponse.json({
        customers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages
        }
      })
    } catch (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

// POST: Create new customer with tenant isolation and permission checks
async function createCustomer(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenant = getTenantContext(enhancedReq)
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Get session with tenant context and validate permissions
      const session = await getSessionWithTenant()
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Verify session tenant matches request tenant
      if (session.user.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 })
      }

      // Check permissions for creating customers
      const canCreateCustomers = await hasPermission(
        session.user.id, 
        session.user.tenantId,
        session.user.teamId || '', 
        MODULES.CUSTOMERS, 
        ACTIONS.CREATE
      )

      if (!canCreateCustomers) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
      // const canCreateCustomers = await hasPermission(userId, teamId, MODULES.CUSTOMERS, ACTIONS.CREATE)

      const data = await enhancedReq.json()
      const {
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        status = 'LEAD',
        source,
        priority = 'medium',
        estimatedValue,
        notes,
        tags = [],
        salesPersonId
      } = data

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return NextResponse.json({ 
          error: 'First name, last name, and email are required' 
        }, { status: 400 })
      }

      // Check if email already exists within the tenant
      const existingCustomer = await (prisma.customer.findFirst as any)({
        where: { 
          email,
          tenantId 
        }
      })

      if (existingCustomer) {
        return NextResponse.json({ 
          error: 'Customer with this email already exists in your organization' 
        }, { status: 400 })
      }

      const customer = await (prisma.customer.create as any)({
        data: {
          firstName,
          lastName,
          email,
          phone,
          company,
          position,
          status,
          source,
          priority,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
          notes,
          tags,
          salesPersonId: session.user.role === 'SALES_PERSON' ? session.user.id : (salesPersonId || null),
          tenantId
        },
        include: {
          salesPerson: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({ 
        success: true, 
        customer,
        message: 'Customer created successfully'
      })
    } catch (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

// PUT: Update customer with tenant isolation and permission checks
async function updateCustomer(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Get session with tenant context and validate permissions
      const session = await getSessionWithTenant()
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Verify session tenant matches request tenant
      if (session.user.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 })
      }

      // Check permissions for updating customers
      const canEditCustomers = await hasPermission(
        session.user.id, 
        session.user.tenantId,
        session.user.teamId || '', 
        MODULES.CUSTOMERS, 
        ACTIONS.EDIT
      )

      if (!canEditCustomers) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }

      const data = await enhancedReq.json()
      const { id, ...updateData } = data

      if (!id) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
      }

      // Check if customer exists and belongs to user's tenant
      const existingCustomer = await (prisma.customer.findFirst as any)({
        where: { 
          id,
          tenantId 
        }
      })

      if (!existingCustomer) {
        return NextResponse.json({ error: 'Customer not found in your organization' }, { status: 404 })
      }

      // Role-based access control - sales people can only update their customers
      if (session.user.role === 'SALES_PERSON' && existingCustomer.salesPersonId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized to update this customer' }, { status: 403 })
      }
      // Clean update data
      if (updateData.estimatedValue) {
        updateData.estimatedValue = parseFloat(updateData.estimatedValue)
      }
      if (updateData.actualValue) {
        updateData.actualValue = parseFloat(updateData.actualValue)
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: updateData,
        include: {
          salesPerson: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({ 
        success: true, 
        customer,
        message: 'Customer updated successfully'
      })
    } catch (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

// DELETE: Delete customer with team isolation and permission checks
// DELETE: Delete customer with tenant isolation and permission checks
async function deleteCustomer(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Get session with tenant context and validate permissions
      const session = await getSessionWithTenant()
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Verify session tenant matches request tenant
      if (session.user.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 })
      }

      // Check permissions for deleting customers
      const canDeleteCustomers = await hasPermission(
        session.user.id, 
        session.user.tenantId,
        session.user.teamId || '', 
        MODULES.CUSTOMERS, 
        ACTIONS.DELETE
      )

      if (!canDeleteCustomers) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }

      const { searchParams } = new URL(enhancedReq.url)
      const customerId = searchParams.get('id')

      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
      }

      // Check if customer exists and belongs to user's tenant
      const existingCustomer = await (prisma.customer.findFirst as any)({
        where: { 
          id: customerId,
          tenantId 
        }
      })

      if (!existingCustomer) {
        return NextResponse.json({ error: 'Customer not found in your organization' }, { status: 404 })
      }

      // Role-based access control - sales people can only delete their customers
      if (session.user.role === 'SALES_PERSON' && existingCustomer.salesPersonId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized to delete this customer' }, { status: 403 })
      }

      await prisma.customer.delete({
        where: { id: customerId }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Customer deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export const GET = getCustomers
export const POST = createCustomer
export const PUT = updateCustomer
export const DELETE = deleteCustomer
