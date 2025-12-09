'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange, logout, getCurrentUser } from '@/lib/auth';
import { navItems } from '@/app/config/navigation';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
        });
        // Fallback to get current user if auth hasn't fired yet
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        return () => unsubscribe();
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuOpen && !event.target.closest('header')) {
                setMobileMenuOpen(false);
            }
        };

        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [mobileMenuOpen]);

    const isActive = (path) => pathname === path;

    const getPageTitle = () => {
        const activeItem = navItems.find(item => item.path === pathname);
        return activeItem ? activeItem.label : 'Dashboard';
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleNavClick = (path) => {
        router.push(path);
        setMobileMenuOpen(false);
    };

    return (
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center relative">
            <div className="flex items-center gap-4 flex-1">
                {/* Hamburger Menu Button (Mobile Only) */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                {/* Page Title */}
                <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                    <div className="font-medium text-gray-900">{user?.displayName || 'User'}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 lg:hidden">
                    <div className="p-4">
                        {/* Logo */}
                        <div className="mb-6 pb-4 border-b border-gray-200">
                            <div className="text-2xl font-bold text-emerald-600">Finance</div>
                            <div className="text-sm text-gray-500 font-normal">Personal Tracker</div>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-2 mb-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavClick(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive(item.path)
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className={isActive(item.path) ? 'text-white' : 'text-gray-600'}>
                                        {item.icon}
                                    </span>
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Sign Out */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
