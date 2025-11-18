require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const dbURI = process.env.MONGO_URI;

async function createAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(dbURI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ Email_Address: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin already exists.');
            console.log('📧 Email:', existingAdmin.Email_Address);
            console.log('👤 Role:', existingAdmin.role);
            
            // If exists but not admin role, update it
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                existingAdmin.subscription.isActive = true;
                existingAdmin.subscription.plan = 'premium';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin role!');
            }
            
            await mongoose.disconnect();
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        console.log('👤 Creating admin account...');
        const admin = new User({
            First_name: 'Admin',
            Last_name: 'User',
            Mobile_No: '09123456789',
            Email_Address: 'admin@gmail.com',
            Password: hashedPassword,
            role: 'admin',
            subscription: {
                isActive: true,
                plan: 'premium'
            },
            loginCount: 0,
            firstLogin: new Date(),
            lastLogin: null,
            isActive: true
        });

        await admin.save();
        
        console.log('\n✅ Admin account created successfully!');
        console.log('═══════════════════════════════════');
        console.log('📧 Email: admin@gmail.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: admin');
        console.log('═══════════════════════════════════');
        console.log('⚠️  IMPORTANT: Change password after first login!');
        console.log('');
        
    } catch (err) {
        console.error('❌ Error creating admin:', err.message);
        console.error('Full error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

createAdmin();