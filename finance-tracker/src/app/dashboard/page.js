'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, onAuthChange } from '@/lib/auth';
import { syncCurrentUser } from '@/lib/userService';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setUser(user);
        // Sync user to database when dashboard loads
        const syncResult = await syncCurrentUser();
        if (syncResult.error) {
          console.error('Failed to sync user to database:', syncResult.error);
          // Continue even if sync fails - user is authenticated
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Close user info dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserInfo && !event.target.closest('.user-info-container')) {
        setShowUserInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserInfo]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Finance Tracker</h1>
          <div className="flex items-center gap-4 relative user-info-container">
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="User Info"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {showUserInfo && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px] z-10">
                <div className="text-sm text-gray-600 mb-1">Signed in as</div>
                <div className="font-medium text-gray-900">{user?.email}</div>
                {user?.displayName && (
                  <div className="text-sm text-gray-600 mt-1">{user.displayName}</div>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Get Started Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/settings')}
                className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <div>
                    <div className="font-medium text-gray-900">Create Categories</div>
                    <div className="text-sm text-gray-500 mt-1">Set up your income and expense categories</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


