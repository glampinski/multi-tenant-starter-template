import { prisma } from './prisma';

// Export the same Prisma instance for NextAuth adapter to avoid connection conflicts
export const nextAuthPrisma = prisma;
