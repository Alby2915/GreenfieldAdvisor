import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { 
  insertUser, 
  findByEmail, 
  findById, 
  User, 
  updateUser, 
  updatePassword 
} from '../repositories/userRepo';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

// SCHEMI DI VALIDAZIONE

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
    .refine(v => /[A-Z]/.test(v), 'Serve una maiuscola')
    .refine(v => /[a-z]/.test(v), 'Serve una minuscola')
    .refine(v => /[0-9]/.test(v), 'Serve un numero'),
  name: z.string().min(1).optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, "La password deve essere di almeno 8 caratteri")
});

// HELPER 

export function toPublic(u: User) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

// FUNZIONI CORE 

export async function register(input: z.infer<typeof RegisterSchema>) {
  const data = RegisterSchema.parse(input);
  const existing = findByEmail(data.email.toLowerCase());
  if (existing) throw new Error('Email già registrata');

  const hash = await bcrypt.hash(data.password, 10);
  const user: User = {
    id: randomUUID(),
    email: data.email.toLowerCase(),
    password_hash: hash,
    name: data.name,
    role: 'user',
    created_at: new Date().toISOString()
  };
  insertUser(user);

  const token = jwt.sign(
    { sub: user.id, email: user.email }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES } as jwt.SignOptions
  );
  
  return { token, user: toPublic(user) };
}

export async function login(input: z.infer<typeof LoginSchema>) {
  const data = LoginSchema.parse(input);
  const user = findByEmail(data.email.toLowerCase());
  if (!user) throw new Error('Credenziali non valide');

  const ok = await bcrypt.compare(data.password, user.password_hash);
  if (!ok) throw new Error('Credenziali non valide');

  const token = jwt.sign(
    { sub: user.id, email: user.email }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES } as jwt.SignOptions
  );

  return { token, user: toPublic(user) };
}

export function me(userId: string) {
  const user = findById(userId);
  if (!user) throw new Error('Utente non trovato');
  return toPublic(user);
}

// NUOVE FUNZIONI PROFILO 

export function updateProfileService(userId: string, input: unknown) {
  const data = UpdateProfileSchema.parse(input);
  updateUser(userId, data.name, data.email);
  
  const updatedUser = findById(userId);
  if (!updatedUser) throw new Error("Utente non trovato dopo l'aggiornamento");
  
  return toPublic(updatedUser);
}

export async function changePasswordService(userId: string, input: unknown) {
  const data = ChangePasswordSchema.parse(input);
  const user = findById(userId);
  if (!user) throw new Error("Utente non trovato");

  // Verifica vecchia password
  const match = await bcrypt.compare(data.oldPassword, user.password_hash);
  if (!match) throw new Error("La vecchia password non è corretta");

  // Hash e salva nuova password
  const newHash = await bcrypt.hash(data.newPassword, 10);
  updatePassword(userId, newHash);
  
  return { success: true, message: "Password aggiornata con successo" };
}