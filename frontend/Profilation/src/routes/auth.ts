
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, me } from '../services/authService';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth';
import { updateProfileService, changePasswordService } from '../services/authService';

export const authRouter = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 15 }); 
authRouter.use(limiter);

authRouter.post('/register', async (req, res) => {
  try {
    const result = await register(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? 'Bad request' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? 'Bad request' });
  }
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  try {
    const user = me(req.userId!);
    res.json(user);
  } catch (e: any) {
    res.status(404).json({ error: e.message ?? 'Not found' });
  }
});

// API per aggiornare Nome ed Email
authRouter.put('/update-profile', requireAuth, (req: AuthedRequest, res) => {
  try {
    const result = updateProfileService(req.userId!, req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? 'Errore aggiornamento' });
  }
});

// API per cambiare Password
authRouter.put('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await changePasswordService(req.userId!, req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? 'Errore cambio password' });
  }
});
