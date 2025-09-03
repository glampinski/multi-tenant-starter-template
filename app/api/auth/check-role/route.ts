import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find user profile by email
    const userProfile = await prisma.userProfile.findFirst({
      where: { email },
      select: { role: true }
    });
    
    if (!userProfile) {
      return NextResponse.json({ role: null }, { status: 200 });
    }
    
    return NextResponse.json({ role: userProfile.role }, { status: 200 });
    
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
