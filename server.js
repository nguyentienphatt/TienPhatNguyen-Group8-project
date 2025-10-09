const express = require('express');
const app = express();
app.use(express.json());

const userRouter = require('./routes/user');
app.use('/users', userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
