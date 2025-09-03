'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEV_USERS = [
  { id: 'user_super_admin_1', name: 'Super Admin', email: 'superadmin@example.com', role: 'SUPER_ADMIN' },
  { id: 'user_admin_1', name: 'Alice Manager', email: 'alice@example.com', role: 'ADMIN' },
  { id: 'user_employee_1', name: 'Bob Worker', email: 'bob@example.com', role: 'EMPLOYEE' },
  { id: 'user_sales_1', name: 'Carol Sales', email: 'carol@example.com', role: 'SALES_PERSON' },
  { id: 'user_customer_1', name: 'Eve Customer', email: 'eve@example.com', role: 'CUSTOMER' }
];

export default function DevLoginSimplePage() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDevLogin = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser })
      });

      if (response.ok) {
        const { teamId } = await response.json();
        router.push(`/dashboard/${teamId}`);
      } else {
        throw new Error('Failed to create dev session');
      }
    } catch (error) {
      console.error('Dev login error:', error);
      alert('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">🔧 Development Login</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="user-select" className="block text-sm font-medium mb-2">
              Choose Test User:
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a test user...</option>
              {DEV_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role}) - {user.email}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDevLogin}
            disabled={!selectedUser || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login as Test User'}
          </button>

          <div className="text-center">
            <a href="/signup" className="text-sm text-blue-600 hover:underline">
              Go to Real Signup →
            </a>
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            ⚠️ This is a development-only feature. Do not use in production.
          </p>
        </div>
      </div>
    </div>
  );
}
