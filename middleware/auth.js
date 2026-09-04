const { readTable } = require('../utils/db');

// Attaches the logged-in user (if any) to res.locals so every view can
// access `currentUser` without each route having to fetch it manually.
function attachUser(req, res, next) {
  res.locals.currentUser = null;
  res.locals.flash = req.session.flash || null;
  req.session.flash = null;

  if (req.session && req.session.userId) {
    const users = readTable('users');
    const user = users.find((u) => u.id === req.session.userId);
    if (user) {
      res.locals.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    req.session.flash = { type: 'error', message: 'You do not have access to that page.' };
    return res.redirect('/');
  }
  next();
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

module.exports = { attachUser, requireAuth, requireAdmin, setFlash };
