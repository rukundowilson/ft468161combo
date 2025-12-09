'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, updateUserProfile, deleteUserAccount, logout } from '@/lib/auth';
import { syncUserToDatabase, deleteUserFromDatabase } from '@/lib/userService';
import Sidebar from '@/app/components/Sidebar';
import Navbar from '@/app/components/Navbar';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        fullName: '',
        email: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setUser(user);
                setFormData({
                    fullName: user.displayName || '',
                    email: user.email || ''
                });
            } else {
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSaveProfile = async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveMessage({ type: '', text: '' });

        try {
            // Update Firebase profile
            const result = await updateUserProfile(formData.fullName, formData.email);
            
            if (result.success) {
                // Sync to database
                const syncResult = await syncUserToDatabase(result.user);
                if (syncResult.success) {
                    setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
                    // Update local user state
                    setUser(result.user);
                    // Clear message after 3 seconds
                    setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
                } else {
                    setSaveMessage({ type: 'error', text: 'Profile updated in Firebase but failed to sync to database.' });
                }
            } else {
                setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setSaveMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        if (deleteConfirmText !== 'DELETE') {
            setSaveMessage({ type: 'error', text: 'Please type "DELETE" to confirm.' });
            return;
        }

        setIsDeleting(true);
        setSaveMessage({ type: '', text: '' });
        setShowDeleteModal(false);

        try {
            // First delete from database
            const dbResult = await deleteUserFromDatabase(user.uid);
            
            if (dbResult.success) {
                // Then delete from Firebase
                const firebaseResult = await deleteUserAccount();
                
                if (firebaseResult.success) {
                    // Logout and redirect
                    await logout();
                    router.push('/');
                } else {
                    setSaveMessage({ type: 'error', text: firebaseResult.error || 'Failed to delete Firebase account.' });
                    setIsDeleting(false);
                }
            } else {
                setSaveMessage({ type: 'error', text: dbResult.error || 'Failed to delete account from database.' });
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            setSaveMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                <Navbar />

                <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-4xl mx-auto w-full">
                        
                        {/* Tabs */}
                        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-hidden">
                            <div className="flex border-b border-gray-200 overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                                        activeTab === 'profile'
                                            ? 'bg-gray-50 text-gray-900 border-b-2 border-emerald-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-sm sm:text-base">Profile</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('preferences')}
                                    className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                                        activeTab === 'preferences'
                                            ? 'bg-gray-50 text-gray-900 border-b-2 border-emerald-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-sm sm:text-base">Preferences</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('account')}
                                    className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                                        activeTab === 'account'
                                            ? 'bg-gray-50 text-gray-900 border-b-2 border-emerald-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-sm sm:text-base">Account</span>
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4 sm:p-6">
                                {activeTab === 'profile' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                                        {saveMessage.text && (
                                            <div className={`mb-4 p-3 rounded-lg ${
                                                saveMessage.type === 'success' 
                                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                                                    : 'bg-red-50 border border-red-200 text-red-800'
                                            }`}>
                                                <p className="text-sm">{saveMessage.text}</p>
                                            </div>
                                        )}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    placeholder="Enter your full name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <p className="text-sm text-gray-500">Change your password</p>
                                                    <button
                                                        className="px-4 py-2 bg-gray-100 text-emerald-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        Change Password
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="pt-4">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={isSaving}
                                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors font-medium"
                                                >
                                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'preferences' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">App Preferences</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                                <select className="w-full px-3 py-2 border-2 border-emerald-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                    <option value="USD">US Dollar (USD)</option>
                                                    <option value="EUR">Euro (EUR)</option>
                                                    <option value="GBP">British Pound (GBP)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Notifications</label>
                                                        <p className="text-sm text-gray-500">Get notified about transactions</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'account' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Account</h3>
                                        <div className="space-y-6">
                                            <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                                                {saveMessage.text && saveMessage.type === 'error' && (
                                                    <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-800">
                                                        <p className="text-sm">{saveMessage.text}</p>
                                                    </div>
                                                )}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h4>
                                                        <p className="text-sm font-medium text-gray-900 mb-1">Delete Account</p>
                                                        <p className="text-sm text-red-700">This action cannot be undone</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setShowDeleteModal(true);
                                                            setDeleteConfirmText('');
                                                            setSaveMessage({ type: '', text: '' });
                                                        }}
                                                        disabled={isDeleting}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium whitespace-nowrap w-full sm:w-auto"
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowDeleteModal(false);
                        setDeleteConfirmText('');
                        setSaveMessage({ type: '', text: '' });
                    }
                }}>
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-red-900 mb-2">Delete Account</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                Are you absolutely sure you want to delete your account? This will permanently delete:
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-700 mb-4 space-y-1">
                                <li>Your account</li>
                                <li>All your transactions</li>
                                <li>All your categories</li>
                            </ul>
                            <p className="text-sm font-semibold text-red-700 mb-4">
                                This action CANNOT be undone.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Type DELETE here"
                                    autoFocus
                                />
                            </div>
                            {saveMessage.text && saveMessage.type === 'error' && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                                    {saveMessage.text}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                    setSaveMessage({ type: '', text: '' });
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
