import pool from '../config/db.js';

// Get all account types
export const getAccountTypes = async (req, res) => {
    try {
        const [accountTypes] = await pool.execute(
            'SELECT * FROM account_types ORDER BY name ASC'
        );

        return res.status(200).json({
            success: true,
            count: accountTypes.length,
            accountTypes
        });
    } catch (error) {
        console.error('Error getting account types:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get account type by ID
export const getAccountTypeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [accountTypes] = await pool.execute(
            'SELECT * FROM account_types WHERE id = ?',
            [id]
        );

        if (accountTypes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account type not found'
            });
        }

        return res.status(200).json({
            success: true,
            accountType: accountTypes[0]
        });
    } catch (error) {
        console.error('Error getting account type:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create account type (admin function)
export const createAccountType = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO account_types (name, description, icon)
             VALUES (?, ?, ?)`,
            [name, description || null, icon || null]
        );

        const [newAccountType] = await pool.execute(
            'SELECT * FROM account_types WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Account type created successfully',
            accountType: newAccountType[0]
        });
    } catch (error) {
        console.error('Error creating account type:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

