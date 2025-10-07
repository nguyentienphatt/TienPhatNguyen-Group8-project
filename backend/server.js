const express = require('express');
const app = express();

app.use(express.json());

const userRouter = require('./routes/user');
console.log('Type of userRouter:', typeof userRouter); // PHẢI in 'function'
app.use('/users', userRouter);

app.get('/', (req, res) => res.send('Users API is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
