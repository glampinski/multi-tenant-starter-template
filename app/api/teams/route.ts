import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch all teams
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return mock data since we don't have teams table yet
    const mockTeams = [
      {
        id: 'main_team',
        name: 'Main Team',
        description: 'Primary sales team',
        type: 'SALES',
        commissionRate: 10,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'support_team',
        name: 'Support Team',
        description: 'Customer support team',
        type: 'SUPPORT',
        commissionRate: 5,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return NextResponse.json({
      teams: mockTeams,
      total: mockTeams.length
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST: Create new team
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    const { name, description, type, commissionRate } = await req.json();

    // For now, return mock success
    const newTeam = {
      id: `team_${Date.now()}`,
      name,
      description,
      type,
      commissionRate,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      team: newTeam,
      message: 'Team created successfully (simulated)'
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
