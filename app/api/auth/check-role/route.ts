import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, tenantId } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Query user profile with tenant context
    const userProfile = await prisma.userProfile.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(tenantId && { tenantId }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });
    
    if (!userProfile) {
      return NextResponse.json({ 
        role: null,
        message: "User not found"
      }, { status: 200 });
    }

    // Get team info separately if teamId exists
    let teamInfo = null;
    if (userProfile.teamId) {
      teamInfo = await prisma.teamSettings.findUnique({
        where: { id: userProfile.teamId },
        select: {
          id: true,
          name: true,
        }
      });
    }
    
    return NextResponse.json({
      role: userProfile.role,
      teamId: userProfile.teamId,
      tenantId: userProfile.tenantId,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      },
      team: teamInfo,
      tenant: userProfile.tenant ? {
        id: userProfile.tenant.id,
        name: userProfile.tenant.name,
        slug: userProfile.tenant.slug,
      } : null,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
