'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import Sidebar from '@/app/components/Sidebar';

export default function Analytics() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setUser(user);
            } else {
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-end">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="font-medium text-gray-900">{user?.displayName || 'User'}</div>
                            <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 text-lg">👤</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <p className="text-gray-600">Analytics features coming soon...</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

