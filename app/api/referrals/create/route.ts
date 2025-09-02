import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stackServerApp } from '@/stack'

export async function POST(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { referredUserId } = await req.json()

    // Check if referral relationship already exists
    const existingReferral = await prisma.referralRelationship.findUnique({
      where: {
        referrerId_referredId: {
          referrerId: user.id,
          referredId: referredUserId
        }
      }
    })

    if (existingReferral) {
      return NextResponse.json({ error: 'Referral already exists' }, { status: 400 })
    }

    // Create referral relationship
    const referral = await prisma.referralRelationship.create({
      data: {
        referrerId: user.id,
        referredId: referredUserId,
        level: 1,
        status: 'PENDING'
      },
      include: {
        referred: true
      }
    })

    // Create multi-tier referrals (up to 5 levels)
    await createMultiTierReferrals(user.id, referredUserId)

    return NextResponse.json({ 
      success: true, 
      referral,
      message: 'Referral created successfully' 
    })
  } catch (error) {
    console.error('Error creating referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createMultiTierReferrals(referrerId: string, newUserId: string) {
  try {
    // Find the referrer's own referral chain
    const referrerChain = await prisma.referralRelationship.findMany({
      where: { referredId: referrerId },
      orderBy: { level: 'asc' },
      take: 4 // Max 4 levels up
    })

    // Create referrals for each level up the chain
    for (let i = 0; i < referrerChain.length; i++) {
      const level = i + 2 // Level 2, 3, 4, 5
      if (level > 5) break

      await prisma.referralRelationship.create({
        data: {
          referrerId: referrerChain[i].referrerId,
          referredId: newUserId,
          level: level,
          status: 'PENDING'
        }
      })
    }
  } catch (error) {
    console.error('Error creating multi-tier referrals:', error)
  }
}
