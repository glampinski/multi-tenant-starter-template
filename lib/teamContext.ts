import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Enhanced request interface with team context
 */
export interface TeamContextRequest extends NextRequest {
  teamId?: string;
  userProfile?: {
    id: string;
    role: string;
    teamId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

/**
 * Team context middleware to inject team information into requests
 * This ensures all API endpoints have access to the user's team context
 */
export function withTeamContext<T extends any[]>(
  handler: (req: TeamContextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get the session
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' }, 
          { status: 401 }
        );
      }

      // Get user profile with team information
      const userProfile = await prisma.userProfile.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          teamId: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (!userProfile) {
        return NextResponse.json(
          { error: 'Unauthorized - User profile not found' }, 
          { status: 401 }
        );
      }

      if (!userProfile.teamId) {
        return NextResponse.json(
          { error: 'Forbidden - User not assigned to a team' }, 
          { status: 403 }
        );
      }

      // Enhance the request with team context
      const enhancedReq = req as TeamContextRequest;
      enhancedReq.teamId = userProfile.teamId;
      enhancedReq.userProfile = userProfile;

      // Call the original handler with enhanced request
      return await handler(enhancedReq, ...args);

    } catch (error) {
      console.error('Team context middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Utility function to get team context from request
 * Use this in API handlers that use withTeamContext
 */
export function getTeamContext(req: TeamContextRequest) {
  if (!req.teamId || !req.userProfile) {
    throw new Error('Team context not available - ensure withTeamContext middleware is used');
  }

  return {
    teamId: req.teamId,
    userProfile: req.userProfile,
    userId: req.userProfile.id,
    userRole: req.userProfile.role
  };
}

/**
 * Helper function to create team-scoped where clause
 * Ensures all database queries are properly scoped to the user's team
 */
export function createTeamScopedWhere(req: TeamContextRequest, additionalWhere: any = {}) {
  const { teamId } = getTeamContext(req);
  
  return {
    ...additionalWhere,
    teamId: teamId
  };
}

/**
 * Helper function for role-based data filtering
 * Sales people should only see their own customers, etc.
 */
export function createRoleBasedWhere(req: TeamContextRequest, additionalWhere: any = {}) {
  const { teamId, userProfile } = getTeamContext(req);
  
  let roleWhere = {};
  
  // Apply role-based filtering
  switch (userProfile.role) {
    case 'SUPER_ADMIN':
      // Super admin can see everything across all teams
      roleWhere = additionalWhere;
      break;
      
    case 'ADMIN':
    case 'EMPLOYEE':
      // Admin and Employee can see all data within their team
      roleWhere = {
        ...additionalWhere,
        teamId: teamId
      };
      break;
      
    case 'SALES_PERSON':
      // Sales people can only see their own customers and sales
      roleWhere = {
        ...additionalWhere,
        teamId: teamId,
        salesPersonId: userProfile.id
      };
      break;
      
    case 'CUSTOMER':
      // Customers can only see their own data
      roleWhere = {
        ...additionalWhere,
        teamId: teamId,
        // For customer-related data, filter by the customer's own ID
        ...(additionalWhere.customerId ? { customerId: userProfile.id } : {})
      };
      break;
      
    default:
      // Default to team-scoped for unknown roles
      roleWhere = {
        ...additionalWhere,
        teamId: teamId
      };
  }
  
  return roleWhere;
}

/**
 * Validate team access for specific operations
 * Ensures users can only access resources within their team
 */
export async function validateTeamAccess(
  req: TeamContextRequest, 
  resourceTeamId: string | null
): Promise<boolean> {
  const { teamId, userProfile } = getTeamContext(req);
  
  // Super admin can access any team
  if (userProfile.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // All other roles must match team
  return teamId === resourceTeamId;
}
