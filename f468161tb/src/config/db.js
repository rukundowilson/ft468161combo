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

// Get database user - if USER in .env is empty, use 'root'
const dbUser = envVars.USER === '' || envVars.USER === undefined 
	? 'root' 
	: (envVars.USER || process.env.DB_USER || 'root');

// Log connection details (without password) for debugging
const dbHost = envVars.HOST || process.env.HOST || process.env.DB_HOST || 'localhost';
const dbName = envVars.DATABASENAME || process.env.DATABASENAME || process.env.DB_NAME || 'test';
const dbPort = parseInt(envVars.PORT || process.env.PORT || process.env.DB_PORT || '3306');

console.log('Database connection config:');
console.log(`  Host: ${dbHost}`);
console.log(`  User: ${dbUser}`);
console.log(`  Database: ${dbName}`);
console.log(`  Port: ${dbPort}`);

const pool = mysql.createPool({
	host: dbHost,
	user: dbUser,
	password: envVars.PASSWORD || process.env.PASSWORD || process.env.DB_PASSWORD || '',
	database: dbName,
	port: dbPort,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	connectTimeout: 10000, // 10 second timeout
});

export default pool;