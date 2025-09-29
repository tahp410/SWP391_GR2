import User from '../models/userModel.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, phone, province, city, gender, dob, role, preferences } = req.body;
  console.log("Register User Data:", req.body); // Debug line
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