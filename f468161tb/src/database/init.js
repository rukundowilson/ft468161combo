import pool from '../config/db.js';

/**
 * Initialize database tables
 * Creates tables if they don't exist
 */
export const initializeDatabase = async () => {
    try {
        console.log('Initializing database...');

        // Create users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firebase_uid VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                display_name VARCHAR(255),
                photo_url TEXT,
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_firebase_uid (firebase_uid),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✓ Users table created/verified successfully');

        // Create categories table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                icon VARCHAR(100),
                color VARCHAR(7),
                description TEXT,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_type (type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✓ Categories table created/verified successfully');

        // Create transactions table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category_id INT,
                amount DECIMAL(10, 2) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                description TEXT,
                transaction_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_category_id (category_id),
                INDEX idx_transaction_date (transaction_date),
                INDEX idx_type (type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✓ Transactions table created/verified successfully');

        // Test connection
        const [rows] = await pool.execute('SELECT 1 as test');
        console.log('✓ Database connection successful');

        return {
            success: true,
            message: 'Database initialized successfully'
        };
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Run initialization if called directly (via npm script)
if (process.argv[1] && process.argv[1].includes('init.js')) {
    initializeDatabase()
        .then(() => {
            console.log('Database initialization complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

