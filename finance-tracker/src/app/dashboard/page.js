'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getCurrentUser } from '@/lib/auth';
import { syncCurrentUser } from '@/lib/userService';
import { getTransactions, getTransactionSummary } from '@/lib/transactionService';
import Sidebar from '@/app/components/Sidebar';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
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

      // Load recent transactions (last 5)
      const transResult = await getTransactions();
      console.log('Transactions result:', transResult);
      if (transResult.success) {
        setRecentTransactions(transResult.transactions.slice(0, 5));
      } else {
        console.error('Failed to load transactions:', transResult.error);
        setRecentTransactions([]);
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

  const getTransactionIcon = (type) => {
    return type === 'income' ? '📈' : '☕';
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
        {/* Top Header */}
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

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

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
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Balance</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(totalBalance)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              {/* This Month Income */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">This Month Income</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(monthlyIncome)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>

              {/* This Month Expense */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">This Month Expense</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(monthlyExpense)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📉</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Trend</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <div>Chart visualization coming soon</div>
                  <div className="text-sm mt-2">Balance data is available for chart integration</div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
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
                        <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
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
