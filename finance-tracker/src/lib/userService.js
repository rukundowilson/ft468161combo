import api from '@/config/axios';
import { auth } from './firebase';

/**
 * Sync user from Firebase to the database
 * This should be called after successful Firebase authentication
 */
export const syncUserToDatabase = async (firebaseUser) => {
    try {
        if (!firebaseUser) {
            throw new Error('No Firebase user provided');
        }

        // Get Firebase ID token for authentication
        const token = await firebaseUser.getIdToken();
        
        // Prepare user data
        const userData = {
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email,
            display_name: firebaseUser.displayName || null,
            photo_url: firebaseUser.photoURL || null,
            email_verified: firebaseUser.emailVerified || false
        };

        // Store token in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
            localStorage.setItem('firebaseToken', token);
        }

        // Sync user to database
        const response = await api.post('/users/sync', userData);
        
        if (response.data.success) {
            return {
                success: true,
                user: response.data.user,
                message: response.data.message
            };
        } else {
            throw new Error(response.data.message || 'Failed to sync user');
        }
    } catch (error) {
        console.error('Error syncing user to database:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to sync user to database'
        };
    }
};

/**
 * Get user from database by Firebase UID
 */
export const getUserFromDatabase = async (firebaseUid) => {
    try {
        if (!firebaseUid) {
            throw new Error('Firebase UID is required');
        }

        const response = await api.get(`/users/firebase/${firebaseUid}`);
        
        if (response.data.success) {
            return {
                success: true,
                user: response.data.user
            };
        } else {
            throw new Error(response.data.message || 'User not found');
        }
    } catch (error) {
        console.error('Error getting user from database:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to get user from database'
        };
    }
};

/**
 * Sync current authenticated user to database
 */
export const syncCurrentUser = async () => {
    try {
        if (!auth || !auth.currentUser) {
            return {
                success: false,
                error: 'No authenticated user'
            };
        }

        return await syncUserToDatabase(auth.currentUser);
    } catch (error) {
        console.error('Error syncing current user:', error);
        return {
            success: false,
            error: error.message || 'Failed to sync current user'
        };
    }
};

