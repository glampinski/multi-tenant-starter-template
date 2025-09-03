import { NextRequest, NextResponse } from 'next/server';
import { prisma, canImpersonate } from '@/lib/permissions';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const canImpersonateParam = searchParams.get('canImpersonate');
    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // For now, we'll get all users in the team
    // In production, you'd implement proper authentication and check permissions
    let users = await prisma.userProfile.findMany({
      where: {
        teamId: teamId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        username: true
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // If requesting users that can be impersonated, filter by role hierarchy
    if (canImpersonateParam === 'true') {
      // For demo purposes, filter out super admins from impersonation
      // In production, you'd check the requesting user's permissions
      users = users.filter(user => 
        user.role !== UserRole.SUPER_ADMIN
      );
    }

    return NextResponse.json({
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching team users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
