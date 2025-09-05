import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/check-user-exists
 * Check if a user with the given email already exists
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists in the database
    const existingUser = await prisma.userProfile.findFirst({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
      }
    });

    return NextResponse.json({
      exists: !!existingUser,
      message: existingUser ? "User already exists" : "User does not exist"
    });
  } catch (error) {
    console.error("Check user exists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
