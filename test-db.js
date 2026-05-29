// Simulate the login API logic standalone
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const http = require('http');

const p = new PrismaClient();

async function main() {
  const email = '799096322@qq.com';
  const password = 'Hd210011390276';

  console.log('Looking up user...');
  const user = await p.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, emailVerified: true },
  });

  console.log('User found:', user ? 'yes' : 'no');
  if (!user) {
    console.log('No user or no password hash');
    await p.$disconnect();
    return;
  }

  console.log('Email verified:', user.emailVerified);
  if (!user.emailVerified) {
    console.log('Email not verified - would return 403');
    await p.$disconnect();
    return;
  }

  console.log('Validating password...');
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log('Password valid:', isValid);

  if (!isValid) {
    console.log('Invalid password - would return 401');
    await p.$disconnect();
    return;
  }

  // Now try to sign JWT
  console.log('Signing JWT tokens...');
  const { SignJWT } = require('jose');
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const tokens = await Promise.all([
    new SignJWT({ userId: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret),
    new SignJWT({ userId: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)
  ]);

  console.log('Access token:', tokens[0].substring(0, 50) + '...');
  console.log('SUCCESS - Login would work!');

  await p.$disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
  p.$disconnect();
  process.exit(1);
});