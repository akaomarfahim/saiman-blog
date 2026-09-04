require('dotenv').config();

const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

const { seedAdmin } = require('./utils/seed');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

seedAdmin();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

app.use(attachUser);

app.use('/', authRoutes);
app.use('/', postRoutes);
app.use('/', commentRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

// Generic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong on our end. Please try again.');
});

app.listen(PORT, () => {
  console.log(`Blog running at http://localhost:${PORT}`);
});
