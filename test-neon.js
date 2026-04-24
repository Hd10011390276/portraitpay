const { Client } = require('pg');
const client = new Client({
  host: 'ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_hU6BKHJISyj5',
  port: 5432,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});
client.connect()
  .then(() => client.query('SELECT 1 as test'))
  .then(r => { console.log('✅ Neon connected! Query:', r.rows[0]); client.end(); process.exit(0); })
  .catch(e => { console.log('❌ Error:', e.message.substring(0, 300)); process.exit(1); });
setTimeout(() => { console.log('Timeout'); process.exit(1); }, 15000);
