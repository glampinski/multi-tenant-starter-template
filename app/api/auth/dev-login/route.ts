import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { stackUserId: userId }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In development, we'll create a simple session cookie
    // This is NOT secure for production use
    const devSession = {
      userId: userProfile.stackUserId,
      email: userProfile.email,
      role: userProfile.role,
      teamId: userProfile.teamId || 'team_test_123',
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      isDev: true,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    // Set development session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userProfile.stackUserId,
        email: userProfile.email,
        role: userProfile.role,
        name: `${userProfile.firstName} ${userProfile.lastName}`
      },
      teamId: userProfile.teamId || 'team_test_123'
    });

    response.cookies.set('dev_session', JSON.stringify(devSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
