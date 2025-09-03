import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, getUserPermissions } from '@/lib/permissions';
import { MODULES, ACTIONS } from '@/types/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const { userId } = params;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user permissions
    const userPermissions = await getUserPermissions(userId, teamId);

    // Build a flat permissions object for easy lookup
    const permissions: { [key: string]: boolean } = {};

    // Add role permissions
    for (const permission of userPermissions.rolePermissions) {
      const key = `${userId}_${teamId}_${permission.module}_${permission.action}`;
      permissions[key] = true;
    }

    // Add custom permissions
    for (const permission of userPermissions.customPermissions) {
      const key = `${userId}_${teamId}_${permission.module}_${permission.action}`;
      permissions[key] = true;
    }

    // Remove denied permissions
    for (const permission of userPermissions.deniedPermissions) {
      const key = `${userId}_${teamId}_${permission.module}_${permission.action}`;
      permissions[key] = false;
    }

    return NextResponse.json({
      permissions,
      userPermissions
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
