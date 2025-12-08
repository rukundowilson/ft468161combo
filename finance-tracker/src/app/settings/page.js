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
                                                <div className="font-medium">{cat.name}</div>
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
    );
}

