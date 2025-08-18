const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer')

require('dotenv').config();

const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('📁 uploads folder created automatically');
}


const app = express()
const PORT = process.env.PORT || 3000;

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
    cookie: {
        secure: false, // true only if using HTTPS
        sameSite: 'lax'
    }

}))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
const loginRoute = require('./routes/login');
const signupRoute = require('./routes/signup');
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
app.use('/api', signupRoute)
app.use('/api', uploadRoute)
app.use('/api', analysisRoute)
app.use('/api', resultRoute)
app.use('/api', feedbackRoute)
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
const dbURI = 'mongodb+srv://project:aj09126366384@cluster1.gqpv0pu.mongodb.net/resumeDB?retryWrites=true&w=majority&appName=Cluster1';


mongoose.connect(dbURI)
    .then((result) => {
        console.log("connected")
        console.log('✅ Nakakonek sa MongoDB')
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
        })
    })
    .catch(err => console.log('❌ Error:', err))
    .catch(err => console.log('❌ Error:', err))