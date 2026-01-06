
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8080);
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: ORIGIN, credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
