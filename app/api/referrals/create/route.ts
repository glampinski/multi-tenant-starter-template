import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTenantContext, getTenantContext, getTenantId } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { MODULES, ACTIONS } from '@/types/permissions'

// POST: Create referral with tenant isolation
async function createReferral(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenant = getTenantContext(enhancedReq)
      const tenantId = getTenantId(enhancedReq)

      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // TODO: Add session-based user authentication here
      // For now, we'll skip permission checks until we integrate tenant-aware auth
      // const canCreateReferrals = await hasPermission(userProfile.id, tenantId, MODULES.REFERRALS, ACTIONS.CREATE)

      const { referredUserId, referrerId } = await enhancedReq.json()

      if (!referrerId) {
        return NextResponse.json({ error: 'Referrer ID is required' }, { status: 400 })
      }

      // Validate that the referrer is in the same tenant
      const referrerUser = await prisma.userProfile.findFirst({
        where: {
          id: referrerId,
          tenantId: tenantId
        } as any
      })

      if (!referrerUser) {
        return NextResponse.json({ error: 'Referrer not found in this tenant' }, { status: 404 })
      }

      // Validate that the referred user is in the same tenant
      const referredUser = await prisma.userProfile.findFirst({
        where: {
          id: referredUserId,
          tenantId: tenantId
        } as any
      })

      if (!referredUser) {
        return NextResponse.json({ error: 'Referred user not found in this tenant' }, { status: 404 })
      }

      // Check if referral relationship already exists
      const existingReferral = await prisma.referralRelationship.findFirst({
        where: {
          referrerId: referrerId,
          referredId: referredUserId,
          tenantId: tenantId
        } as any
      })

      if (existingReferral) {
        return NextResponse.json({ error: 'Referral already exists' }, { status: 400 })
      }

      // Create referral relationship with tenant-scoped validation
      const referral = await prisma.referralRelationship.create({
        data: {
          referrerId: referrerId,
          referredId: referredUserId,
          tenantId: tenantId,
          level: 1,
          status: 'PENDING'
        } as any,
        include: {
          referred: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          referrer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Create multi-tier referrals (up to 5 levels) within tenant
      await createMultiTierReferrals(referrerId, referredUserId, tenantId)

      return NextResponse.json({ 
        success: true, 
        referral,
        tenant: {
          id: tenant?.id,
          name: tenant?.name
        },
        message: 'Referral created successfully' 
      })
    } catch (error) {
      console.error('Error creating referral:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

async function createMultiTierReferrals(referrerId: string, newUserId: string, tenantId: string) {
  try {
    // Find the referrer's own referral chain within the same tenant
    const referrerChain = await prisma.referralRelationship.findMany({
      where: { 
        referredId: referrerId,
        tenantId: tenantId
      } as any,
      orderBy: { level: 'asc' },
      take: 4 // Max 4 levels up
    })

    // Create referrals for each level up the chain
    for (let i = 0; i < referrerChain.length; i++) {
      const level = i + 2 // Level 2, 3, 4, 5
      if (level > 5) break

      // Validate that the upper-level referrer is still in the same tenant
      const upperReferrer = await prisma.userProfile.findFirst({
        where: {
          id: referrerChain[i].referrerId,
          tenantId: tenantId
        } as any
      })

      if (upperReferrer) {
        await prisma.referralRelationship.create({
          data: {
            referrerId: referrerChain[i].referrerId,
            referredId: newUserId,
            tenantId: tenantId,
            level: level,
            status: 'PENDING'
          } as any
        })
      }
    }
  } catch (error) {
    console.error('Error creating multi-tier referrals:', error)
  }
}

export async function POST(request: NextRequest) {
  return createReferral(request)
}
