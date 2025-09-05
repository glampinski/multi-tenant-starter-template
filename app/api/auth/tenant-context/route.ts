import { NextRequest, NextResponse } from "next/server";
import { TenantManager } from "@/lib/tenant-manager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/auth/tenant-context
 * Fetch tenant information by slug or domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const domain = searchParams.get("domain");

    if (!slug && !domain) {
      return NextResponse.json(
        { error: "Missing slug or domain parameter" },
        { status: 400 }
      );
    }

    let tenant = null;

    if (slug) {
      tenant = await TenantManager.getTenant(slug, 'slug');
    } else if (domain) {
      // Extract slug from domain (e.g., company.yourapp.com -> company)
      const extractedSlug = domain.split('.')[0];
      tenant = await TenantManager.getTenant(extractedSlug, 'slug');
    }

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Return basic tenant information (no sensitive data)
    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      }
    });
  } catch (error) {
    console.error("Tenant context fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
