require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await User.findOne({ Email_Address: 'admin@gmail.com' });
        
        if (admin) {
            console.log('👤 Admin found:');
            console.log('   Email:', admin.Email_Address);
            console.log('   Role:', admin.role);
            console.log('   First Name:', admin.First_name);
            console.log('   Active:', admin.isActive);
            
            if (admin.role !== 'admin') {
                console.log('⚠️  Role is not admin! Fixing...');
                admin.role = 'admin';
                await admin.save();
                console.log('✅ Fixed! Role is now admin');
            } else {
                console.log('✅ Admin role is correct!');
            }
        } else {
            console.log('❌ Admin not found!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkAdmin();