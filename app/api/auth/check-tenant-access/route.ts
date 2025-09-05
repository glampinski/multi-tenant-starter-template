import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/check-tenant-access
 * Check if a user has access to a specific tenant
 */
export async function POST(request: NextRequest) {
  try {
    const { email, tenantId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // If no tenantId provided, user can access any tenant they're associated with
    if (!tenantId) {
      return NextResponse.json({
        hasAccess: true,
        message: "No specific tenant restriction"
      });
    }

    // Check if user exists and has access to the specified tenant
    const userProfile = await prisma.userProfile.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json({
        hasAccess: false,
        message: "User not found or no access to this tenant"
      });
    }

    // Check if tenant is active
    if (userProfile.tenant.status === "SUSPENDED") {
      return NextResponse.json({
        hasAccess: false,
        message: "This organization is currently suspended"
      });
    }

    return NextResponse.json({
      hasAccess: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        tenantId: userProfile.tenantId,
        teamId: userProfile.teamId,
      },
      tenant: {
        id: userProfile.tenant.id,
        name: userProfile.tenant.name,
        slug: userProfile.tenant.slug,
        status: userProfile.tenant.status,
      }
    });
  } catch (error) {
    console.error("Tenant access check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
