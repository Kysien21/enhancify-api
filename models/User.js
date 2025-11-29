const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  First_name: {
    type: String,
    required: true,
    trim: true,
  },
  Last_name: {
    type: String,
    required: true,
    trim: true,
  },
  // ✅ REMOVED: Mobile_No field
  // ✅ NEW: Category/Department field (not required for admin)
  category: {
    type: String,
    required: function() {
      return this.role !== 'admin'; // Only required for non-admin users
    },
    enum: [
      'Information Technology',
      'Engineering',
      'Business Administration',
      'Healthcare',
      'Education',
      'Marketing',
      'Finance',
      'Human Resources',
      'Sales',
      'Customer Service',
      'Other'
    ],
    trim: true,
  },
  Email_Address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  Password: {
    type: String,
    required: true,
  },

  // ✅ Login tracking
  loginCount: {
    type: Number,
    default: 0,
  },
  firstLogin: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,

  // ✅ OAuth fields
  googleId: String,
  facebookId: String,
  username: String,
  profilePicture: String,

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  // ✅ Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // ✅ Activity tracking
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);