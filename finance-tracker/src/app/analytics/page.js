'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import { getTransactions, getTransactionSummary } from '@/lib/transactionService';
import Sidebar from '@/app/components/Sidebar';
import Navbar from '@/app/components/Navbar';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [analytics, setAnalytics] = useState({
        topCategory: { name: 'N/A', amount: 0 },
        ytdIncome: 0,
        ytdExpense: 0,
        monthlyData: [],
        categoryData: [],
        savingsRate: 0,
        avgMonthlyExpense: 0,
        avgMonthlyIncome: 0
    });
    const router = useRouter();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const calculateAnalytics = (transactions) => {
        if (!transactions || transactions.length === 0) {
            return;
        }

        const today = new Date();
        const yearStart = new Date(today.getFullYear(), 0, 1);
        
        // Filter YTD transactions
        const ytdTransactions = transactions.filter(t => 
            new Date(t.transaction_date) >= yearStart
        );

        // Calculate YTD totals
        let ytdIncome = 0;
        let ytdExpense = 0;
        const categoryMap = new Map();
        const monthlyMap = new Map();

        ytdTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            const date = new Date(transaction.transaction_date);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            
            if (transaction.type === 'income') {
                ytdIncome += amount;
                
                // Monthly income
                if (!monthlyMap.has(month)) {
                    monthlyMap.set(month, { month, income: 0, expense: 0 });
                }
                monthlyMap.get(month).income += amount;
            } else {
                ytdExpense += amount;
                
                // Monthly expense
                if (!monthlyMap.has(month)) {
                    monthlyMap.set(month, { month, income: 0, expense: 0 });
                }
                monthlyMap.get(month).expense += amount;

                // Category spending - handle null/empty category names
                let categoryName = transaction.category_name;
                if (!categoryName || categoryName.trim() === '') {
                    categoryName = 'Uncategorized';
                }
                if (!categoryMap.has(categoryName)) {
                    categoryMap.set(categoryName, 0);
                }
                categoryMap.set(categoryName, categoryMap.get(categoryName) + amount);
            }
        });

        // Find top category
        let topCategory = { name: 'N/A', amount: 0 };
        categoryMap.forEach((amount, name) => {
            if (amount > topCategory.amount) {
                topCategory = { name, amount };
            }
        });

        // Convert category map to array for pie chart
        const categoryData = Array.from(categoryMap.entries())
            .map(([name, value]) => ({
                name,
                value: Math.round(value * 100) / 100
            }))
            .filter(item => item.value > 0) // Only show categories with spending
            .sort((a, b) => b.value - a.value);

        // Debug logging
        console.log('Category breakdown:', categoryData);
        console.log('Total categories found:', categoryData.length);

        // Convert monthly map to array and sort by month
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = Array.from(monthlyMap.values())
            .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
            .map(item => ({
                month: item.month,
                income: Math.round(item.income * 100) / 100,
                expense: Math.round(item.expense * 100) / 100
            }));

        // Calculate averages
        const uniqueMonths = new Set(monthlyData.map(d => d.month)).size;
        const avgMonthlyIncome = uniqueMonths > 0 ? ytdIncome / uniqueMonths : 0;
        const avgMonthlyExpense = uniqueMonths > 0 ? ytdExpense / uniqueMonths : 0;

        // Calculate savings rate
        const savingsRate = ytdIncome > 0 
            ? Math.round(((ytdIncome - ytdExpense) / ytdIncome) * 100) 
            : 0;

        setAnalytics({
            topCategory,
            ytdIncome,
            ytdExpense,
            monthlyData,
            categoryData,
            savingsRate,
            avgMonthlyExpense: Math.round(avgMonthlyExpense * 100) / 100,
            avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100
        });
    };

    const loadAnalytics = async () => {
        try {
            const transResult = await getTransactions();
            if (transResult.success) {
                setTransactions(transResult.transactions || []);
                calculateAnalytics(transResult.transactions || []);
            } else {
                console.error('Failed to load transactions:', transResult.error);
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            setTransactions([]);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setUser(user);
                loadAnalytics();
            } else {
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Colors for pie chart
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
                <Navbar />

                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6">
                            <p className="text-gray-600">Visualize your spending patterns and financial insights</p>
                        </div>

                        {/* Top Row - Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Top Category */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Top Category</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(analytics.topCategory.amount)}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">{analytics.topCategory.name}</div>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Total Income YTD */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Total Income (YTD)</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(analytics.ytdIncome)}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Total Expense YTD */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Total Expense (YTD)</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(analytics.ytdExpense)}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row - Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Income vs Expense Bar Chart */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expense</h2>
                                {analytics.monthlyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analytics.monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value) => formatCurrency(value)}
                                            />
                                            <Legend />
                                            <Bar dataKey="income" fill="#10b981" name="income" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="expense" fill="#ef4444" name="expense" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-gray-500">
                                        No data available
                                    </div>
                                )}
                            </div>

                            {/* Spending by Category Pie Chart */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
                                {analytics.categoryData.length > 0 ? (
                                    <div>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={analytics.categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {analytics.categoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'white', 
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value) => formatCurrency(value)}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Category List */}
                                        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                                            {analytics.categoryData.map((category, index) => (
                                                <div key={category.name} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        ></div>
                                                        <span className="text-gray-700">{category.name}</span>
                                                    </div>
                                                    <span className="font-medium text-gray-900">{formatCurrency(category.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-gray-500">
                                        No spending data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Row - Summary Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Savings Rate */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="text-sm text-gray-600 mb-1">Savings Rate</div>
                                <div className={`text-3xl font-bold ${analytics.savingsRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {analytics.savingsRate}%
                                </div>
                            </div>

                            {/* Average Monthly Expense */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="text-sm text-gray-600 mb-1">Average Monthly Expense</div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(analytics.avgMonthlyExpense)}
                                </div>
                            </div>

                            {/* Average Monthly Income */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="text-sm text-gray-600 mb-1">Average Monthly Income</div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(analytics.avgMonthlyIncome)}
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown - Detailed List */}
                        {analytics.categoryData.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">All Categories Breakdown</h2>
                                <div className="space-y-3">
                                    {analytics.categoryData.map((category, index) => {
                                        const totalExpense = analytics.ytdExpense;
                                        const percentage = totalExpense > 0 ? (category.value / totalExpense * 100).toFixed(1) : 0;
                                        return (
                                            <div key={category.name} className="flex items-center gap-4">
                                                <div 
                                                    className="w-4 h-4 rounded-full flex-shrink-0" 
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                ></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-gray-900">{category.name}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(category.value)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="h-2 rounded-full transition-all"
                                                            style={{ 
                                                                width: `${percentage}%`,
                                                                backgroundColor: COLORS[index % COLORS.length]
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">{percentage}% of total expenses</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
