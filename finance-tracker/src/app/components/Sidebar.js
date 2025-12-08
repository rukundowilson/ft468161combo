'use client';

import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const isActive = (path) => pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/transactions', label: 'Transactions', icon: '✈️' },
        { path: '/categories', label: 'Categories', icon: '🏷️' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
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
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <span className="text-xl">🚪</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}

