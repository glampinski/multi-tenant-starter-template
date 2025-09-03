import { PrismaClient } from '@prisma/client'

// Create a separate Prisma client for NextAuth to avoid connection conflicts
let nextAuthPrisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  nextAuthPrisma = new PrismaClient({
    log: ['error'],
  })
} else {
  const globalWithPrisma = global as typeof globalThis & {
    nextAuthPrisma: PrismaClient
  }
  
  if (!globalWithPrisma.nextAuthPrisma) {
    globalWithPrisma.nextAuthPrisma = new PrismaClient({
      log: ['error'],
      // Force new connections to avoid prepared statement conflicts
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=10'
        }
      }
    })
  }
  
  nextAuthPrisma = globalWithPrisma.nextAuthPrisma
}

export { nextAuthPrisma }
