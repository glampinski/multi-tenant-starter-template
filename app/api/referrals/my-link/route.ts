import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check if they can create referral links
    const userProfile = await prisma.userProfile.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        username: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user can create referral links (allow super admins too)
    if (userProfile.role !== UserRole.CUSTOMER && 
        userProfile.role !== UserRole.SALES_PERSON && 
        userProfile.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Only customers, sales people, and admins can create referral links' 
      }, { status: 403 });
    }

    // Check if tenant is active
    if (userProfile.tenant.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Tenant is not active' 
      }, { status: 403 });
    }

    // Generate simple username-based referral link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/${userProfile.username}`;

    // Get referral stats
    const referralCount = await prisma.referralRelationship.count({
      where: {
        referrerId: userProfile.id,
        tenantId: userProfile.tenantId
      }
    });

    return NextResponse.json({
      success: true,
      referralLink,
      userInfo: {
        id: userProfile.id,
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username,
        role: userProfile.role,
        tenantName: userProfile.tenant.name
      },
      stats: {
        totalReferrals: referralCount
      }
    });

  } catch (error) {
    console.error('Error generating referral link:', error);
    return NextResponse.json({ 
      error: 'Failed to generate referral link' 
    }, { status: 500 });
  }
}
