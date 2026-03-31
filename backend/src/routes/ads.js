import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const ads = new Hono();

ads.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const offset = (page - 1) * limit;
  const category = c.req.query('category');

  let query = 'SELECT ads.*, users.name as seller_name, users.email as seller_email FROM ads JOIN users ON ads.seller_id = users.id WHERE ads.status = ?';
  const params = ['active'];

  if (category) {
    query += ' AND ads.category = ?';
    params.push(category);
  }

  query += ' ORDER BY ads.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const countQuery = category
    ? 'SELECT COUNT(*) as total FROM ads WHERE status = ? AND category = ?'
    : 'SELECT COUNT(*) as total FROM ads WHERE status = ?';
  const countParams = category ? ['active', category] : ['active'];
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

  return c.json({
    ads: results.map(ad => ({ ...ad, image_urls: JSON.parse(ad.image_urls || '[]') })),
    pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) }
  });
});

ads.get('/:id', async (c) => {
  const id = c.req.param('id');
  const ad = await c.env.DB.prepare(
    'SELECT ads.*, users.name as seller_name, users.email as seller_email, users.phone as seller_phone FROM ads JOIN users ON ads.seller_id = users.id WHERE ads.id = ?'
  ).bind(id).first();

  if (!ad) return c.json({ error: 'Ad not found' }, 404);

  return c.json({ ...ad, image_urls: JSON.parse(ad.image_urls || '[]') });
});

ads.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { title, description, price, category, image_urls } = await c.req.json();

  if (!title || !category) {
    return c.json({ error: 'Title and category are required' }, 400);
  }

  const activeCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM ads WHERE seller_id = ? AND status = ?'
  ).bind(user.id, 'active').first();

  if (activeCount.count >= 5) {
    return c.json({ error: 'You can only have 5 active ads at a time' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO ads (id, title, description, price, category, image_urls, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, title, description || '', price || 0, category, JSON.stringify(image_urls || []), user.id).run();

  const ad = await c.env.DB.prepare('SELECT * FROM ads WHERE id = ?').bind(id).first();
  return c.json({ ...ad, image_urls: JSON.parse(ad.image_urls) }, 201);
});

ads.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { status } = await c.req.json();

  const ad = await c.env.DB.prepare('SELECT * FROM ads WHERE id = ?').bind(id).first();
  if (!ad) return c.json({ error: 'Ad not found' }, 404);
  if (ad.seller_id !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await c.env.DB.prepare('UPDATE ads SET status = ? WHERE id = ?').bind(status, id).run();
  return c.json({ message: 'Ad updated' });
});

ads.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const ad = await c.env.DB.prepare('SELECT * FROM ads WHERE id = ?').bind(id).first();
  if (!ad) return c.json({ error: 'Ad not found' }, 404);
  if (ad.seller_id !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM ads WHERE id = ?').bind(id).run();
  return c.json({ message: 'Ad deleted' });
});

export default ads;
