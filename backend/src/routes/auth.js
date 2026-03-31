import { Hono } from 'hono';
import { generateOTP, sendOTP } from '../utils/otp.js';
import { signJWT } from '../utils/jwt.js';

const auth = new Hono();

auth.post('/send-otp', async (c) => {
  const { email } = await c.req.json();

  if (!email || !email.endsWith('@abes.ac.in')) {
    return c.json({ error: 'Only @abes.ac.in email addresses are allowed' }, 400);
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO otps (email, otp, expires_at, attempts) VALUES (?, ?, ?, 0)'
  ).bind(email, otp, expiresAt).run();

  const sent = await sendOTP(email, otp, c.env.RESEND_API_KEY);
  if (!sent) {
    return c.json({ error: 'Failed to send OTP' }, 500);
  }

  return c.json({ message: 'OTP sent successfully' });
});

auth.post('/verify', async (c) => {
  const { email, otp, name } = await c.req.json();

  if (!email || !otp) {
    return c.json({ error: 'Email and OTP are required' }, 400);
  }

  const record = await c.env.DB.prepare(
    'SELECT * FROM otps WHERE email = ?'
  ).bind(email).first();

  if (!record) {
    return c.json({ error: 'OTP not found. Please request a new one.' }, 400);
  }

  if (new Date(record.expires_at) < new Date()) {
    await c.env.DB.prepare('DELETE FROM otps WHERE email = ?').bind(email).run();
    return c.json({ error: 'OTP expired. Please request a new one.' }, 400);
  }

  if (record.attempts >= 3) {
    await c.env.DB.prepare('DELETE FROM otps WHERE email = ?').bind(email).run();
    return c.json({ error: 'Too many attempts. Please request a new OTP.' }, 400);
  }

  if (record.otp !== otp) {
    await c.env.DB.prepare('UPDATE otps SET attempts = attempts + 1 WHERE email = ?').bind(email).run();
    return c.json({ error: 'Invalid OTP' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM otps WHERE email = ?').bind(email).run();

  let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

  if (!user) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name) VALUES (?, ?, ?)'
    ).bind(id, email, name || email.split('@')[0]).run();
    user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  }

  const token = await signJWT(
    { sub: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
    c.env.JWT_SECRET
  );

  return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default auth;
