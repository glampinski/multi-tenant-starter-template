import { type DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      teamId: string | null
      lineagePath: string[]
      inviteVerified: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: UserRole
    teamId?: string | null
    lineagePath?: string[]
    inviteVerified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    teamId: string | null
    lineagePath: string[]
    inviteVerified: boolean
  }
}
