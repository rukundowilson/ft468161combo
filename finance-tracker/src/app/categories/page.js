'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import {
    getCategories,
    createCategory,
    deleteCategory,
    updateCategory
} from '@/lib/settingsService';
import { getTransactions } from '@/lib/transactionService';
import Sidebar from '@/app/components/Sidebar';

export default function Categories() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('expense');
    const router = useRouter();

    // Categories state
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [categoryStats, setCategoryStats] = useState(new Map());
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
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

            // Load transactions to calculate stats
            const transResult = await getTransactions();
            if (transResult.success) {
                const trans = transResult.transactions || [];
                setTransactions(trans);
                calculateCategoryStats(trans);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
            setTransactions([]);
        }
    };

    const calculateCategoryStats = (transactions) => {
        const stats = new Map();
        
        transactions.forEach(transaction => {
            const categoryId = transaction.category_id;
            if (!categoryId) return;

            if (!stats.has(categoryId)) {
                stats.set(categoryId, { count: 0, total: 0 });
            }

            const stat = stats.get(categoryId);
            stat.count += 1;
            stat.total += parseFloat(transaction.amount);
        });

        setCategoryStats(stats);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Category handlers
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const result = await createCategory(categoryForm);
        if (result.success) {
            setCategories([...categories, result.category]);
            setCategoryForm({ name: '', type: 'expense', description: '' });
            setShowCategoryForm(false);
            loadData();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            type: category.type,
            description: category.description || ''
        });
        setShowCategoryForm(true);
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory) return;
        
        const result = await updateCategory(editingCategory.id, categoryForm);
        if (result.success) {
            setCategories(categories.map(cat => 
                cat.id === editingCategory.id ? result.category : cat
            ));
            setCategoryForm({ name: '', type: 'expense', description: '' });
            setShowCategoryForm(false);
            setEditingCategory(null);
            loadData();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            const result = await deleteCategory(id);
            if (result.success) {
                setCategories(categories.filter(cat => cat.id !== id));
                loadData();
            } else {
                alert('Error: ' + result.error);
            }
        }
    };

    const filteredCategories = categories.filter(cat => cat.type === activeTab);
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    const incomeCategories = categories.filter(cat => cat.type === 'income');

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
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
                            <p className="text-gray-600">Organize your income and expense categories</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mb-6">
                            <button
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <span>📥</span>
                                Export CSV
                            </button>
                            <button
                                onClick={() => {
                                    setEditingCategory(null);
                                    setCategoryForm({ name: '', type: activeTab, description: '' });
                                    setShowCategoryForm(!showCategoryForm);
                                }}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            >
                                <span>+</span>
                                Add Category
                            </button>
                        </div>

                        {/* Category Form */}
                        {showCategoryForm && (
                            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h3>
                                <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={categoryForm.name}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="e.g., Groceries"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select
                                                value={categoryForm.type}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="expense">Expense</option>
                                                <option value="income">Income</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                        <textarea
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            rows="2"
                                            placeholder="Optional description"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            {editingCategory ? 'Update Category' : 'Create Category'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCategoryForm(false);
                                                setEditingCategory(null);
                                                setCategoryForm({ name: '', type: 'expense', description: '' });
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <div className="flex gap-6 border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => setActiveTab('expense')}
                                    className={`pb-4 px-1 font-medium transition-colors relative ${
                                        activeTab === 'expense'
                                            ? 'text-emerald-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Expense Categories
                                    {activeTab === 'expense' && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('income')}
                                    className={`pb-4 px-1 font-medium transition-colors relative ${
                                        activeTab === 'income'
                                            ? 'text-emerald-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Income Categories
                                    {activeTab === 'income' && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></span>
                                    )}
                                </button>
                            </div>

                            {/* Category Cards */}
                            {filteredCategories.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-4xl mb-3">📁</div>
                                    <p className="text-lg font-medium mb-1">No {activeTab} categories yet</p>
                                    <p className="text-sm">Create your first {activeTab} category to get started!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredCategories.map((cat) => {
                                        const stats = categoryStats.get(cat.id) || { count: 0, total: 0 };
                                        return (
                                            <div
                                                key={cat.id}
                                                className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <span className="text-2xl">📁</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{cat.name}</div>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                                                                cat.type === 'expense'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {cat.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditCategory(cat)}
                                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat.id)}
                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Transactions</span>
                                                        <span className="font-medium text-gray-900">{stats.count} transactions</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Total</span>
                                                        <span className="font-semibold text-gray-900">{formatCurrency(stats.total)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
