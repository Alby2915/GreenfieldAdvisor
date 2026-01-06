
import { db } from '../db';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  role?: 'admin' | 'user';
  created_at: string;
}

export function findByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

export function findById(id: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

export function insertUser(u: User): void {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at)
    VALUES (@id, @email, @password_hash, @name, @role, @created_at)
  `);
  stmt.run(u);
}

export function updateUser(id: string, name: string, email: string): void {
  const stmt = db.prepare('UPDATE users SET name = @name, email = @email WHERE id = @id');
  stmt.run({ id, name, email });
}

export function updatePassword(id: string, passwordHash: string): void {
  const stmt = db.prepare('UPDATE users SET password_hash = @passwordHash WHERE id = @id');
  stmt.run({ id, passwordHash });
}