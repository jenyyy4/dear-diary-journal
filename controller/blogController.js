const Blog = require('../models/blog');

const blog_index = (req, res) => {
  const userId = req.session.userId;

  Blog.find({ user: userId }).sort({ createdAt: -1 })
    .then(result => {
      res.render('index', { blogs: result, title: 'My Journals' });
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = {
    blog_index
};