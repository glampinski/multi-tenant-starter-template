import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/permissions';
import { stackServerApp } from '@/stack';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(new URL('/signup?error=invalid_invitation', request.url));
  }

  try {
    // Verify invitation token and check if it's valid
    const invitation = await prisma.userProfile.findFirst({
      where: {
        email: email,
        referralCode: token, // We'll use referralCode as invitation token temporarily
      }
    });

    if (!invitation) {
      return NextResponse.redirect(new URL('/signup?error=invalid_invitation', request.url));
    }

    // Redirect to Stack Auth signup with pre-filled email and invitation context
    const signupUrl = new URL('/signup', request.url);
    signupUrl.searchParams.set('email', email);
    signupUrl.searchParams.set('invitation', token);
    signupUrl.searchParams.set('teamId', invitation.teamId || '');

    return NextResponse.redirect(signupUrl);

  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.redirect(new URL('/signup?error=server_error', request.url));
  }
}
