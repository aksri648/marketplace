import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const contact = new Hono();

contact.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { ad_id, buyer_name, buyer_phone } = await c.req.json();

  if (!ad_id) return c.json({ error: 'ad_id is required' }, 400);

  const ad = await c.env.DB.prepare(
    'SELECT ads.*, users.phone as seller_phone, users.name as seller_name FROM ads JOIN users ON ads.seller_id = users.id WHERE ads.id = ?'
  ).bind(ad_id).first();

  if (!ad) return c.json({ error: 'Ad not found' }, 404);
  if (!ad.seller_phone) return c.json({ error: 'Seller has not provided a phone number' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO contact_requests (id, ad_id, buyer_id) VALUES (?, ?, ?)'
  ).bind(id, ad_id, user.id).run();

  const message = `Hi, I'm interested in your listing "${ad.title}" on ABES Marketplace. My name is ${buyer_name || user.email}.`;
  const waLink = `https://wa.me/${ad.seller_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  return c.json({ whatsapp_link: waLink, seller_name: ad.seller_name, seller_phone: ad.seller_phone });
});

export default contact;
