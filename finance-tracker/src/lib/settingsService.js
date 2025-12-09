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
        const url = type 
            ? `/categories?firebase_uid=${firebaseUid}&type=${type}`
            : `/categories?firebase_uid=${firebaseUid}`;
        
        const response = await api.get(url);
        return { success: true, categories: response.data.categories };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

export const createCategory = async (categoryData) => {
    try {
        const firebaseUid = await getFirebaseUid();
        const response = await api.post('/categories', {
            ...categoryData,
            firebase_uid: firebaseUid
        });
        return { success: true, category: response.data.category };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
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
        const response = await api.delete(`/categories/${id}`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

