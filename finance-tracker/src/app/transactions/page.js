'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import { getTransactions, createTransaction, deleteTransaction, getTransactionSummary } from '@/lib/transactionService';
import { getCategories } from '@/lib/settingsService';
import Sidebar from '@/app/components/Sidebar';

export default function Transactions() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        category_id: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });
    const router = useRouter();

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
            console.log('Loading transactions page data...');
            
            // Load transactions
            const transResult = await getTransactions();
            console.log('Transactions result:', transResult);
            if (transResult.success) {
                const trans = transResult.transactions || [];
                setTransactions(trans);
                setFilteredTransactions(trans);
            } else {
                console.error('Failed to load transactions:', transResult.error);
                setTransactions([]);
                setFilteredTransactions([]);
            }

            // Load categories
            const catsResult = await getCategories();
            console.log('Categories result:', catsResult);
            if (catsResult.success) {
                setCategories(catsResult.categories || []);
            } else {
                console.error('Failed to load categories:', catsResult.error);
                setCategories([]);
            }

            // Load summary
            const summaryResult = await getTransactionSummary();
            console.log('Summary result:', summaryResult);
            if (summaryResult.success) {
                setSummary(summaryResult.summary);
            } else {
                console.error('Failed to load summary:', summaryResult.error);
                setSummary({ income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 });
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setTransactions([]);
            setCategories([]);
            setSummary({ income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await createTransaction(formData);
        if (result.success) {
            setFormData({
                amount: '',
                type: 'expense',
                category_id: '',
                description: '',
                transaction_date: new Date().toISOString().split('T')[0]
            });
            setShowForm(false);
            loadData(); // Reload transactions and summary
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const result = await deleteTransaction(id);
            if (result.success) {
                loadData(); // Reload transactions and summary
            } else {
                alert('Error: ' + result.error);
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    };

    // Filter transactions
    useEffect(() => {
        let filtered = [...transactions];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(t => 
                (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.category_name || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.type === filterType);
        }

        // Category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(t => t.category_id === parseInt(filterCategory));
        }

        setFilteredTransactions(filtered);
    }, [transactions, searchQuery, filterType, filterCategory]);

    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setFilterCategory('all');
    };

    const handleEdit = (transaction) => {
        // TODO: Implement edit functionality
        console.log('Edit transaction:', transaction);
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
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
                        <p className="text-gray-600">View and manage all your financial transactions</p>
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
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <span>+</span>
                            Add Transaction
                        </button>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                <div className="text-sm text-emerald-700 mb-1">Total Income</div>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-2xl font-bold text-emerald-900">
                                        {formatCurrency(summary.income.total)}
                                    </div>
                                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                                        +{summary.income.count}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <div className="text-sm text-red-700 mb-1">Total Expense</div>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-2xl font-bold text-red-900">
                                        {formatCurrency(summary.expense.total)}
                                    </div>
                                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                                        {summary.expense.count}
                                    </span>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg border ${
                                summary.balance >= 0 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-orange-50 border-orange-200'
                            }`}>
                                <div className={`text-sm mb-1 ${
                                    summary.balance >= 0 ? 'text-emerald-700' : 'text-orange-700'
                                }`}>
                                    Net Balance
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <div className={`text-2xl font-bold ${
                                        summary.balance >= 0 ? 'text-emerald-900' : 'text-orange-900'
                                    }`}>
                                        {formatCurrency(summary.balance)}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        summary.balance >= 0 
                                            ? 'bg-emerald-200 text-emerald-800' 
                                            : 'bg-orange-200 text-orange-800'
                                    }`}>
                                        {transactions.length} total
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Transaction Form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Transaction</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value, category_id: '' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select a category</option>
                                        {categories
                                            .filter(cat => cat.type === formData.type)
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.transaction_date}
                                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        rows="2"
                                        placeholder="Add a note about this transaction"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Add Transaction
                            </button>
                        </form>
                    )}

                    {/* Filters Section */}
                    <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span>🔍</span>
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search transactions..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-3">
                        {filteredTransactions.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                                <p>No transactions found. {transactions.length === 0 ? 'Add your first transaction to get started!' : 'Try adjusting your filters.'}</p>
                            </div>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="bg-white rounded-lg shadow-sm p-4 transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-3 h-3 rounded-full ${
                                                transaction.type === 'income' ? 'bg-emerald-600' : 'bg-red-600'
                                            }`}></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 mb-1">
                                                    {transaction.description || transaction.category_name || 'Transaction'}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        transaction.type === 'income'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {transaction.category_name || 'Uncategorized'}
                                                    </span>
                                                    <span>{formatDate(transaction.transaction_date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`text-lg font-semibold ${
                                                    transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                </div>
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                                                    transaction.type === 'income'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {transaction.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(transaction)}
                                                    className="text-gray-600 hover:text-gray-900 p-2"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(transaction.id)}
                                                    className="text-red-600 hover:text-red-800 p-2"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                </main>
            </div>
        </div>
    );
}

