import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    const { teamId, role = 'SALES_REP' } = await req.json();

    // Generate unique invite token
    const inviteToken = randomBytes(32).toString('hex');

    // Create invite URL
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/join?token=${inviteToken}`;

    return NextResponse.json({ 
      success: true,
      inviteLink: inviteUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      maxUses: 10
    });

  } catch (error) {
    console.error('Error creating invite link:', error);
    return NextResponse.json(
      { error: 'Failed to create invite link' },
      { status: 500 }
    );
  }
}
