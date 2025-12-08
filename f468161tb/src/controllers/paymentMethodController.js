import pool from '../config/db.js';

// Get user ID from Firebase UID (helper function)
const getUserIdFromFirebaseUid = async (firebaseUid) => {
    if (!firebaseUid) return null;
    const [users] = await pool.execute(
        'SELECT id FROM users WHERE firebase_uid = ?',
        [firebaseUid]
    );
    return users.length > 0 ? users[0].id : null;
};

// Create payment method
export const createPaymentMethod = async (req, res) => {
    try {
        const { name, type, icon, description, is_default } = req.body;
        const firebaseUid = req.user?.firebase_uid || req.body.firebase_uid;

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'name and type are required'
            });
        }

        if (!['cash', 'card', 'bank', 'digital', 'other'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'type must be one of: cash, card, bank, digital, other'
            });
        }

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        const [result] = await pool.execute(
            `INSERT INTO payment_methods (user_id, name, type, icon, description, is_default)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name, type, icon || null, description || null, is_default || false]
        );

        const [newPaymentMethod] = await pool.execute(
            'SELECT * FROM payment_methods WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Payment method created successfully',
            paymentMethod: newPaymentMethod[0]
        });
    } catch (error) {
        console.error('Error creating payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all payment methods for a user
export const getPaymentMethods = async (req, res) => {
    try {
        const firebaseUid = req.user?.firebase_uid || req.query.firebase_uid;

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        const [paymentMethods] = await pool.execute(
            'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, name ASC',
            [userId]
        );

        return res.status(200).json({
            success: true,
            count: paymentMethods.length,
            paymentMethods
        });
    } catch (error) {
        console.error('Error getting payment methods:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get payment method by ID
export const getPaymentMethodById = async (req, res) => {
    try {
        const { id } = req.params;

        const [paymentMethods] = await pool.execute(
            'SELECT * FROM payment_methods WHERE id = ?',
            [id]
        );

        if (paymentMethods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        return res.status(200).json({
            success: true,
            paymentMethod: paymentMethods[0]
        });
    } catch (error) {
        console.error('Error getting payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update payment method
export const updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, icon, description, is_default } = req.body;

        const [existing] = await pool.execute(
            'SELECT * FROM payment_methods WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        await pool.execute(
            `UPDATE payment_methods 
             SET name = ?, type = ?, icon = ?, description = ?, is_default = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                name || existing[0].name,
                type || existing[0].type,
                icon !== undefined ? icon : existing[0].icon,
                description !== undefined ? description : existing[0].description,
                is_default !== undefined ? is_default : existing[0].is_default,
                id
            ]
        );

        const [updated] = await pool.execute(
            'SELECT * FROM payment_methods WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Payment method updated successfully',
            paymentMethod: updated[0]
        });
    } catch (error) {
        console.error('Error updating payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete payment method
export const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            'SELECT * FROM payment_methods WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        await pool.execute('DELETE FROM payment_methods WHERE id = ?', [id]);

        return res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

