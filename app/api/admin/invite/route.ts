import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    const { email, firstName, lastName, role, teamId } = await req.json();

    // Check if user already exists
    const existingUser = await prisma.userProfile.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // For now, return success without actually sending email
    // In production, you would integrate with email service
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully (simulated)',
      inviteDetails: {
        email,
        firstName,
        lastName,
        role,
        teamId
      }
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
