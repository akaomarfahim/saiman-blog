const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readTable, writeTable } = require('./db');

// If there are no users yet, create the blog-owner (admin) account from
// the credentials in .env, so there is always a way to log in and post.
function seedAdmin() {
  const users = readTable('users');
  if (users.length > 0) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const passwordHash = bcrypt.hashSync(password, 10);

  const admin = {
    id: uuidv4(),
    username,
    email,
    passwordHash,
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  writeTable('users', [admin]);
  // eslint-disable-next-line no-console
  console.log(`\nSeeded admin account -> username: "${username}" / password: "${password}"`);
  console.log('Log in and consider changing this password-protected account\'s credentials by editing data/users.json or adding a settings page.\n');
}

module.exports = { seedAdmin };
