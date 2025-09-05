import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Check if user profile already exists
    const existingProfile = await prisma.userProfile.findFirst({
      where: { email }
    });
    
    if (existingProfile) {
      return NextResponse.json({ 
        message: 'User profile already exists',
        profile: existingProfile 
      });
    }
    
    // Check if NextAuth user exists
    const nextAuthUser = await prisma.user.findFirst({
      where: { email }
    });
    
    if (!nextAuthUser) {
      return NextResponse.json({ error: 'NextAuth user not found' }, { status: 404 });
    }
    
    // Create or get default system tenant for super admin
    const systemTenant = await (prisma as any).tenant.upsert({
      where: { slug: 'system' },
      update: {},
      create: {
        name: 'System Administration',
        slug: 'system',
        domain: null,
        description: 'System administration tenant for super admins',
        status: 'ACTIVE',
        plan: 'ENTERPRISE'
      }
    });
    
    // Create user profile
    const userProfile = await prisma.userProfile.create({
      data: {
        username: email.split('@')[0] + '_admin',
        role: UserRole.SUPER_ADMIN,
        firstName: 'Super',
        lastName: 'Admin',
        email: email,
        tenantId: systemTenant.id,
        teamId: 'main_team',
        referralCode: `SUPER_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        inviteVerified: true,
        lineagePath: []
      } as any
    });
    
    return NextResponse.json({ 
      message: 'Super admin profile created successfully',
      profile: userProfile 
    });
    
  } catch (error) {
    console.error('Error creating super admin profile:', error);
    return NextResponse.json({ 
      error: 'Failed to create super admin profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
