'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import { getTransactions, createTransaction, deleteTransaction, getTransactionSummary } from '@/lib/transactionService';
import { getCategories } from '@/lib/settingsService';

export default function Transactions() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState(null);
    const [showForm, setShowForm] = useState(false);
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
        // Load transactions
        const transResult = await getTransactions();
        if (transResult.success) {
            setTransactions(transResult.transactions);
        }

        // Load categories
        const catsResult = await getCategories();
        if (catsResult.success) {
            setCategories(catsResult.categories);
        }

        // Load summary
        const summaryResult = await getTransactionSummary();
        if (summaryResult.success) {
            setSummary(summaryResult.summary);
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
            month: 'short',
            day: 'numeric'
        });
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
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Transactions</h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {showForm ? 'Cancel' : '+ Add Transaction'}
                        </button>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="text-sm text-green-700 mb-1">Total Income</div>
                                <div className="text-2xl font-bold text-green-900">
                                    {formatCurrency(summary.income.total)}
                                </div>
                                <div className="text-xs text-green-600 mt-1">{summary.income.count} transactions</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <div className="text-sm text-red-700 mb-1">Total Expenses</div>
                                <div className="text-2xl font-bold text-red-900">
                                    {formatCurrency(summary.expense.total)}
                                </div>
                                <div className="text-xs text-red-600 mt-1">{summary.expense.count} transactions</div>
                            </div>
                            <div className={`p-4 rounded-lg border ${
                                summary.balance >= 0 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'bg-orange-50 border-orange-200'
                            }`}>
                                <div className={`text-sm mb-1 ${
                                    summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                                }`}>
                                    Balance
                                </div>
                                <div className={`text-2xl font-bold ${
                                    summary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'
                                }`}>
                                    {formatCurrency(summary.balance)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Transaction Form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
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

                    {/* Transactions List */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No transactions yet. Add your first transaction to get started!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {transactions.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {formatDate(transaction.transaction_date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                        transaction.type === 'income'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {transaction.category_name || 'Uncategorized'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {transaction.description || '-'}
                                                </td>
                                                <td className={`px-4 py-3 text-sm font-medium text-right ${
                                                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleDelete(transaction.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

