import api from '@/config/axios';
import { auth } from './firebase';

// Helper to get Firebase UID
const getFirebaseUid = async () => {
    if (auth && auth.currentUser) {
        return auth.currentUser.uid;
    }
    return null;
};

// ============ CATEGORIES ============
export const getCategories = async (type = null) => {
    try {
        const firebaseUid = await getFirebaseUid();
        if (!firebaseUid) {
            console.error('No Firebase UID available for categories');
            return { success: false, error: 'User not authenticated', categories: [] };
        }
        
        const params = new URLSearchParams({ firebase_uid: firebaseUid });
        if (type) params.append('type', type);
        
        console.log('Fetching categories with params:', params.toString());
        const response = await api.get(`/categories?${params.toString()}`);
        console.log('Categories response:', response.data);
        return { success: true, categories: response.data.categories || [] };
    } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Check if it's a timeout or connection error
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isNetworkError = !error.response && error.request;
        
        if (isTimeout || isNetworkError) {
            console.warn('API server may be sleeping or unreachable.');
        }
        
        const errorMessage = isTimeout || isNetworkError 
            ? (typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'Backend server is not running. Please start it with: cd f468161tb && npm run dev'
                : 'API server is not responding. It may be sleeping (Render free tier).')
            : (error.response?.data?.message || error.message);
        
        return { 
            success: false, 
            error: errorMessage,
            categories: [] 
        };
    }
};

export const createCategory = async (categoryData) => {
    try {
        const firebaseUid = await getFirebaseUid();
        if (!firebaseUid) {
            return { success: false, error: 'User not authenticated' };
        }
        
        const response = await api.post('/categories', {
            ...categoryData,
            firebase_uid: firebaseUid
        });
        return { success: true, category: response.data.category };
    } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isNetworkError = !error.response && error.request;
        
        const errorMessage = isTimeout || isNetworkError 
            ? (typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'Backend server is not running. Please start it with: cd f468161tb && npm run dev'
                : 'API server is waking up. This may take 30-60 seconds. Please try again in a moment.')
            : (error.response?.data?.message || error.message);
        
        return { 
            success: false, 
            error: errorMessage
        };
    }
};

export const updateCategory = async (id, categoryData) => {
    try {
        const response = await api.put(`/categories/${id}`, categoryData);
        return { success: true, category: response.data.category };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

export const deleteCategory = async (id) => {
    try {
        const firebaseUid = await getFirebaseUid();
        const response = await api.delete(`/categories/${id}?firebase_uid=${firebaseUid}`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

