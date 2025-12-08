import pool from '../config/db.js';

// Create or update user from Firebase
export const syncUser = async (req, res) => {
    try {
        const { firebase_uid, email, display_name, photo_url, email_verified } = req.body;

        // Validate required fields
        if (!firebase_uid || !email) {
            return res.status(400).json({
                success: false,
                message: 'firebase_uid and email are required'
            });
        }

        // Check if user exists
        const [existingUser] = await pool.execute(
            'SELECT * FROM users WHERE firebase_uid = ?',
            [firebase_uid]
        );

        if (existingUser.length > 0) {
            // Update existing user
            await pool.execute(
                `UPDATE users 
                 SET email = ?, display_name = ?, photo_url = ?, email_verified = ?, updated_at = NOW()
                 WHERE firebase_uid = ?`,
                [email, display_name || null, photo_url || null, email_verified || false, firebase_uid]
            );

            const [updatedUser] = await pool.execute(
                'SELECT * FROM users WHERE firebase_uid = ?',
                [firebase_uid]
            );

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                user: updatedUser[0]
            });
        } else {
            // Create new user
            const [result] = await pool.execute(
                `INSERT INTO users (firebase_uid, email, display_name, photo_url, email_verified)
                 VALUES (?, ?, ?, ?, ?)`,
                [firebase_uid, email, display_name || null, photo_url || null, email_verified || false]
            );

            const [newUser] = await pool.execute(
                'SELECT * FROM users WHERE id = ?',
                [result.insertId]
            );

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: newUser[0]
            });
        }
    } catch (error) {
        console.error('Error syncing user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get user by Firebase UID
export const getUserByFirebaseUid = async (req, res) => {
    try {
        const { firebase_uid } = req.params;

        if (!firebase_uid) {
            return res.status(400).json({
                success: false,
                message: 'firebase_uid is required'
            });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE firebase_uid = ?',
            [firebase_uid]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Error getting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get user by email
export const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'email is required'
            });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Error getting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all users (for admin purposes)
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, firebase_uid, email, display_name, email_verified, created_at, updated_at FROM users ORDER BY created_at DESC'
        );

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error getting users:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

