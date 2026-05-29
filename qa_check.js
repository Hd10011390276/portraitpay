const http = require('http');
http.get('http://localhost:3005/login', resp => {
  let data = '';
  resp.on('data', chunk => data += chunk);
  resp.on('end', () => {
    console.log('Forms:', JSON.stringify(data.match(/<form[^>]*>/gi)));
    console.log('Auth refs:', JSON.stringify(data.match(/signIn|nextauth|callback|api\/auth/gi)));
  });
}).on('error', e => console.error(e));