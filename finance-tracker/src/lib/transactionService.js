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
        const params = new URLSearchParams({ firebase_uid: firebaseUid });
        
        if (filters.type) params.append('type', filters.type);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.category_id) params.append('category_id', filters.category_id);
        
        const response = await api.get(`/transactions?${params.toString()}`);
        return { success: true, transactions: response.data.transactions };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
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
        const params = new URLSearchParams({ firebase_uid: firebaseUid });
        
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        
        const response = await api.get(`/transactions/summary?${params.toString()}`);
        return { success: true, summary: response.data.summary };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

