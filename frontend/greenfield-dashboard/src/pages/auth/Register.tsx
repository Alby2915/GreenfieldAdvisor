import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const ok =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password);
    if (!ok) return 'La password deve avere almeno 8 caratteri e includere maiuscole, minuscole e numeri.';
    if (password !== confirm) return 'Le password non coincidono.';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) { setErr(msg); return; }
    setErr(null); setLoading(true);
    try {
      await register({ email, password, name });
      nav('/dashboard', { replace: true });
    } catch (e) {
      const error = e as Error; 
      setErr(error.message ?? 'Registration failed');
    }  finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight:'100vh', display:'grid', placeItems:'center', p: 2 }}>
      <Card sx={{ width: 420, borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <Typography variant="h6">Registrazione</Typography>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} />
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <TextField label="Confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            {err && <Typography color="error" variant="body2">{err}</Typography>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creation…' : 'Create account'}</Button>
            <Typography variant="body2">Do you already have an account? <Link href = " /login"> Login</Link> </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
