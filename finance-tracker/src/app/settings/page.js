'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import {
    getCategories,
    createCategory,
    deleteCategory
} from '@/lib/settingsService';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Categories state
    const [categories, setCategories] = useState([]);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        type: 'expense',
        description: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setUser(user);
                loadData();
            } else {
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const loadData = async () => {
        // Load categories
        const catsResult = await getCategories();
        if (catsResult.success) {
            setCategories(catsResult.categories);
        }
    };

    // Category handlers
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const result = await createCategory(categoryForm);
        if (result.success) {
            setCategories([...categories, result.category]);
            setCategoryForm({ name: '', type: 'expense', description: '' });
            setShowCategoryForm(false);
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            const result = await deleteCategory(id);
            if (result.success) {
                setCategories(categories.filter(cat => cat.id !== id));
            } else {
                alert('Error: ' + result.error);
            }
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
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Finance Tracker</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            Dashboard
                        </button>
                        <span className="text-gray-600">{user?.email}</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Categories</h2>
                    <p className="text-gray-600 mb-6">
                        Set up your income and expense categories to organize your transactions.
                    </p>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">My Categories</h3>
                            <button
                                onClick={() => setShowCategoryForm(!showCategoryForm)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {showCategoryForm ? 'Cancel' : '+ Add Category'}
                            </button>
                        </div>

                        {showCategoryForm && (
                            <form onSubmit={handleCreateCategory} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="e.g., Groceries"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Type</label>
                                        <select
                                            value={categoryForm.type}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="expense">Expense</option>
                                            <option value="income">Income</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                        <textarea
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            rows="2"
                                            placeholder="Optional description"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Category
                                </button>
                            </form>
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
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={(e) => {
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

