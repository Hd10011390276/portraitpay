require('dotenv').config();
const { SignJWT } = require('jose');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('No JWT_SECRET found');
  process.exit(1);
}

const secretBytes = new TextEncoder().encode(secret);

new SignJWT({ userId: 'test', email: 'test@test.com', role: 'USER' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('2h')
  .sign(secretBytes)
  .then(token => {
    console.log('JWT sign OK:', token.substring(0, 50) + '...');
    process.exit(0);
  })
  .catch(e => {
    console.error('JWT sign ERROR:', e.message);
    process.exit(1);
  });