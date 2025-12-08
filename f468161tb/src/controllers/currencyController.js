import pool from '../config/db.js';

// Get all currencies
export const getCurrencies = async (req, res) => {
    try {
        const [currencies] = await pool.execute(
            'SELECT * FROM currencies ORDER BY is_default DESC, code ASC'
        );

        return res.status(200).json({
            success: true,
            count: currencies.length,
            currencies
        });
    } catch (error) {
        console.error('Error getting currencies:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get currency by code
export const getCurrencyByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const [currencies] = await pool.execute(
            'SELECT * FROM currencies WHERE code = ?',
            [code.toUpperCase()]
        );

        if (currencies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Currency not found'
            });
        }

        return res.status(200).json({
            success: true,
            currency: currencies[0]
        });
    } catch (error) {
        console.error('Error getting currency:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create currency (admin function)
export const createCurrency = async (req, res) => {
    try {
        const { code, name, symbol, is_default } = req.body;

        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: 'code and name are required'
            });
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await pool.execute(
                'UPDATE currencies SET is_default = FALSE WHERE is_default = TRUE'
            );
        }

        const [result] = await pool.execute(
            `INSERT INTO currencies (code, name, symbol, is_default)
             VALUES (?, ?, ?, ?)`,
            [code.toUpperCase(), name, symbol || null, is_default || false]
        );

        const [newCurrency] = await pool.execute(
            'SELECT * FROM currencies WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Currency created successfully',
            currency: newCurrency[0]
        });
    } catch (error) {
        console.error('Error creating currency:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

