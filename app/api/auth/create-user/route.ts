import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * POST /api/auth/create-user
 * Create a new user profile, optionally from an invitation
 */
export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, inviteToken, tenantId } = await request.json();

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, first name, and last name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.userProfile.findFirst({
      where: {
        email: email.toLowerCase(),
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    let inviteInfo = null;
    if (inviteToken) {
      // Validate invite token
      inviteInfo = await prisma.inviteToken.findUnique({
        where: { token: inviteToken },
        include: {
          inviter: {
            include: {
              tenant: true
            }
          }
        }
      });

      if (!inviteInfo || inviteInfo.used || new Date() > inviteInfo.expiresAt) {
        return NextResponse.json(
          { error: "Invalid or expired invitation token" },
          { status: 400 }
        );
      }

      // Validate email matches invite if specified
      if (inviteInfo.email && inviteInfo.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email must match the invitation email" },
          { status: 400 }
        );
      }
    }

    // Generate username from name
    const generateUsername = (firstName: string, lastName: string) => {
      const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-zA-Z0-9]/g, '');
      return base;
    };

    // Use transaction to create user and update invite
    const result = await prisma.$transaction(async (tx) => {
      // Determine tenant and role
      let userTenantId = tenantId;
      let userRole: UserRole = UserRole.CUSTOMER;
      let userTeamId = null;

      if (inviteInfo) {
        userTenantId = inviteInfo.inviter.tenantId;
        userRole = inviteInfo.role;
        userTeamId = inviteInfo.inviter.teamId;

        // Mark invite as used
        await tx.inviteToken.update({
          where: { id: inviteInfo.id },
          data: {
            used: true,
            currentUses: inviteInfo.currentUses + 1,
          }
        });
      }

      if (!userTenantId) {
        throw new Error("No tenant specified and no valid invitation provided");
      }

      // Create user profile
      const userProfile = await tx.userProfile.create({
        data: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          username: generateUsername(firstName, lastName),
          role: userRole,
          tenantId: userTenantId,
          teamId: userTeamId,
          inviteVerified: !!inviteToken, // If created from invite, mark as verified
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      });

      return userProfile;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        tenantId: result.tenantId,
        tenant: result.tenant,
      },
      message: inviteToken ? "User created from invitation" : "User created successfully"
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
