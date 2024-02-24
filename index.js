require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/Users');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors());

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is up and running' });
});

// Welcome Page
app.get('/', (req, res) => {
  res.send('<h1>Welcome to our fun little Fintech Experiment Backend!</h1><p>Wow the backup is up and running.</p>');
});

// Registration route
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).send({ user });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ error: 'Login failed!' });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Middleware to authenticate and set user on request
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Route to create a transaction
app.post('/transaction', authenticateToken, async (req, res) => {
  const { amount, type } = req.body;
  const transaction = new Transaction({ amount, type, userId: req.user._id });
  try {
    await transaction.save();
    res.status(201).send(transaction);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Route to get user's transactions
app.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });
    res.send(transactions);
  } catch (error) {
    res.status(500).send(error);
  }
});
