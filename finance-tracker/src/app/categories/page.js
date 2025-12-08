'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import {
    getCategories,
    createCategory,
    deleteCategory
} from '@/lib/settingsService';
import Sidebar from '@/app/components/Sidebar';

export default function Categories() {
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
        try {
            console.log('Loading categories page data...');
            // Load categories
            const catsResult = await getCategories();
            console.log('Categories result:', catsResult);
            if (catsResult.success) {
                setCategories(catsResult.categories || []);
            } else {
                console.error('Failed to load categories:', catsResult.error);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
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
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
                                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                    >
                                        Create Category
                                    </button>
                                </form>
                            )}

                            {categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No categories yet. Create your first category to get started!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className="p-4 border rounded-lg flex justify-between items-center hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">📁</span>
                                                <div>
                                                    <div className="font-medium text-gray-900">{cat.name}</div>
                                                    <div className="text-sm text-gray-500 capitalize">{cat.type}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

