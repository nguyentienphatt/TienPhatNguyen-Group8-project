const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:5000/auth/seed-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anhsv3@example.com', password: '123456', name: 'Tester' })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
  } catch (e) {
    console.error('Request failed:', e);
  }
})();
