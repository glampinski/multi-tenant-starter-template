import { type DefaultSession } from "next-auth"
import { UserRole, TenantStatus } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      teamId: string | null
      lineagePath: string[]
      inviteVerified: boolean
      // Tenant context
      tenantId: string
      tenant: {
        id: string
        name: string
        slug: string
        status: TenantStatus
        plan: string
      }
      // For users with access to multiple tenants (future feature)
      accessibleTenants?: Array<{
        id: string
        name: string
        slug: string
        role: UserRole
      }>
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: UserRole
    teamId?: string | null
    lineagePath?: string[]
    inviteVerified?: boolean
    tenantId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    teamId: string | null
    lineagePath: string[]
    inviteVerified: boolean
    tenantId: string
    tenant: {
      id: string
      name: string
      slug: string
      status: TenantStatus
      plan: string
    }
  }
}
