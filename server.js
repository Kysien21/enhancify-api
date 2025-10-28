require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer')
const passport = require('passport');
const MongoStore = require ('connect-mongo')
require('./config/passport');

const app = express()
const PORT = process.env.PORT || 3000;  

const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('📁 uploads folder created automatically');
}


app.get('/', (req, res) => {
    res.send('Welcome to the Resume Optimization API')
})

//middlewares
app.use(cors({
    origin: 'http://localhost:5173', // frontend port
    credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: false, // true only if using HTTPS
        sameSite: 'lax'
    }

}))

app.use(passport.initialize());
app.use(passport.session());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')))


const authRoute = require('./routes/auth');
const subscriptionRoute = require('./routes/subscription');

app.use('/api/subscription', subscriptionRoute);
app.use('/', authRoute);



// Routes
const loginRoute = require('./routes/login');
const signupRoute = require('./routes/signup');
const logoutRoute = require('./routes/logout');
const passwordRoute = require("./routes/password");


const { requireAuth } = require('./middleware/authMiddleware');

const uploadRoute = require('./routes/Upload');
const analysisRoute = require('./routes/analysis');
const feedbackRoute = require('./routes/feedback');
const resultRoute = require('./routes/result');

const adminRoute = require('./routes/admin');
const userRoute = require('./routes/user');
// const historyRoute = require('./routes/history')

app.use('/', adminRoute)
app.use('/api', userRoute)
app.use('/api', loginRoute)
app.use('/api', passwordRoute)
app.use('/api', signupRoute)
app.use('/api', logoutRoute)

app.use('/api', requireAuth, uploadRoute)
app.use('/api', requireAuth,analysisRoute)
app.use('/api', requireAuth,resultRoute)
app.use('/api', requireAuth,feedbackRoute)
    // app.use('/api', historyRoute)

//landingpage

const How = require('./routes/landingpages/howitworks')
const Price = require('./routes/landingpages/pricing')
const Contact = require('./routes/landingpages/contactUs');

app.use('/', How)
app.use('/', Price)
app.use('/', Contact)

//user interface
const homeRoute = require('./routes/userInterface/home')
const aboutRoute = require('./routes/userInterface/about')
const contactRoute = require('./routes/userInterface/contacts')

app.use('/', homeRoute)
app.use('/', aboutRoute)
app.use('/', contactRoute)


//mongodb
const dbURI = process.env.MONGO_URI;


mongoose.connect(dbURI, {
        serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    })
    .then((result) => {
        console.log("connected")
        console.log('✅ Nakakonek sa MongoDB')
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
        })
    })
    .catch(err => {
        console.log("DB connection error details:", {
            name: err.name,
            code: err.code,
            message: err.message,
            cause: err.cause
        });
        console.log("Please check your internet connection and MongoDB Atlas status");
    })      
  