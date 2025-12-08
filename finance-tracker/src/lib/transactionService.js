import api from '@/config/axios';
import { auth } from './firebase';

// Helper to get Firebase UID
const getFirebaseUid = async () => {
    if (auth && auth.currentUser) {
        return auth.currentUser.uid;
    }
    return null;
};

// ============ TRANSACTIONS ============
export const getTransactions = async (filters = {}) => {
    try {
        const firebaseUid = await getFirebaseUid();
        if (!firebaseUid) {
            console.error('No Firebase UID available');
            return { success: false, error: 'User not authenticated', transactions: [] };
        }
        
        const params = new URLSearchParams({ firebase_uid: firebaseUid });
        
        if (filters.type) params.append('type', filters.type);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.category_id) params.append('category_id', filters.category_id);
        
        console.log('Fetching transactions with params:', params.toString());
        const response = await api.get(`/transactions?${params.toString()}`);
        console.log('Transactions response:', response.data);
        return { success: true, transactions: response.data.transactions || [] };
    } catch (error) {
        console.error('Error fetching transactions:', error);
        
        // Check if it's a timeout or connection error
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isNetworkError = !error.response && error.request;
        
        if (isTimeout || isNetworkError) {
            console.warn('API server may be sleeping or unreachable.');
        }
        
        return { 
            success: false, 
            error: isTimeout || isNetworkError 
                ? 'API server is not responding. It may be sleeping (Render free tier).' 
                : (error.response?.data?.message || error.message), 
            transactions: [] 
        };
    }
};

export const createTransaction = async (transactionData) => {
    try {
        const firebaseUid = await getFirebaseUid();
        const response = await api.post('/transactions', {
            ...transactionData,
            firebase_uid: firebaseUid
        });
        return { success: true, transaction: response.data.transaction };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

export const updateTransaction = async (id, transactionData) => {
    try {
        const firebaseUid = await getFirebaseUid();
        const response = await api.put(`/transactions/${id}`, {
            ...transactionData,
            firebase_uid: firebaseUid
        });
        return { success: true, transaction: response.data.transaction };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

export const deleteTransaction = async (id) => {
    try {
        const firebaseUid = await getFirebaseUid();
        const response = await api.delete(`/transactions/${id}?firebase_uid=${firebaseUid}`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

export const getTransactionSummary = async (filters = {}) => {
    try {
        const firebaseUid = await getFirebaseUid();
        if (!firebaseUid) {
            console.error('No Firebase UID available for summary');
            return { 
                success: false, 
                error: 'User not authenticated',
                summary: { income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 }
            };
        }
        
        const params = new URLSearchParams({ firebase_uid: firebaseUid });
        
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        
        console.log('Fetching transaction summary with params:', params.toString());
        const response = await api.get(`/transactions/summary?${params.toString()}`);
        console.log('Summary response:', response.data);
        return { success: true, summary: response.data.summary };
    } catch (error) {
        console.error('Error fetching summary:', error);
        
        // Check if it's a timeout or connection error
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isNetworkError = !error.response && error.request;
        
        if (isTimeout || isNetworkError) {
            console.warn('API server may be sleeping or unreachable. Using default values.');
        }
        
        // Return default summary on error
        return { 
            success: false, 
            error: isTimeout || isNetworkError 
                ? 'API server is not responding. It may be sleeping (Render free tier).' 
                : (error.response?.data?.message || error.message),
            summary: { income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 }
        };
    }
};

