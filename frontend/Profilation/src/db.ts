
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const file = process.env.DATABASE_FILE || './data.sqlite';
export const db = new Database(file);
db.pragma('journal_mode = WAL'); 
