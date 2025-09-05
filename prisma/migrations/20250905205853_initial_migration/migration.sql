-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'SALES_PERSON', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'PENDING_SETUP');

-- CreateEnum
CREATE TYPE "public"."TenantPlan" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REWARDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED');

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "description" TEXT,
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "plan" "public"."TenantPlan" NOT NULL DEFAULT 'FREE',
    "settings" JSONB,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#10B981',
    "customCss" TEXT,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxStorage" BIGINT NOT NULL DEFAULT 1073741824,
    "maxApiCalls" INTEGER NOT NULL DEFAULT 10000,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "billingEmail" TEXT,
    "subscriptionStartsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "companyName" TEXT,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT DEFAULT 'main_team',
    "inviteVerified" BOOLEAN NOT NULL DEFAULT false,
    "lineagePath" TEXT[],
    "referralCode" TEXT,
    "referrerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."magic_link_tokens" (
    "id" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "inviteTokenId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invite_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."magic_link_rate_limits" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."active_token_counts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "maxAllowed" INTEGER NOT NULL DEFAULT 3,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_token_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."step_up_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "mfaMethod" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "step_up_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mfa_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret" TEXT,
    "credentialId" TEXT,
    "publicKey" TEXT,
    "counter" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "mfa_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."referral_relationships" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referralLink" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),

    CONSTRAINT "referral_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_rewards" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "baseAmount" DECIMAL(10,2),
    "percentage" DECIMAL(5,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "status" "public"."CustomerStatus" NOT NULL DEFAULT 'LEAD',
    "source" TEXT,
    "priority" TEXT,
    "estimatedValue" DECIMAL(10,2),
    "actualValue" DECIMAL(10,2),
    "salesPersonId" TEXT,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT DEFAULT 'main_team',
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContactAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_activities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "outcome" TEXT,
    "customerId" TEXT NOT NULL,
    "salesPersonId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT DEFAULT 'main_team',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "referralBonusRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "maxReferralLevels" INTEGER NOT NULL DEFAULT 5,
    "maxMembers" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "teamId" TEXT NOT NULL DEFAULT 'main_team',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL DEFAULT 'main_team',
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "public"."tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "public"."tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_domain_idx" ON "public"."tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "public"."tenants"("status");

-- CreateIndex
CREATE INDEX "tenant_audit_logs_tenantId_createdAt_idx" ON "public"."tenant_audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "tenant_audit_logs_tenantId_action_idx" ON "public"."tenant_audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "tenant_audit_logs_tenantId_entityType_entityId_idx" ON "public"."tenant_audit_logs"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "public"."user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_username_key" ON "public"."user_profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_referralCode_key" ON "public"."user_profiles"("referralCode");

-- CreateIndex
CREATE INDEX "user_profiles_tenantId_idx" ON "public"."user_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "user_profiles_tenantId_role_idx" ON "public"."user_profiles"("tenantId", "role");

-- CreateIndex
CREATE INDEX "user_profiles_tenantId_teamId_idx" ON "public"."user_profiles"("tenantId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_tokens_hashedToken_key" ON "public"."magic_link_tokens"("hashedToken");

-- CreateIndex
CREATE INDEX "magic_link_tokens_email_used_expiresAt_idx" ON "public"."magic_link_tokens"("email", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "magic_link_tokens_hashedToken_idx" ON "public"."magic_link_tokens"("hashedToken");

-- CreateIndex
CREATE INDEX "magic_link_tokens_email_createdAt_idx" ON "public"."magic_link_tokens"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "public"."invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_tokens_token_used_expiresAt_idx" ON "public"."invite_tokens"("token", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "magic_link_rate_limits_identifier_type_action_windowStart_idx" ON "public"."magic_link_rate_limits"("identifier", "type", "action", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_rate_limits_identifier_type_action_key" ON "public"."magic_link_rate_limits"("identifier", "type", "action");

-- CreateIndex
CREATE UNIQUE INDEX "active_token_counts_email_key" ON "public"."active_token_counts"("email");

-- CreateIndex
CREATE INDEX "active_token_counts_email_idx" ON "public"."active_token_counts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "step_up_sessions_sessionToken_key" ON "public"."step_up_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "step_up_sessions_userId_operation_idx" ON "public"."step_up_sessions"("userId", "operation");

-- CreateIndex
CREATE INDEX "step_up_sessions_sessionToken_idx" ON "public"."step_up_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "step_up_sessions_expiresAt_idx" ON "public"."step_up_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "mfa_devices_userId_type_idx" ON "public"."mfa_devices"("userId", "type");

-- CreateIndex
CREATE INDEX "security_audit_logs_userId_action_createdAt_idx" ON "public"."security_audit_logs"("userId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "security_audit_logs_action_createdAt_idx" ON "public"."security_audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "security_audit_logs_createdAt_idx" ON "public"."security_audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "referral_relationships_tenantId_idx" ON "public"."referral_relationships"("tenantId");

-- CreateIndex
CREATE INDEX "referral_relationships_tenantId_status_idx" ON "public"."referral_relationships"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "referral_relationships_referrerId_referredId_key" ON "public"."referral_relationships"("referrerId", "referredId");

-- CreateIndex
CREATE INDEX "referral_rewards_tenantId_idx" ON "public"."referral_rewards"("tenantId");

-- CreateIndex
CREATE INDEX "referral_rewards_tenantId_userId_idx" ON "public"."referral_rewards"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "customers_tenantId_idx" ON "public"."customers"("tenantId");

-- CreateIndex
CREATE INDEX "customers_tenantId_status_idx" ON "public"."customers"("tenantId", "status");

-- CreateIndex
CREATE INDEX "customers_tenantId_salesPersonId_idx" ON "public"."customers"("tenantId", "salesPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_tenantId_key" ON "public"."customers"("email", "tenantId");

-- CreateIndex
CREATE INDEX "sales_activities_tenantId_idx" ON "public"."sales_activities"("tenantId");

-- CreateIndex
CREATE INDEX "sales_activities_tenantId_salesPersonId_idx" ON "public"."sales_activities"("tenantId", "salesPersonId");

-- CreateIndex
CREATE INDEX "sales_activities_tenantId_customerId_idx" ON "public"."sales_activities"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "team_settings_tenantId_idx" ON "public"."team_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "team_settings_name_tenantId_key" ON "public"."team_settings"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "public"."permissions"("module", "action");

-- CreateIndex
CREATE INDEX "role_permissions_tenantId_idx" ON "public"."role_permissions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_tenantId_teamId_key" ON "public"."role_permissions"("role", "permissionId", "tenantId", "teamId");

-- CreateIndex
CREATE INDEX "user_permissions_tenantId_idx" ON "public"."user_permissions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_tenantId_teamId_key" ON "public"."user_permissions"("userId", "permissionId", "tenantId", "teamId");

-- AddForeignKey
ALTER TABLE "public"."tenant_audit_logs" ADD CONSTRAINT "tenant_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_inviteTokenId_fkey" FOREIGN KEY ("inviteTokenId") REFERENCES "public"."invite_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invite_tokens" ADD CONSTRAINT "invite_tokens_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."step_up_sessions" ADD CONSTRAINT "step_up_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mfa_devices" ADD CONSTRAINT "mfa_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_audit_logs" ADD CONSTRAINT "security_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_relationships" ADD CONSTRAINT "referral_relationships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_relationships" ADD CONSTRAINT "referral_relationships_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_relationships" ADD CONSTRAINT "referral_relationships_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "public"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_rewards" ADD CONSTRAINT "referral_rewards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_rewards" ADD CONSTRAINT "referral_rewards_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "public"."referral_relationships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_rewards" ADD CONSTRAINT "referral_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_activities" ADD CONSTRAINT "sales_activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_activities" ADD CONSTRAINT "sales_activities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_activities" ADD CONSTRAINT "sales_activities_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "public"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_settings" ADD CONSTRAINT "team_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
