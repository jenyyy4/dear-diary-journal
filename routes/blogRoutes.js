const express = require('express');
const Blog = require('../models/blog');
const blogController = require('../controller/blogController');
const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

router.get('/blogs/create', requireLogin, (req, res) => {
  res.render('create', { title: 'Create a new blog' });
});

router.get('/blogs', requireLogin, blogController.blog_index);

router.post('/blogs', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { title, body } = req.body;

    const blog = new Blog({
      title,
      body,
      user: userId
    });

    await blog.save();
    res.redirect('/blogs');
  } catch (err) {
    console.error("Error saving blog:", err.message);
    res.status(500).send("Error saving blog");
  }
});

router.get('/blogs/:id', requireLogin, async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, user: req.session.userId });
    if (!blog) return res.status(404).send("Blog not found");
    res.render('details', { blog, title: 'Blog Details' });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving blog");
  }
});

router.patch('/blogs/:id', requireLogin, async (req, res) => {
  try {
    const { title, body } = req.body;
    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { title, body },
      { new: true }
    );
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating blog" });
  }
});

router.delete('/blogs/:id', requireLogin, async (req, res) => {
  try {
    const result = await Blog.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    if (!result) return res.status(404).json({ error: "Blog not found" });
    res.json({ redirect: '/blogs' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting blog" });
  }
});

module.exports = router;
