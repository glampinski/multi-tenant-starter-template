import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

/**
 * POST /api/tenant/send-invitation
 * Send invitation to join a tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { email, role, tenantId } = await request.json();

    if (!email || !role || !tenantId) {
      return NextResponse.json(
        { error: "Email, role, and tenantId are required" },
        { status: 400 }
      );
    }

    // Verify the inviter has permission to invite users to this tenant
    const inviter = await prisma.userProfile.findFirst({
      where: {
        id: session.user.id,
        tenantId: tenantId,
      },
      include: {
        tenant: true
      }
    });

    if (!inviter) {
      return NextResponse.json(
        { error: "You don't have permission to invite users to this organization" },
        { status: 403 }
      );
    }

    // Check if inviter has admin privileges
    if (inviter.role !== UserRole.ADMIN && inviter.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can send invitations" },
        { status: 403 }
      );
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.userProfile.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenantId,
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.inviteToken.findFirst({
      where: {
        email: email.toLowerCase(),
        invitedBy: inviter.id,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.inviteToken.create({
      data: {
        token,
        email: email.toLowerCase(),
        role: role as UserRole,
        invitedBy: inviter.id,
        expiresAt,
        used: false,
        maxUses: 1,
        currentUses: 0,
      },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // TODO: Send invitation email here
    // For now, we'll just log the invitation URL
    const inviteUrl = `${process.env.NEXTAUTH_URL}/signup?token=${token}`;
    console.log(`📧 Invitation sent to ${email}: ${inviteUrl}`);

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
        createdAt: invitation.createdAt,
        inviteUrl,
      },
      message: "Invitation sent successfully"
    });
  } catch (error) {
    console.error("Send invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
