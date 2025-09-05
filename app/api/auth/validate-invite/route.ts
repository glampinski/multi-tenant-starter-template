import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/validate-invite
 * Validate invitation token and return invite information
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invite token and include related information
    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                plan: true,
                primaryColor: true,
                logoUrl: true,
              }
            }
          }
        }
      }
    });

    if (!inviteToken) {
      return NextResponse.json({
        isValid: false,
        isExpired: false,
        message: "Invalid invitation token"
      });
    }

    // Check if token is expired
    const isExpired = new Date() > inviteToken.expiresAt;

    // Check if token is already used
    const isUsed = inviteToken.used;

    const tenant = inviteToken.inviter?.tenant;
    const isValid = !isExpired && !isUsed && tenant?.status !== "SUSPENDED";

    return NextResponse.json({
      id: inviteToken.id,
      email: inviteToken.email,
      role: inviteToken.role,
      firstName: null, // Not stored in invite token
      lastName: null,  // Not stored in invite token
      invitedBy: inviteToken.inviter ? 
        `${inviteToken.inviter.firstName} ${inviteToken.inviter.lastName}` :
        "System Administrator",
      tenant: tenant || null,
      isValid,
      isExpired,
      isUsed,
      message: !isValid ? 
        (isExpired ? "Invitation has expired" : 
         isUsed ? "Invitation has already been used" :
         "Organization is suspended") :
        "Valid invitation"
    });
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
