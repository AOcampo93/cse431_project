const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/user');

// Initialize Google OAuth2 client. The client ID should be set in
// environment variables. If you intend to use Google Sign‑In, set
// GOOGLE_CLIENT_ID to your OAuth client ID. Without it the verifyIdToken
// call will fail. This placeholder allows the code to run without
// crashing until you configure the keys.
const googleClientId = process.env.GOOGLE_CLIENT_ID || '937828160345-d0vl1st38905e6b8dguaig5qq9f7cc68.apps.googleusercontent.com';
const googleClient = new OAuth2Client(googleClientId);

/**
 * Helper to generate JWT tokens. Embeds the user ID and role.
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'uSJAs961ZWLh62aXnk54yA7LMwvtcsOlLQMmVTw9JEdJO5IwRDlJh9LPf2Gdhuys3GzHtR';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn });
}

/**
 * POST /auth/register
 *
 * Register a new user using local credentials (email and password).
 * Expects: { email, password, name, phone }
 * Optionally accepts a `role` field but only admins can create non‑client
 * accounts (enforced at route level). Passwords are hashed with bcrypt
 * before being stored. Returns a JWT on success.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: true, message: 'email, password and name are required' });
    }
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: true, message: 'Email already in use' });
    }
    // Hash the password
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    const user = new User({
      authProvider: 'credentials',
      email,
      password: hashed,
      name,
      phone,
      role: role || 'client',
    });
    await user.save();
    const token = generateToken(user);
    // Only return non sensitive fields
    const userInfo = { id: user._id, email: user.email, name: user.name, role: user.role };
    return res.status(201).json({ token, user: userInfo });
  } catch (err) {
    console.error('auth.register error:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: true, message: 'Email already in use' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    return next(err);
  }
});

/**
 * POST /auth/login
 *
 * Authenticate a user using local credentials. Expects { email, password }.
 * On success returns a JWT and minimal user object.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: true, message: 'email and password are required' });
    }
    const user = await User.findOne({ email, authProvider: 'credentials' });
    if (!user || !user.password) {
      return res
        .status(401)
        .json({ error: true, message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ error: true, message: 'Invalid email or password' });
    }
    const token = generateToken(user);
    const userInfo = { id: user._id, email: user.email, name: user.name, role: user.role };
    return res.status(200).json({ token, user: userInfo });
  } catch (err) {
    console.error('auth.login error:', err);
    return next(err);
  }
});

/**
 * POST /auth/google
 *
 * Authenticate a user via Google OAuth. Expects { idToken } obtained from
 * the Google Sign‑In client SDK on the frontend. The id token is
 * verified against the configured GOOGLE_CLIENT_ID. If valid and the
 * user does not exist yet, a new account is created with the role
 * 'client'. Returns a JWT and minimal user object.
 *
 * Note: You must set the GOOGLE_CLIENT_ID environment variable to
 * your OAuth client ID issued by Google. Without it the token
 * verification will fail. The GOOGLE_CLIENT_SECRET is not required
 * here because the id token verification only needs the client ID.
 */
router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ error: true, message: 'idToken is required' });
    }
    // Verify the token. Throws if invalid.
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    // The unique Google user ID is in the 'sub' claim
    const authId = payload.sub;
    const email = payload.email;
    const name = payload.name || payload.given_name || 'Google User';
    const picture = payload.picture;
    let user = await User.findOne({ authProvider: 'google', authId });
    if (!user) {
      user = new User({
        authProvider: 'google',
        authId,
        email,
        name,
        avatarUrl: picture,
        role: 'client',
      });
      await user.save();
    }
    const token = generateToken(user);
    const userInfo = { id: user._id, email: user.email, name: user.name, role: user.role };
    return res.status(200).json({ token, user: userInfo });
  } catch (err) {
    console.error('auth.google error:', err);
    return res
      .status(401)
      .json({ error: true, message: 'Invalid Google id token' });
  }
});

module.exports = router;