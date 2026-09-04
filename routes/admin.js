const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readTable, writeTable } = require('../utils/db');
const { requireAuth, requireAdmin, setFlash } = require('../middleware/auth');
const { slugify } = require('../utils/slug');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth, requireAdmin);

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

function uniqueSlug(title, posts, ignoreId) {
  const base = slugify(title);
  let candidate = base;
  let i = 2;
  while (posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  return candidate;
}

function deleteImageFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(imageUrl));
  fs.unlink(filePath, () => {}); // best-effort, ignore errors
}

// Wrap multer so its errors (bad file type, too large) render nicely
// instead of crashing with a raw error page.
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      req.uploadError = err.message || 'There was a problem uploading that image.';
    }
    next();
  });
}

router.get('/', (req, res) => {
  const posts = readTable('posts').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.render('admin/dashboard', { title: 'Dashboard', posts });
});

router.get('/new', (req, res) => {
  res.render('admin/edit-post', {
    title: 'New post',
    post: null,
    errors: [],
  });
});

router.post('/new', handleUpload, (req, res) => {
  const { title, excerpt, content } = req.body;
  const errors = [];
  if (req.uploadError) errors.push(req.uploadError);
  if (!title || !title.trim()) errors.push('Title is required.');
  if (!content || !content.trim()) errors.push('Content is required.');

  if (errors.length > 0) {
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    return res.status(400).render('admin/edit-post', {
      title: 'New post',
      post: { title, excerpt, content, imageUrl: null },
      errors,
    });
  }

  const posts = readTable('posts');
  const now = new Date().toISOString();
  const post = {
    id: uuidv4(),
    title: title.trim(),
    slug: uniqueSlug(title, posts),
    excerpt: (excerpt || '').trim(),
    content: content.trim(),
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    authorId: req.session.userId,
    createdAt: now,
    updatedAt: now,
  };

  posts.push(post);
  writeTable('posts', posts);
  setFlash(req, 'success', 'Post published.');
  res.redirect(`/post/${post.slug}`);
});

router.get('/edit/:id', (req, res) => {
  const posts = readTable('posts');
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).render('404', { title: 'Post not found' });
  res.render('admin/edit-post', { title: 'Edit post', post, errors: [] });
});

router.post('/edit/:id', handleUpload, (req, res) => {
  const posts = readTable('posts');
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).render('404', { title: 'Post not found' });

  const { title, excerpt, content, removeImage } = req.body;
  const errors = [];
  if (req.uploadError) errors.push(req.uploadError);
  if (!title || !title.trim()) errors.push('Title is required.');
  if (!content || !content.trim()) errors.push('Content is required.');

  if (errors.length > 0) {
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    return res.status(400).render('admin/edit-post', {
      title: 'Edit post',
      post: { ...post, title, excerpt, content },
      errors,
    });
  }

  post.title = title.trim();
  post.slug = uniqueSlug(title, posts, post.id);
  post.excerpt = (excerpt || '').trim();
  post.content = content.trim();
  post.updatedAt = new Date().toISOString();

  if (req.file) {
    deleteImageFile(post.imageUrl);
    post.imageUrl = `/uploads/${req.file.filename}`;
  } else if (removeImage === 'on') {
    deleteImageFile(post.imageUrl);
    post.imageUrl = null;
  }

  writeTable('posts', posts);
  setFlash(req, 'success', 'Post updated.');
  res.redirect(`/post/${post.slug}`);
});

router.post('/delete/:id', (req, res) => {
  const posts = readTable('posts');
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).render('404', { title: 'Post not found' });

  deleteImageFile(post.imageUrl);

  const remainingPosts = posts.filter((p) => p.id !== post.id);
  writeTable('posts', remainingPosts);

  const comments = readTable('comments').filter((c) => c.postId !== post.id);
  writeTable('comments', comments);

  setFlash(req, 'success', 'Post and its comments were deleted.');
  res.redirect('/admin');
});

module.exports = router;
