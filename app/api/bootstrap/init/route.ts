import { NextResponse } from "next/server";
import crypto from "crypto";
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(
    new TextEncoder().encode(a), 
    new TextEncoder().encode(b)
  );
}

export async function POST(req: Request) {
  // Check if bootstrap is enabled
  if (process.env.BOOTSTRAP_ENABLED !== "true") {
    console.log("🚫 Bootstrap: Disabled via environment");
    return NextResponse.json({ error: "Bootstrap disabled" }, { status: 403 });
  }

  // Verify bootstrap token
  const token = req.headers.get("x-bootstrap-token") || "";
  const secret = process.env.BOOTSTRAP_TOKEN || "";
  
  if (!secret || !token || !safeEq(token, secret)) {
    console.log("🚫 Bootstrap: Invalid or missing token");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if any super admins already exist
      const existingSuperAdmins = await tx.userProfile.count({
        where: { role: UserRole.SUPER_ADMIN }
      });

      if (existingSuperAdmins > 0) {
        console.log("⚠️ Bootstrap: Super admin already exists");
        return { error: "Already initialized", status: 409 };
      }

      const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
      const name = process.env.BOOTSTRAP_ADMIN_NAME || "Super Admin";

      if (!email) {
        return { error: "Bootstrap admin email not configured", status: 500 };
      }

      console.log("🚀 Bootstrap: Creating super admin...");

      // Use raw SQL to bypass Prisma schema issues temporarily
      const username = `${email.split('@')[0]}_bootstrap`;
      const referralCode = `SUPER_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const adminId = crypto.randomUUID();
      
      // First create the NextAuth User record
      await tx.$executeRaw`
        INSERT INTO users (id, email, name, "emailVerified")
        VALUES (
          ${adminId},
          ${email},
          ${name},
          NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `;

      // Then create the UserProfile record
      await tx.$executeRaw`
        INSERT INTO user_profiles (
          id, username, role, "firstName", "lastName", email, "teamId", 
          "referralCode", "inviteVerified", "lineagePath", "createdAt", "updatedAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${username},
          'SUPER_ADMIN',
          ${name.split(' ')[0] || 'Super'},
          ${name.split(' ').slice(1).join(' ') || 'Admin'},
          ${email},
          'main_team',
          ${referralCode},
          true,
          ARRAY[]::text[],
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `;

      console.log("✅ Bootstrap: Super admin created successfully");
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Username: ${username}`);

      return { 
        success: true, 
        data: {
          adminEmail: email,
          adminId: adminId,
          username: username,
          signInUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`
        }
      };

    }, { isolationLevel: "Serializable" });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error("💥 Bootstrap error:", error);
    return NextResponse.json({ 
      error: "Bootstrap failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
