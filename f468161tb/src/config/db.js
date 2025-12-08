import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
// Supports both naming conventions:
// - Local .env: DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT
// - Render: HOST, USER, PASSWORD, DATABASENAME, PORT
const dbConfig = {
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASS || '',
	database: process.env.DB_NAME || 'test',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	connectTimeout: 10000, // 10 second timeout
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,
};

// Log connection details (without password) for debugging
console.log('Database connection config:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  Port: ${dbConfig.port}`);
console.log(`  Password: ${dbConfig.password ? '***set***' : 'not set'}`);

// Create connection pool (using promise version for async/await)
const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
	.then((connection) => {
		console.log('✅ Database connection successful!');
		connection.release();
	})
	.catch((error) => {
		console.error('❌ Database connection failed:');
		console.error(`  Error: ${error.message}`);
		console.error('  Please check your environment variables:');
		console.error('    - HOST');
		console.error('    - USER');
		console.error('    - PASSWORD');
		console.error('    - DATABASENAME');
		console.error('    - PORT');
		// Don't exit - let the server start and show the error
	});

// Handle pool errors
pool.on('error', (err) => {
	console.error('❌ Database pool error:', err);
	if (err.code === 'PROTOCOL_CONNECTION_LOST') {
		console.log('Attempting to reconnect to database...');
	}
});

export default pool;
