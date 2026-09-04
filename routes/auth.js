const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readTable, writeTable } = require('../utils/db');
const { setFlash } = require('../middleware/auth');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('register', { title: 'Create an account', errors: [], old: {} });
});

router.post('/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!username || !USERNAME_RE.test(username)) {
    errors.push('Username must be 3-20 characters and contain only letters, numbers, and underscores.');
  }
  if (!email || !EMAIL_RE.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  const users = readTable('users');
  if (username && users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    errors.push('That username is already taken.');
  }
  if (email && users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    errors.push('That email is already registered.');
  }

  if (errors.length > 0) {
    return res.status(400).render('register', {
      title: 'Create an account',
      errors,
      old: { username, email },
    });
  }

  const newUser = {
    id: uuidv4(),
    username,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeTable('users', users);

  req.session.userId = newUser.id;
  setFlash(req, 'success', `Welcome, ${newUser.username}! Your account was created.`);
  res.redirect('/');
});

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('login', { title: 'Log in', errors: [], old: {} });
});

router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  const users = readTable('users');

  const user = users.find(
    (u) =>
      u.username.toLowerCase() === (identifier || '').toLowerCase() ||
      u.email.toLowerCase() === (identifier || '').toLowerCase()
  );

  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(400).render('login', {
      title: 'Log in',
      errors: ['Incorrect username/email or password.'],
      old: { identifier },
    });
  }

  req.session.userId = user.id;
  const redirectTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  setFlash(req, 'success', `Welcome back, ${user.username}!`);
  res.redirect(redirectTo);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
