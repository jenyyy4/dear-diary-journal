require('dotenv').config();  
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const blogRoutes = require('./routes/blogRoutes');
const User = require('./models/User');
const Blog = require('./models/blog');
const blogController = require('./controller/blogController');

const app = express();

const dbURI = process.env.DBURI;
mongoose.connect(dbURI)
.then((result) => {
    console.log("connected to db");
    app.listen(3000);
})
.catch((err) => console.log(err));

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get("/login", (req, res) => {
  res.render("login", { error : null });
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "User not found" });
    }
    if (user.password !== password) {
      return res.render("login", { error: "Invalid password" });
    }
    
    req.session.userId = user._id;
    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { error: "Email already registered" });
    }

    const newUser = new User({ email, password });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { error: "Something went wrong, please try again" });
  }
});

app.use('/blogs', requireLogin, blogRoutes);
app.post('/blogs', async (req, res) => {
  try {
    const userId = req.session.userId;
    const blog = new Blog({ ...req.body, user: userId });
    await blog.save();
    res.redirect('/blogs');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving blog");
  }
});

app.get('/about', requireLogin, (req, res) => {
    res.render('about', { title: 'About' });
});
app.get('/entries', requireLogin, blogController.blog_index);

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/login');
  });
});

app.use(blogRoutes);
  
app.use((req, res) => {
    res.status(404).render('404.ejs');
})