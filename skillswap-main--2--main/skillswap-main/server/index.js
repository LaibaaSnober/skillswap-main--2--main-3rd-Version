const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const githubRoutes = require('./routes/githubRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/github', require('./routes/githubRoutes'));


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/swaps', require('./routes/swaps'));
app.use('/api/skills', require('./routes/skills'));

app.get('/', (req, res) => {
  res.send('Server is running');
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB Connected');

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})
.catch(err => console.log(err));