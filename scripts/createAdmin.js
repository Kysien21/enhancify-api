const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Make sure path is correct

const dbURI = 'mongodb+srv://project:aj09126366384@cluster1.gqpv0pu.mongodb.net/resumeDB?retryWrites=true&w=majority&appName=Cluster1';

async function createAdmin() {
    try {
        await mongoose.connect(dbURI);
        console.log('✅ Connected to MongoDB');

        const existingAdmin = await User.findOne({ Email_Address: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin already exists.');
            return mongoose.disconnect();
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = new User({
            First_name: 'Admin',
            Last_name: 'User',
            Mobile_No: '09123456789',
            Email_Address: 'admin@gmail.com',
            Password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin account created');
    } catch (err) {
        console.error('❌ Error creating admin:', err);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin();