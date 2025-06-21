
const users = require("../model/userModel");
const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt');

// Register Controller
exports.registerController = async (req, res) => {
  const { username, email, password,mobile} = req.body;

  try {
    // Basic validation
    if (!username || !email || !password || !mobile) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(406).json({ error: 'Account already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new users({
      username,
      email,
      password: hashedPassword,
      mobile,
      profile: "" // optional
    });

    await newUser.save();

    // Remove password before sending response
    const { password: _, ...userWithoutPassword } = newUser._doc;

    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};


//login
exports.loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await users.findOne({ email });
    if (!existingUser) {
      return res.status(406).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordMatch) {
      return res.status(406).json({ error: 'Invalid email or password' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: existingUser._id },
      'supersecretKey',
      { expiresIn: '7d' }
    );

    // Remove password before sending user data
    const { password: _, ...userWithoutPassword } = existingUser._doc;

    // Send response
    res.status(200).json({ user: userWithoutPassword, token });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};

