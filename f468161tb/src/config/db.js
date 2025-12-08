import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

// Read .env file directly to avoid system env var conflicts
// USER is a system variable on Linux, so we need to check .env explicitly
let envVars = {};
try {
	const envPath = resolve(process.cwd(), '.env');
	const envContent = readFileSync(envPath, 'utf8');
	envContent.split('\n').forEach(line => {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith('#')) {
			const match = trimmed.match(/^([^=]+)=(.*)$/);
			if (match) {
				const key = match[1].trim();
				const value = match[2].trim();
				envVars[key] = value;
			}
		}
	});
} catch (err) {
	console.warn('Could not read .env file directly:', err.message);
}

// Get database configuration
// Priority: Standard DB_* variables > Render custom vars (HOST, USER, etc.) > .env file > defaults
// Note: On Linux, USER is a system variable, so we must check Render's env vars before process.env.USER
const dbHost = process.env.DB_HOST 
	|| process.env.HOST  // Render uses HOST for database host
	|| envVars.HOST 
	|| 'localhost';

// For USER, we need to check Render's env var first (from .env file or explicit setting)
// because process.env.USER is a system variable on Linux
const dbUser = process.env.DB_USER 
	|| envVars.USER  // Check .env file first
	|| (process.env.USER && process.env.USER !== 'render' ? process.env.USER : null) // Only use if not system default
	|| 'root';

const dbName = process.env.DB_NAME 
	|| process.env.DATABASENAME  // Render uses DATABASENAME
	|| envVars.DATABASENAME 
	|| 'test';

// Prioritize DB_PORT to avoid conflicts with APP_PORT
// Render uses PORT for database port, but we check DB_PORT first
const dbPort = parseInt(
	process.env.DB_PORT 
	|| process.env.PORT  // Render uses PORT for database port (3306)
	|| envVars.DB_PORT 
	|| envVars.PORT 
	|| '3306'
);

const dbPassword = process.env.DB_PASSWORD 
	|| process.env.PASSWORD  // Render uses PASSWORD
	|| envVars.PASSWORD 
	|| '';

// Debug: Log environment variables (without sensitive data)
console.log('Environment variables check:');
console.log(`  process.env.HOST: ${process.env.HOST || 'not set'}`);
console.log(`  process.env.USER: ${process.env.USER || 'not set'}`);
console.log(`  process.env.DATABASENAME: ${process.env.DATABASENAME || 'not set'}`);
console.log(`  process.env.PORT: ${process.env.PORT || 'not set'}`);
console.log(`  envVars.HOST: ${envVars.HOST || 'not set'}`);
console.log(`  envVars.USER: ${envVars.USER || 'not set'}`);

console.log('\nDatabase connection config:');
console.log(`  Host: ${dbHost}`);
console.log(`  User: ${dbUser}`);
console.log(`  Database: ${dbName}`);
console.log(`  Port: ${dbPort}`);

const pool = mysql.createPool({
	host: dbHost,
	user: dbUser,
	password: dbPassword,
	database: dbName,
	port: dbPort,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	connectTimeout: 10000, // 10 second timeout
});

export default pool;