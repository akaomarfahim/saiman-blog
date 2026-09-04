const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readTable, writeTable } = require('../utils/db');
const { requireAuth, setFlash } = require('../middleware/auth');

const router = express.Router();

// Add a top-level comment to a post
router.post('/post/:slug/comments', requireAuth, (req, res) => {
  const posts = readTable('posts');
  const post = posts.find((p) => p.slug === req.params.slug);
  if (!post) return res.status(404).render('404', { title: 'Post not found' });

  const { content } = req.body;
  if (!content || !content.trim()) {
    setFlash(req, 'error', 'Comment cannot be empty.');
    return res.redirect(`/post/${post.slug}`);
  }

  const comments = readTable('comments');
  comments.push({
    id: uuidv4(),
    postId: post.id,
    userId: req.session.userId,
    parentId: null,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  });
  writeTable('comments', comments);

  setFlash(req, 'success', 'Comment posted.');
  res.redirect(`/post/${post.slug}#comment-list`);
});

// Reply to an existing (top-level) comment. Any logged-in user can reply;
// replies from the blog author are highlighted in the template.
router.post('/comments/:id/reply', requireAuth, (req, res) => {
  const comments = readTable('comments');
  const parent = comments.find((c) => c.id === req.params.id);
  if (!parent) return res.status(404).render('404', { title: 'Comment not found' });

  const posts = readTable('posts');
  const post = posts.find((p) => p.id === parent.postId);
  if (!post) return res.status(404).render('404', { title: 'Post not found' });

  const { content } = req.body;
  if (!content || !content.trim()) {
    setFlash(req, 'error', 'Reply cannot be empty.');
    return res.redirect(`/post/${post.slug}#comment-${parent.id}`);
  }

  // Replies always attach to the top-level comment, keeping the thread
  // exactly two levels deep and simple to read.
  const topLevelParentId = parent.parentId || parent.id;

  comments.push({
    id: uuidv4(),
    postId: post.id,
    userId: req.session.userId,
    parentId: topLevelParentId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  });
  writeTable('comments', comments);

  setFlash(req, 'success', 'Reply posted.');
  res.redirect(`/post/${post.slug}#comment-${topLevelParentId}`);
});

// Delete a comment: allowed for the comment's author or the site admin.
router.post('/comments/:id/delete', requireAuth, (req, res) => {
  const comments = readTable('comments');
  const comment = comments.find((c) => c.id === req.params.id);
  if (!comment) return res.status(404).render('404', { title: 'Comment not found' });

  const posts = readTable('posts');
  const post = posts.find((p) => p.id === comment.postId);

  const isOwner = comment.userId === req.session.userId;
  const isAdmin = res.locals.currentUser && res.locals.currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    setFlash(req, 'error', 'You cannot delete that comment.');
    return res.redirect(post ? `/post/${post.slug}` : '/');
  }

  // Deleting a top-level comment also removes its replies.
  const idsToRemove = new Set([comment.id]);
  comments.forEach((c) => {
    if (c.parentId === comment.id) idsToRemove.add(c.id);
  });
  const remaining = comments.filter((c) => !idsToRemove.has(c.id));
  writeTable('comments', remaining);

  setFlash(req, 'success', 'Comment deleted.');
  res.redirect(post ? `/post/${post.slug}#comment-list` : '/');
});

module.exports = router;
