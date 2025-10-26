const express = require('express');
const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test server works!' });
});

const port = 3001;
app.listen(port, '127.0.0.1', () => {
  console.log(`Test server running on http://127.0.0.1:${port}`);
});