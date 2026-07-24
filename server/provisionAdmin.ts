import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db, pool } from './db';
import { users } from '@shared/schema';

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 12) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD of at least 12 characters are required');
const id = `runtime_${createHash('sha256').update(email).digest('hex').slice(0, 24)}`;
const passwordHash = await bcrypt.hash(password, 12);
await db.insert(users).values({
  id, email, password: passwordHash, firstName: 'Runtime', lastName: 'Administrator',
  provider: 'local', roles: ['admin'], emailVerified: true,
}).onConflictDoUpdate({
  target: users.email,
  set: { password: passwordHash, firstName: 'Runtime', lastName: 'Administrator', provider: 'local', roles: ['admin'], emailVerified: true, updatedAt: new Date() },
});
console.log(`Provisioned ${email}`);
await pool.end();
