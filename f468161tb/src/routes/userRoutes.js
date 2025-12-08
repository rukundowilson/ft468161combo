import express from 'express';
import {
    syncUser,
    getUserByFirebaseUid,
    getUserByEmail,
    getAllUsers
} from '../controllers/userController.js';

const router = express.Router();

// Sync/create user from Firebase
router.post('/sync', syncUser);

// Get user by Firebase UID
router.get('/firebase/:firebase_uid', getUserByFirebaseUid);

// Get user by email
router.get('/email/:email', getUserByEmail);

// Get all users
router.get('/all', getAllUsers);

export default router;

