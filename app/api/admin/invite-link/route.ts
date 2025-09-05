import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    // Get admin's profile to create their personal referral link
    const adminProfile = await prisma.userProfile.findUnique({
      where: { email: session.user.email! },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Admin profile not found' },
        { status: 404 }
      );
    }

    // Generate simple username-based referral link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/${adminProfile.username}`;

    return NextResponse.json({ 
      success: true,
      inviteLink: inviteUrl,
      userInfo: {
        name: `${adminProfile.firstName || ''} ${adminProfile.lastName || ''}`.trim() || adminProfile.username,
        role: adminProfile.role
      }
    });

  } catch (error) {
    console.error('Error creating invite link:', error);
    return NextResponse.json(
      { error: 'Failed to create invite link' },
      { status: 500 }
    );
  }
}
