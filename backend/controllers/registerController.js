import User from '../models/userModel.js';
import nodemailer from 'nodemailer';
import { generateVerificationEmailHTML } from '../templates/emailTemplate.js';

// Temporary storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  try {
    console.log(`Attempting to send email to: ${email}`);
    console.log(`Using EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASS configured: ${process.env.EMAIL_PASS ? 'Yes' : 'No'}`);
    
    const transporter = createTransporter();
    
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    const mailOptions = {
      from: `"🎬 CineTicket" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎬 CineTicket - Mã xác minh đăng ký tài khoản',
      html: generateVerificationEmailHTML(code)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};


// @route   POST /api/auth/send-verification
// @access  Public
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (5 minutes)
    verificationCodes.set(email, {
      code: code,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // Send email
    const emailSent = await sendVerificationEmail(email, code);
    
    if (emailSent) {
      console.log(`✅ Verification code sent to ${email}: ${code}`);
      res.status(200).json({
        message: 'Mã xác minh đã được gửi đến email của bạn',
        emailSent: true
      });
    } else {
      console.log(`⚠️ Email sending failed, fallback to demo mode for ${email}: ${code}`);
      res.status(200).json({
        message: 'Mã xác minh đã được tạo (Demo mode - kiểm tra console)',
        emailSent: false,
        code: code // Only show in demo mode when email fails
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/verify-code
// @access  Public
export const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  
  try {
    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (stored.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
    }

    if (stored.code !== code) {
      stored.attempts++;
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Code is valid, remove it from storage
    verificationCodes.delete(email);
    
    res.status(200).json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, phone, province, city, gender, dob, role, preferences } = req.body;
  console.log("Register User Data:", req.body); 
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      province,
      city,
      gender,
      dob,
      role: role || 'customer',
      preferences: preferences || {},
    });

    // Hide password in response
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({
      message: 'User registered successfully',
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};