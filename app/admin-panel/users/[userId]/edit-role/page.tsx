'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, AlertTriangle, Shield, User, Building, DollarSign, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROLES, getRoleDisplayName, getRoleDescription } from '@/lib/permissions'

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  username?: string
  role: string
  teamId: string
  createdAt: string
  team?: {
    name: string
  }
}

const roleIcons = {
  SUPER_ADMIN: Shield,
  ADMIN: Building,
  EMPLOYEE: User,
  SALES_PERSON: DollarSign,
  CUSTOMER: Users
}

const roleColors = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-green-100 text-green-800',
  SALES_PERSON: 'bg-yellow-100 text-yellow-800',
  CUSTOMER: 'bg-gray-100 text-gray-800'
}

export default function EditUserRolePage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setUserId(resolvedParams.userId)
    }
    initializeParams()
  }, [params])

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      const data = await response.json()
      setUser(data.user)
      setSelectedRole(data.user.role)
    } catch (err) {
      setError('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId, fetchUser]) // Include fetchUser in dependencies

  const handleSaveRole = async () => {
    if (!user || selectedRole === user.role) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: selectedRole })
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      const data = await response.json()
      setUser({ ...user, role: selectedRole })
      setSuccess('User role updated successfully')
      
      // Redirect back to admin panel after 2 seconds
      setTimeout(() => {
        router.push('/admin-panel')
      }, 2000)
    } catch (err) {
      setError('Failed to update user role')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              User not found or you don&apos;t have permission to edit this user.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const CurrentRoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User
  const NewRoleIcon = roleIcons[selectedRole as keyof typeof roleIcons] || User

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin-panel')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Panel
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit User Role</h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Current user details and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              {user.username && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <p className="text-gray-900">@{user.username}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Team</label>
                <p className="text-gray-900">{user.team?.name || 'Unknown Team'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Current Role</label>
                <div className="flex items-center gap-2 mt-1">
                  <CurrentRoleIcon className="h-4 w-4" />
                  <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getRoleDescription(user.role)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>
                Change the user&apos;s role and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select New Role
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLES).map((role) => {
                      const Icon = roleIcons[role as keyof typeof roleIcons]
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {getRoleDisplayName(role)}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && selectedRole !== user.role && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <NewRoleIcon className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      New Role: {getRoleDisplayName(selectedRole)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {getRoleDescription(selectedRole)}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Role Change Impact</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• User will be notified of the role change</p>
                  <p>• New permissions will take effect immediately</p>
                  <p>• User may need to refresh their session</p>
                  <p>• All actions will be logged for audit purposes</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveRole}
                  disabled={saving || selectedRole === user.role}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin-panel')}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
