'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getCurrentUser } from '@/lib/auth';
import { syncCurrentUser } from '@/lib/userService';
import { getTransactions, getTransactionSummary } from '@/lib/transactionService';
import Sidebar from '@/app/components/Sidebar';
import Navbar from '@/app/components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [balanceTrendData, setBalanceTrendData] = useState([]);
  const [apiError, setApiError] = useState(null);
  const router = useRouter();

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      
      // Load summary
      const summaryResult = await getTransactionSummary();
      console.log('Summary result:', summaryResult);
      if (summaryResult.success) {
        setSummary(summaryResult.summary);
        setApiError(null);
      } else {
        console.error('Failed to load summary:', summaryResult.error);
        // Set default summary on error
        setSummary({ income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 });
        // Check if it's a timeout/connection error
        if (summaryResult.error?.includes('sleeping') || summaryResult.error?.includes('timeout')) {
          setApiError('API server is sleeping or unreachable. Data may not be up to date.');
        }
      }

      // Load all transactions for chart
      const transResult = await getTransactions();
      console.log('Transactions result:', transResult);
      if (transResult.success) {
        const transactions = transResult.transactions || [];
        setAllTransactions(transactions);
        setRecentTransactions(transactions.slice(0, 5));
        // Calculate balance trend
        calculateBalanceTrend(transactions);
      } else {
        console.error('Failed to load transactions:', transResult.error);
        setAllTransactions([]);
        setRecentTransactions([]);
        setBalanceTrendData([]);
        // Set error if not already set
        if (!apiError && (transResult.error?.includes('sleeping') || transResult.error?.includes('timeout'))) {
          setApiError('API server is sleeping or unreachable. Data may not be up to date.');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set defaults on error
      setSummary({ income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 });
      setRecentTransactions([]);
      if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
        setApiError('API server is sleeping or unreachable. Please wait a moment and refresh.');
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthChange(async (user) => {
      if (!mounted) return;

      if (user) {
        setUser(user);
        setLoading(false); // Set loading to false immediately after auth check
        
        // Sync user to database when dashboard loads (non-blocking)
        syncCurrentUser().catch(err => {
          console.error('Failed to sync user to database:', err);
        });
        
        // Load dashboard data (non-blocking)
        loadDashboardData().catch(err => {
          console.error('Failed to load dashboard data:', err);
        });
      } else {
        router.push('/');
      }
    });

    // Timeout fallback in case auth never fires
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth check timeout, checking current user');
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setLoading(false);
          loadDashboardData().catch(err => {
            console.error('Failed to load dashboard data:', err);
          });
        } else {
          setLoading(false);
          router.push('/');
        }
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [router]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const calculateBalanceTrend = (transactions) => {
    if (!transactions || transactions.length === 0) {
      setBalanceTrendData([]);
      return;
    }

    // Sort all transactions by date (oldest first)
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.transaction_date) - new Date(b.transaction_date)
    );

    // Calculate initial balance (sum of all transactions before the chart period)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Calculate starting balance from transactions before the 30-day period
    let startingBalance = 0;
    sorted.forEach(transaction => {
      const transDate = new Date(transaction.transaction_date);
      if (transDate < thirtyDaysAgo) {
        if (transaction.type === 'income') {
          startingBalance += parseFloat(transaction.amount);
        } else {
          startingBalance -= parseFloat(transaction.amount);
        }
      }
    });

    // Group transactions by date within the 30-day period
    const dateMap = new Map();
    sorted.forEach(transaction => {
      const transDate = new Date(transaction.transaction_date);
      if (transDate >= thirtyDaysAgo) {
        const dateKey = transDate.toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey).push(transaction);
      }
    });

    // Generate data points for each day in the range
    const trendData = [];
    let currentBalance = startingBalance;

    // Create array of all dates in range
    for (let i = 0; i <= 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Add transactions for this date
      const dayTransactions = dateMap.get(dateKey) || [];
      dayTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
          currentBalance += parseFloat(transaction.amount);
        } else {
          currentBalance -= parseFloat(transaction.amount);
        }
      });

      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const isToday = dateKey === today.toISOString().split('T')[0];
      const isFirst = i === 0;
      const isLast = i === 30;
      
      // Include first day, last day, today, and every 5th day
      if (isFirst || isLast || isToday || i % 5 === 0) {
        trendData.push({
          date: dateKey,
          label: isToday ? 'Today' : isFirst ? `${month} ${day}` : `${month} ${day}`,
          balance: Math.round(currentBalance * 100) / 100
        });
      }
    }

    // Ensure we have at least some data points
    if (trendData.length === 0 && sorted.length > 0) {
      // Fallback: show all transactions
      sorted.forEach(transaction => {
        if (transaction.type === 'income') {
          currentBalance += parseFloat(transaction.amount);
        } else {
          currentBalance -= parseFloat(transaction.amount);
        }
        
        const date = new Date(transaction.transaction_date);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        
        trendData.push({
          date: transaction.transaction_date,
          label: `${month} ${day}`,
          balance: Math.round(currentBalance * 100) / 100
        });
      });
    }

    setBalanceTrendData(trendData);
  };

  const getTransactionIcon = (type) => {
    if (type === 'income') {
      return (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const totalBalance = summary ? summary.balance : 0;
  const monthlyIncome = summary ? summary.income.total : 0;
  const monthlyExpense = summary ? summary.expense.total : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">

            {/* API Error Banner */}
            {apiError && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  <p className="text-sm text-yellow-800">{apiError}</p>
                  <button
                    onClick={loadDashboardData}
                    className="ml-auto px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Total Balance */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Balance</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(totalBalance)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* This Month Income */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">This Month Income</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(monthlyIncome)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* This Month Expense */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">This Month Expense</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(monthlyExpense)}
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

            {/* Balance Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Trend</h2>
              {balanceTrendData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={balanceTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#6b7280' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#6b7280' }}
                        domain={['dataMin - 200', 'dataMax + 200']}
                        tickFormatter={(value) => {
                          if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                          return `$${value}`;
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px'
                        }}
                        formatter={(value) => formatCurrency(value)}
                        labelStyle={{ color: '#374151', fontWeight: '600' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div>No transaction data available</div>
                    <div className="text-sm mt-2">Add transactions to see your balance trend</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                <button
                  onClick={() => router.push('/transactions')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  + Add Transaction
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions yet. Add your first transaction to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {transaction.description || transaction.category_name || 'Transaction'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.category_name || 'Uncategorized'}
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.transaction_date)}
                      </div>
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
