import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/permissions';
import { UserRole } from '@prisma/client';

// Create invitation endpoint for Super Admins
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, teamId, invitedBy } = body;

    if (!email || !role || !teamId || !invitedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the inviter has permission to invite
    const inviter = await prisma.userProfile.findUnique({
      where: { stackUserId: invitedBy }
    });

    if (!inviter || !['SUPER_ADMIN', 'ADMIN'].includes(inviter.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await prisma.userProfile.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Generate invitation token
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create invitation record
    const invitation = await prisma.userProfile.create({
      data: {
        stackUserId: `temp_${Date.now()}`, // Temporary ID until Stack Auth user is created
        email,
        role: role as UserRole,
        teamId,
        referralCode: invitationToken, // Using this field temporarily for invitation token
        firstName: 'Invited',
        lastName: 'User'
      }
    });

    // In a real app, you would send an email here
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/invite?token=${invitationToken}&email=${email}`;

    return NextResponse.json({
      message: 'Invitation created successfully',
      invitationUrl,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        teamId: invitation.teamId
      }
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
