import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state: { from?: { pathname: string } } };
  const redirectTo = loc.state?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login({ email, password });
      nav(redirectTo, { replace: true });
    } catch (e) {
      const error = e as Error; 
      setErr(error.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight:'100vh', display:'grid', placeItems:'center', p: 2 }}>
      <Card sx={{ width: 380, borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <Typography variant="h6">Access</Typography>
            <TextField
              label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
            />
            <TextField
              label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
            />
            {err && <Typography color="error" variant="body2">{err}</Typography>}

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Accesso…' : 'Entra'}
            </Button>

            <Typography variant="body2">
              Don't you have an account? <Link href="/register">Register</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
