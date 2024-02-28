require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/Users');
// Assume Transaction model is defined similar to User
const Transaction = require('./models/Transaction');
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
  res.send('<h1>Welcome to our fun little Fintech Experiment Backend!</h1><h2>Wow the backend is up and running.</h2>');
});

// User information page
app.get('/userinfo', async (req, res) => {
  try {
    const users = await User.find({}, 'email password accountNumber'); // Fetch only email and password fields
    const userInfo = users.map(user => ({ email: user.email, password: user.password, accountNumber: user.accountNumber }));
    const responseMessage = '<h2>This is the user info from the database: <h4>';

    res.set('Content-Type', 'text/html'); // Set Content-Type to text/html for the HTML content
    res.send(`${responseMessage}\n${JSON.stringify(userInfo, null, 4)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Generate a unique account number
const generateAccountNumber = () => {
  const prefix = 'ACC';
  const timeStamp = Date.now().toString();
  const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timeStamp}${randomNumber}`;
};

// Registration route
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const accountNumber = generateAccountNumber();
    const user = new User({ email, password, accountNumber, accountBalance: 0 });
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

app.get('/user-data', authenticateToken, async (req, res) => {
  try {
    // The user's ID is extracted from the token in the authenticateToken middleware
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Send back the user data you need on the frontend. Adjust according to your user model.
    // For example, sending back email, accountNumber, and accountBalance
    res.status(200).send({
      email: user.email,
      accountNumber: user.accountNumber,
      accountBalance: user.accountBalance,
      // You can include other user-related data here as needed
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching user data.' });
  }
});

// Placeholder for transaction handling logic
// This function should be defined based on your actual transaction logic
const handleTransaction = async (senderId, receiverId, amount) => {
  // Implement transaction logic here
};

// Route to create a transaction
app.post('/transaction', authenticateToken, async (req, res) => {
  const { receiverId, amount } = req.body; // Assuming you pass receiver's ID and the amount
  const senderId = req.user._id; // Extract sender's ID from token authentication
  try {
    await handleTransaction(senderId, receiverId, amount); // Implement your transaction logic
    res.status(201).send({ message: "Transaction successful" });
  } catch (error) {
    res.status(400).send(error.message);
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