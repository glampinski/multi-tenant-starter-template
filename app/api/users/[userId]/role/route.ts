import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user role from database
    const userProfile = await prisma.userProfile.findUnique({
      where: { stackUserId: userId },
      select: { role: true, firstName: true, lastName: true, email: true }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      role: userProfile.role,
      user: userProfile
    });

  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
