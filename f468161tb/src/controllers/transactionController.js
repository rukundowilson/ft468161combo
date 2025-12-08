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

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const { category_id, amount, type, description, transaction_date } = req.body;
        const firebaseUid = req.user?.firebase_uid || req.body.firebase_uid;

        if (!amount || !type || !transaction_date) {
            return res.status(400).json({
                success: false,
                message: 'amount, type, and transaction_date are required'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'type must be either "income" or "expense"'
            });
        }

        // Validate amount is positive
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'amount must be greater than 0'
            });
        }

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        if (!userId) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                category_id || null,
                parseFloat(amount),
                type,
                description || null,
                transaction_date
            ]
        );

        const [newTransaction] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.type as category_type
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction: newTransaction[0]
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all transactions for a user
export const getTransactions = async (req, res) => {
    try {
        const firebaseUid = req.user?.firebase_uid || req.query.firebase_uid;
        const { type, start_date, end_date, category_id } = req.query;

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        if (!userId) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let query = `
            SELECT t.*, c.name as category_name, c.type as category_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        `;
        let params = [userId];

        if (type && ['income', 'expense'].includes(type)) {
            query += ' AND t.type = ?';
            params.push(type);
        }

        if (start_date) {
            query += ' AND t.transaction_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND t.transaction_date <= ?';
            params.push(end_date);
        }

        if (category_id) {
            query += ' AND t.category_id = ?';
            params.push(category_id);
        }

        query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

        const [transactions] = await pool.execute(query, params);

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        console.error('Error getting transactions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.firebase_uid || req.query.firebase_uid;

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        const [transactions] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.type as category_type
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ? AND t.user_id = ?`,
            [id, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        return res.status(200).json({
            success: true,
            transaction: transactions[0]
        });
    } catch (error) {
        console.error('Error getting transaction:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update transaction
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, type, description, transaction_date } = req.body;
        const firebaseUid = req.user?.firebase_uid || req.body.firebase_uid;

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        // Check if transaction exists and belongs to user
        const [existing] = await pool.execute(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Validate amount if provided
        if (amount !== undefined && parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'amount must be greater than 0'
            });
        }

        // Update transaction
        await pool.execute(
            `UPDATE transactions 
             SET category_id = ?, amount = ?, type = ?, description = ?, transaction_date = ?, updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [
                category_id !== undefined ? category_id : existing[0].category_id,
                amount !== undefined ? parseFloat(amount) : existing[0].amount,
                type || existing[0].type,
                description !== undefined ? description : existing[0].description,
                transaction_date || existing[0].transaction_date,
                id,
                userId
            ]
        );

        const [updated] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.type as category_type
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            transaction: updated[0]
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.firebase_uid || req.query.firebase_uid;

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        // Check if transaction exists and belongs to user
        const [existing] = await pool.execute(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        await pool.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);

        return res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get transaction summary (totals by type)
export const getTransactionSummary = async (req, res) => {
    try {
        const firebaseUid = req.user?.firebase_uid || req.query.firebase_uid;
        const { start_date, end_date } = req.query;

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        if (!userId) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let query = `
            SELECT 
                type,
                SUM(amount) as total,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
        `;
        let params = [userId];

        if (start_date) {
            query += ' AND transaction_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND transaction_date <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY type';

        const [summary] = await pool.execute(query, params);

        const income = summary.find(s => s.type === 'income') || { total: 0, count: 0 };
        const expense = summary.find(s => s.type === 'expense') || { total: 0, count: 0 };
        const balance = parseFloat(income.total) - parseFloat(expense.total);

        return res.status(200).json({
            success: true,
            summary: {
                income: {
                    total: parseFloat(income.total),
                    count: income.count
                },
                expense: {
                    total: parseFloat(expense.total),
                    count: expense.count
                },
                balance: balance
            }
        });
    } catch (error) {
        console.error('Error getting transaction summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};




