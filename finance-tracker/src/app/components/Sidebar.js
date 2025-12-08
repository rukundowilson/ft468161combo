'use client';

import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { navItems } from '@/app/config/navigation';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const isActive = (path) => pathname === path;

    return (
        <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col">
            {/* Logo */}
            <div className="p-6">
                <div className="text-2xl font-bold text-emerald-600">Finance</div>
                <div className="text-sm text-gray-500 font-normal">Personal Tracker</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
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
            <div className="p-4">
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
    );
}

