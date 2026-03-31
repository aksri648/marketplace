import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const wishlist = new Hono();

wishlist.use('*', authMiddleware);

wishlist.get('/', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT wishlist.id, wishlist.created_at, ads.id as ad_id, ads.title, ads.description, ads.price, ads.category, ads.image_urls, ads.status
     FROM wishlist JOIN ads ON wishlist.ad_id = ads.id
     WHERE wishlist.user_id = ? ORDER BY wishlist.created_at DESC`
  ).bind(user.id).all();

  return c.json(results.map(item => ({ ...item, image_urls: JSON.parse(item.image_urls || '[]') })));
});

wishlist.post('/', async (c) => {
  const user = c.get('user');
  const { ad_id } = await c.req.json();

  if (!ad_id) return c.json({ error: 'ad_id is required' }, 400);

  const existing = await c.env.DB.prepare(
    'SELECT id FROM wishlist WHERE user_id = ? AND ad_id = ?'
  ).bind(user.id, ad_id).first();

  if (existing) {
    await c.env.DB.prepare('DELETE FROM wishlist WHERE user_id = ? AND ad_id = ?').bind(user.id, ad_id).run();
    return c.json({ message: 'Removed from wishlist', action: 'removed' });
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO wishlist (id, user_id, ad_id) VALUES (?, ?, ?)').bind(id, user.id, ad_id).run();
  return c.json({ message: 'Added to wishlist', action: 'added' }, 201);
});

wishlist.delete('/', async (c) => {
  const user = c.get('user');
  const { ad_id } = await c.req.json();

  await c.env.DB.prepare('DELETE FROM wishlist WHERE user_id = ? AND ad_id = ?').bind(user.id, ad_id).run();
  return c.json({ message: 'Removed from wishlist' });
});

export default wishlist;
