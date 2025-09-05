import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTenantContext, getTenantContext, getTenantId, createTenantScopedQueries } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
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

      // TODO: Add session-based user authentication here
      // For now, we'll skip permission checks until we integrate tenant-aware auth
      // const canViewCustomers = await hasPermission(userId, teamId, MODULES.CUSTOMERS, ACTIONS.VIEW)

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
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where: baseWhere,
          include: {
            salesPerson: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.customer.count({ where: baseWhere })
      ])

      return NextResponse.json({
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // TODO: Add session-based user authentication and permission checks here
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
      const existingCustomer = await prisma.customer.findFirst({
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

      const customer = await prisma.customer.create({
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
          salesPersonId: salesPersonId || null, // TODO: Get from authenticated user session
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

// PUT: Update customer with team isolation and permission checks
// PUT: Update customer with tenant isolation and permission checks
async function updateCustomer(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // TODO: Add session-based user authentication and permission checks here
      // const canEditCustomers = await hasPermission(userId, teamId, MODULES.CUSTOMERS, ACTIONS.EDIT)

      const data = await enhancedReq.json()
      const { id, ...updateData } = data

      if (!id) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
      }

      // Check if customer exists and belongs to user's tenant
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          id,
          tenantId 
        }
      })

      if (!existingCustomer) {
        return NextResponse.json({ error: 'Customer not found in your organization' }, { status: 404 })
      }

      // TODO: Add role-based access control here
      // Check permissions - sales people can only update their customers
      // if (userRole === 'SALES_PERSON' && existingCustomer.salesPersonId !== userId) {
      //   return NextResponse.json({ error: 'Unauthorized to update this customer' }, { status: 403 })
      // }
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

      // TODO: Add session-based user authentication and permission checks here
      // const canDeleteCustomers = await hasPermission(userId, teamId, MODULES.CUSTOMERS, ACTIONS.DELETE)

      const { searchParams } = new URL(enhancedReq.url)
      const customerId = searchParams.get('id')

      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
      }

      // Check if customer exists and belongs to user's tenant
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          id: customerId,
          tenantId 
        }
      })

      if (!existingCustomer) {
        return NextResponse.json({ error: 'Customer not found in your organization' }, { status: 404 })
      }

      // TODO: Add role-based access control here
      // Check permissions - sales people can only delete their customers
      // if (userRole === 'SALES_PERSON' && existingCustomer.salesPersonId !== userId) {
      //   return NextResponse.json({ error: 'Unauthorized to delete this customer' }, { status: 403 })
      // }

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
