// utils/emailService.js - Using Gmail via Nodemailer
const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Create transporter
let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS, // Gmail App Password
    },
  });
  console.log('✅ Gmail transporter configured');
  console.log('📧 Email user:', EMAIL_USER);
} else {
  console.error('❌ EMAIL_USER or EMAIL_PASS not set in environment variables!');
}

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetLink, userName) => {
  console.log('\n📧 ========== EMAIL SERVICE DEBUG ==========');
  console.log('📧 Attempting to send email...');
  console.log('📧 To:', userEmail);
  console.log('📧 From:', EMAIL_USER);
  console.log('📧 User name:', userName);
  console.log('📧 Reset link:', resetLink);
  console.log('📧 Transporter ready:', !!transporter);

  // Validation checks
  if (!transporter) {
    console.error('❌ Email transporter not configured!');
    return { 
      success: false, 
      error: 'Email service not configured. Missing EMAIL_USER or EMAIL_PASS.' 
    };
  }

  const mailOptions = {
    from: `"Enhancify.AI" <${EMAIL_USER}>`,
    to: userEmail,
    subject: '🔐 Password Reset Request - Enhancify.AI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #f9f9f9; }
          .header { background-color: #4338CA; color: white; padding: 30px; text-align: center; }
          .content { background-color: white; padding: 40px 30px; }
          .button { 
            display: inline-block; 
            padding: 15px 40px; 
            background-color: #4338CA; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
          }
          .warning { 
            background-color: #FEF3C7; 
            border-left: 4px solid #F59E0B; 
            padding: 15px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password for your Enhancify.AI account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy this link: <br><code style="background-color: #f3f4f6; padding: 8px; display: inline-block; border-radius: 4px; word-break: break-all;">${resetLink}</code></p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link expires in <strong>1 hour</strong></li>
                <li>If you didn't request this, ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
            <p>Best regards,<br><strong>The Enhancify.AI Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Enhancify.AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    console.log('📤 Sending email via Gmail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('✅ To:', userEmail);
    console.log('========================================\n');
    return { success: true };
  } catch (error) {
    console.error('❌ ========== EMAIL SEND FAILED ==========');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Full error:', error);
    console.error('========================================\n');
    
    // Return user-friendly error messages
    let userMessage = 'Failed to send reset email. Please try again later.';
    
    if (error.code === 'EAUTH') {
      userMessage = 'Email authentication failed. Please contact support.';
    } else if (error.code === 'ECONNECTION') {
      userMessage = 'Could not connect to email service. Please try again.';
    }
    
    return { 
      success: false, 
      error: userMessage,
      technicalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

// Verify email configuration on startup
const verifyEmailConfig = async () => {
  console.log('\n🔍 ========== EMAIL CONFIG CHECK ==========');
  
  if (!EMAIL_USER) {
    console.error('❌ EMAIL_USER not set in environment variables');
    console.error('========================================\n');
    return false;
  }
  
  if (!EMAIL_PASS) {
    console.error('❌ EMAIL_PASS not set in environment variables');
    console.error('========================================\n');
    return false;
  }
  
  console.log('✅ EMAIL_USER:', EMAIL_USER);
  console.log('✅ EMAIL_PASS: Set (length:', EMAIL_PASS.length, ')');
  console.log('✅ Gmail email service configured');
  
  // Optional: Test connection
  if (transporter) {
    try {
      await transporter.verify();
      console.log('✅ Gmail connection verified successfully!');
    } catch (error) {
      console.error('❌ Gmail connection failed:', error.message);
      console.error('⚠️  Check your EMAIL_USER and EMAIL_PASS');
    }
  }
  
  console.log('========================================\n');
  return true;
};

module.exports = {
  sendPasswordResetEmail,
  verifyEmailConfig,
};