const express = require('express');
const { readTable } = require('../utils/db');

const router = express.Router();

router.get('/', (req, res) => {
  const posts = readTable('posts').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.render('index', { title: 'Home', posts });
});

router.get('/post/:slug', (req, res) => {
  const posts = readTable('posts');
  const post = posts.find((p) => p.slug === req.params.slug);
  if (!post) {
    return res.status(404).render('404', { title: 'Post not found' });
  }

  const allComments = readTable('comments').filter((c) => c.postId === post.id);
  const users = readTable('users');
  const author = users.find((u) => u.id === post.authorId) || null;

  const withAuthor = (c) => {
    const author = users.find((u) => u.id === c.userId);
    return {
      ...c,
      authorName: author ? author.username : 'Deleted user',
      authorRole: author ? author.role : 'user',
    };
  };

  const topLevel = allComments
    .filter((c) => !c.parentId)
    .map(withAuthor)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const replies = allComments.filter((c) => c.parentId).map(withAuthor);

  const comments = topLevel.map((c) => ({
    ...c,
    replies: replies
      .filter((r) => r.parentId === c.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  }));

  res.render('post', { title: post.title, post, comments, author });
});

module.exports = router;
