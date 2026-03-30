const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = 3001;

// Google OAuth
const GOOGLE_CLIENT_ID = '1098954270730-h92guqetn0m1rfh99vi9s3b842h0jafo.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/budgetnest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once('open', () => console.log('✅ MongoDB connected'));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: String, // For traditional login
});
const User = mongoose.model('User', UserSchema);

// -------------------- Routes --------------------

// Serve register.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Serve other frontend files (optional)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// -------------------- Auth API --------------------

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser)
    return res.status(400).json({ message: 'Username or Email already exists.' });

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashedPassword });

  return res.status(200).json({ message: 'Registration successful.' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user)
    return res.status(400).json({ message: 'Invalid credentials.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(400).json({ message: 'Invalid credentials.' });

  return res.status(200).json({ message: 'Login successful.', success: true, username: user.username });
});

// Google Login
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const username = payload.name;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ username, email, password: 'google-login' });
    }

    return res.status(200).json({ message: 'Google login successful.', success: true, username: user.username });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(401).json({ message: 'Invalid Google token.' });
  }
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
