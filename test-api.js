const http = require('http');

const data = JSON.stringify({
  target: 'test@batuwa.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/v1/auth/dev-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('BODY:', body);
    if (res.statusCode === 200) {
      const responseData = JSON.parse(body);
      const token = responseData.accessToken;
      
      // Test the wallet balance endpoint
      const balanceOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v1/wallet/balance',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const balanceReq = http.request(balanceOptions, (balanceRes) => {
        console.log(`\nBALANCE STATUS: ${balanceRes.statusCode}`);
        let balanceBody = '';
        balanceRes.on('data', (chunk) => { balanceBody += chunk; });
        balanceRes.on('end', () => {
          console.log('BALANCE BODY:', balanceBody);
        });
      });
      balanceReq.end();
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
