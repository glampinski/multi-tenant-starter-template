import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTenantContext, getTenantId } from '@/lib/tenant-context'

// POST: Create lead from public invitation request
export async function POST(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const data = await enhancedReq.json()
      const {
        firstName,
        lastName,
        email,
        company,
        position,
        notes
      } = data

      // Get tenant ID - for public requests, we might need a default tenant
      const tenantId = getTenantId(enhancedReq)
      
      if (!tenantId) {
        // For now, return error if no tenant context
        // TODO: Implement default tenant or tenant selection for public requests
        return NextResponse.json({ 
          error: 'Tenant context required. Please access through a specific tenant domain.' 
        }, { status: 400 })
      }

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return NextResponse.json({ 
          error: 'First name, last name, and email are required' 
        }, { status: 400 })
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          error: 'Please enter a valid email address' 
        }, { status: 400 })
      }

      // Check if email already exists in customers for this tenant
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          email,
          tenantId 
        }
      })

      if (existingCustomer) {
        return NextResponse.json({ 
          error: 'A request with this email address has already been submitted' 
        }, { status: 400 })
      }

      // Check if user already has access (exists in UserProfile for this tenant)
      const existingUser = await prisma.userProfile.findFirst({
        where: { 
          email,
          tenantId
        }
      })

      if (existingUser) {
        return NextResponse.json({ 
          error: 'This email address already has platform access. Please try signing in instead.' 
        }, { status: 400 })
      }

      // Create lead in customer system
      const customer = await (prisma.customer.create as any)({
        data: {
          firstName,
          lastName,
          email,
          company: company || null,
          position: position || null,
          status: 'LEAD',
          source: 'invitation_request',
          priority: 'medium',
          notes: notes || null,
          tags: ['invitation_request'],
          tenantId,
          teamId: 'main_team' // Default team
        }
      })

      console.log(`📧 New invitation request: ${firstName} ${lastName} (${email}) for tenant ${tenantId}`)

      return NextResponse.json({ 
        message: 'Invitation request submitted successfully',
        id: customer.id
      }, { status: 201 })

    } catch (error) {
      console.error('Error creating invitation request:', error)
      return NextResponse.json({ 
        error: 'Failed to submit request. Please try again.' 
      }, { status: 500 })
    }
  })
}
