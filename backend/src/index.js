import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.js';
import adsRoutes from './routes/ads.js';
import wishlistRoutes from './routes/wishlist.js';
import contactRoutes from './routes/contact.js';

const app = new Hono();

app.use('*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.get('/', (c) => c.json({ message: 'ABES Marketplace API', version: '1.0.0' }));

app.route('/auth', authRoutes);
app.route('/ads', adsRoutes);
app.route('/wishlist', wishlistRoutes);
app.route('/contact', contactRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
