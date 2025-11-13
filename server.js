require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const passport = require('passport');
const MongoStore = require('connect-mongo');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Create uploads folder if missing
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('📁 uploads folder created automatically');
}

// ✅ Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Resume Optimization API');
});

// ✅ Middleware setup
app.use(cors({
    origin: 'http://localhost:5173', // React frontend
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Session + Mongo store
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: false, // true only if HTTPS
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Middleware
const { requireAuth } = require('./middleware/authMiddleware');

// Get current logged-in user info
app.get("/api/me", requireAuth, (req, res) => {
    if (req.session.user) {
        res.json({
            name: req.session.user.firstName,  // frontend expects data.name
            email: req.session.user.email
        });
    } else {
        res.status(401).json({ message: "Not logged in" });
    }
});

// ✅ Auth & account-related 
const webhookRoute = require('./routes/webhook');
const authRoute = require('./routes/auth');
const loginRoute = require('./routes/login');
const signupRoute = require('./routes/signup');
const logoutRoute = require('./routes/logout');
const passwordRoute = require('./routes/password');
const subscriptionRoute = require('./routes/subscription');


app.use('/webhook', webhookRoute);  
app.use('/', authRoute);
app.use('/api/subscription', subscriptionRoute);
app.use('/api', loginRoute);
app.use('/api', signupRoute);
app.use('/api', logoutRoute);
app.use('/api', passwordRoute);

// ✅ Core functionality routes
const uploadRoute = require('./routes/Upload');
const analysisRoute = require('./routes/analysis');
const resultRoute = require('./routes/result');
const feedbackRoute = require('./routes/feedback'); // ✅ ADDED BACK
const statsRoute = require('./routes/stats');
const categoriesRoute = require('./routes/categories');

app.use('/api', statsRoute);
app.use('/', categoriesRoute);
app.use('/api', requireAuth, uploadRoute);
app.use('/api', requireAuth, analysisRoute);
app.use('/api', requireAuth, resultRoute);
app.use('/api', requireAuth, feedbackRoute); // ✅ Secure & registered

// ✅ Admin and user management
const adminRoute = require('./routes/admin');
const userRoute = require('./routes/user');

app.use('/', adminRoute);
app.use('/api', userRoute);

// ✅ Landing pages
const How = require('./routes/landingpages/howitworks');
const Price = require('./routes/landingpages/pricing');
const Contact = require('./routes/landingpages/contactUs');
app.use('/', How);
app.use('/', Price);
app.use('/', Contact);

// ✅ User interface pages
const homeRoute = require('./routes/userInterface/home');
const aboutRoute = require('./routes/userInterface/about');
const contactRoute = require('./routes/userInterface/contacts');
app.use('/', homeRoute);
app.use('/', aboutRoute);
app.use('/', contactRoute);

// ✅ MongoDB connection
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('✅ Nakakonek sa MongoDB');
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ DB connection error details:", {
            name: err.name,
            code: err.code,
            message: err.message,
            cause: err.cause
        });
        console.log("Please check your internet connection and MongoDB Atlas status");
    });
