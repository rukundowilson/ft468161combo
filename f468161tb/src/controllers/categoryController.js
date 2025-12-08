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

// Create category
export const createCategory = async (req, res) => {
    try {
        const { name, type, icon, color, description, is_default } = req.body;
        const firebaseUid = req.user?.firebase_uid || req.body.firebase_uid; // Get from auth or body

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'name and type are required'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'type must be either "income" or "expense"'
            });
        }

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        // Set default icon for all categories
        const defaultIcon = '📁';

        const [result] = await pool.execute(
            `INSERT INTO categories (user_id, name, type, icon, color, description, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, name, type, defaultIcon, null, description || null, is_default || false]
        );

        const [newCategory] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: newCategory[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all categories for a user
export const getCategories = async (req, res) => {
    try {
        const firebaseUid = req.user?.firebase_uid || req.query.firebase_uid;
        const { type } = req.query; // Optional filter by type

        if (!firebaseUid) {
            return res.status(400).json({
                success: false,
                message: 'firebase_uid is required'
            });
        }

        const userId = await getUserIdFromFirebaseUid(firebaseUid);

        // Build query: if userId exists, get user's categories + defaults, otherwise just defaults
        let query = userId 
            ? 'SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL'
            : 'SELECT * FROM categories WHERE user_id IS NULL';
        let params = userId ? [userId] : [];

        if (type && ['income', 'expense'].includes(type)) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY is_default DESC, name ASC';

        const [categories] = await pool.execute(query, params);

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        return res.status(200).json({
            success: true,
            category: categories[0]
        });
    } catch (error) {
        console.error('Error getting category:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, icon, color, description, is_default } = req.body;

        // Check if category exists
        const [existing] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Update category
        await pool.execute(
            `UPDATE categories 
             SET name = ?, type = ?, icon = ?, color = ?, description = ?, is_default = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                name || existing[0].name,
                type || existing[0].type,
                icon !== undefined ? icon : existing[0].icon,
                color !== undefined ? color : existing[0].color,
                description !== undefined ? description : existing[0].description,
                is_default !== undefined ? is_default : existing[0].is_default,
                id
            ]
        );

        const [updated] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            category: updated[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const [existing] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

