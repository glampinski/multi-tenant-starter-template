'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { PERMISSIONS } from '@/lib/permissions';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Share2, 
  Users, 
  TrendingUp, 
  Copy,
  Eye,
  Settings
} from 'lucide-react';

interface ReferralData {
  id: string;
  username: string;
  referralCode: string;
  totalReferrals: number;
  directReferrals: number;
  totalEarnings: number;
  referralTree: ReferralNode[];
}

interface ReferralNode {
  id: string;
  username: string;
  name: string;
  role: string;
  level: number;
  joinedAt: string;
  earnings: number;
  children: ReferralNode[];
}

export function ReferralManagement({ teamId }: { teamId?: string }) {
  // Always call hooks in the same order, regardless of user state
  const user = useUser(); // Remove 'redirect' to prevent conditional behavior
  const { hasPermission, getUserRole } = useRolePermissions();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Early return after all hooks are called
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  // Get the current team or use the first available team
  const currentTeamId = teamId || user.selectedTeam?.id;

  // Generate unique username/referral code from Stack Auth user data
  const generateUsername = (user: any) => {
    if (!user) return '';
    
    // Use Stack Auth user ID or email to create unique username
    const baseUsername = user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                        user.primaryEmail?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') ||
                        user.id.substring(0, 8);
    
    return baseUsername;
  };

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from our API
      const [analyticsResponse, treeResponse] = await Promise.all([
        fetch(`/api/referrals/analytics/${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/referrals/tree/${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!analyticsResponse.ok || !treeResponse.ok) {
        throw new Error('Failed to fetch referral data');
      }

      const analyticsData = await analyticsResponse.json();
      const treeData = await treeResponse.json();

      const referralData: ReferralData = {
        id: user.id,
        username: generateUsername(user),
        referralCode: `REF${user.id.substring(0, 6).toUpperCase()}`,
        totalReferrals: analyticsData.totalReferrals || 0,
        directReferrals: analyticsData.directReferrals || 0,
        totalEarnings: analyticsData.totalEarnings || 0,
        referralTree: treeData.tree || []
      };

      setReferralData(referralData);
    } catch (error) {
      console.error('Error loading referral data:', error);
      
      // Fallback to empty data if API fails
      setReferralData({
        id: user.id,
        username: generateUsername(user),
        referralCode: `REF${user.id.substring(0, 6).toUpperCase()}`,
        totalReferrals: 0,
        directReferrals: 0,
        totalEarnings: 0,
        referralTree: []
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = (username: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';
    const referralLink = `${baseUrl}/${username}`;
    
    navigator.clipboard.writeText(referralLink);
    // In a real app, you'd show a toast notification here
    alert('Referral link copied to clipboard!');
  };

  const canSeeMultiTier = () => {
    if (!currentTeamId) return false;
    
    // Use existing role permissions to determine visibility
    return hasPermission(currentTeamId, PERMISSIONS.VIEW_COMPANY_DATA) || 
           hasPermission(currentTeamId, PERMISSIONS.VIEW_ALL_DATA);
  };

  const getVisibleTiers = () => {
    if (!currentTeamId) return 1;
    
    // Role-based tier visibility using existing permissions
    if (hasPermission(currentTeamId, PERMISSIONS.VIEW_ALL_DATA)) return 999; // Super Admin
    if (hasPermission(currentTeamId, PERMISSIONS.VIEW_COMPANY_DATA)) return 3; // Admin
    if (hasPermission(currentTeamId, PERMISSIONS.INVITE_CUSTOMERS)) return 2; // Sales Person
    return 1; // Employee/Customer - only direct referrals
  };

  const renderReferralNode = (node: ReferralNode, currentLevel: number = 0) => {
    const maxTiers = getVisibleTiers();
    
    if (currentLevel >= maxTiers) return null;

    return (
      <div key={node.id} className="ml-4 border-l-2 border-gray-200 pl-4 py-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{node.name}</h4>
              <p className="text-sm text-gray-600">@{node.username}</p>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {node.role}
              </span>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                ${node.earnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                Level {node.level}
              </p>
            </div>
          </div>

          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-500">yourapp.com/</span>
            <span className="font-mono">{node.username}</span>
            <Button 
              size="sm" 
              variant="outline"
              className="ml-2 h-6 px-2"
              onClick={() => copyReferralLink(node.username)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </Card>

        {/* Children (if user can see them) */}
        {node.children && currentLevel < maxTiers - 1 && (
          <div className="mt-2">
            {node.children.map(child => renderReferralNode(child, currentLevel + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Unable to load referral data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Your Referral Network</h2>
        <p className="text-blue-100">
          Share your unique link and earn rewards when people join
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Network</p>
              <p className="text-2xl font-bold text-blue-600">{referralData.totalReferrals}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Direct Referrals</p>
              <p className="text-2xl font-bold text-green-600">{referralData.directReferrals}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-purple-600">${referralData.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Visible Tiers</p>
              <p className="text-2xl font-bold text-orange-600">{getVisibleTiers()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Your Referral Link */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Referral Link</h3>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 p-3 bg-gray-50 rounded border">
            <span className="text-gray-500">yourapp.com/</span>
            <span className="font-mono font-semibold">{referralData.username}</span>
          </div>
          <Button onClick={() => copyReferralLink(referralData.username)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
        
        <p className="text-sm text-gray-600">
          Share this link with others. When they sign up, you'll earn rewards and they'll be added to your network!
        </p>
      </Card>

      {/* Multi-Tier Network Tree */}
      {canSeeMultiTier() && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Referral Network</h3>
            <span className="text-sm text-gray-500">
              Showing {getVisibleTiers()} tier{getVisibleTiers() > 1 ? 's' : ''} based on your role
            </span>
          </div>
          
          <div className="space-y-2">
            {referralData.referralTree.length > 0 ? (
              referralData.referralTree.map(node => renderReferralNode(node))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No referrals yet. Share your link to get started!</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Permissions Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-2">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Role-Based Access</h4>
            <p className="text-sm text-blue-700">
              Your referral network visibility is based on your role permissions. 
              You can see {getVisibleTiers()} tier{getVisibleTiers() > 1 ? 's' : ''} of your network.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
