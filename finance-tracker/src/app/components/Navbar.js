'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange, logout } from '@/lib/auth';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [showUserInfo, setShowUserInfo] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

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

    const isActive = (path) => pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo and Main Navigation */}
                    <div className="flex items-center gap-8">
                        <h1 
                            className="text-2xl font-bold text-gray-900 cursor-pointer"
                            onClick={() => router.push('/dashboard')}
                        >
                            Finance Tracker
                        </h1>
                        <div className="hidden md:flex items-center gap-1">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isActive('/dashboard')
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => router.push('/transactions')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isActive('/transactions')
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Transactions
                            </button>
                            <button
                                onClick={() => router.push('/settings')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isActive('/settings')
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-4 relative user-info-container">
                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setShowUserInfo(!showUserInfo)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            {showUserInfo && (
                                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-20">
                                    <button
                                        onClick={() => { router.push('/dashboard'); setShowUserInfo(false); }}
                                        className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                                            isActive('/dashboard') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => { router.push('/transactions'); setShowUserInfo(false); }}
                                        className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                                            isActive('/transactions') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        Transactions
                                    </button>
                                    <button
                                        onClick={() => { router.push('/settings'); setShowUserInfo(false); }}
                                        className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                                            isActive('/settings') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        Settings
                                    </button>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <div className="px-4 py-2 text-sm text-gray-600">
                                        {user?.email}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Desktop User Menu */}
                        <div className="hidden md:flex items-center gap-4">
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
                </div>
            </div>
        </nav>
    );
}




