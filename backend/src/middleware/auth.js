import { verifyJWT } from '../utils/jwt.js';

export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    // Check if user is blocked
    const user = await c.env.DB.prepare('SELECT id, email, role, is_blocked FROM users WHERE id = ?')
      .bind(payload.sub)
      .first();
    
    if (!user || user.is_blocked) {
      return c.json({ error: 'User is blocked or not found' }, 403);
    }

    c.set('user', { id: user.id, email: user.email, role: user.role });
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
