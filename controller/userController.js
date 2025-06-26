
const users = require("../model/userModel");

const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt');

// Register Controller
exports.registerController = async (req, res) => {
  const {  email, password /*, referralCode */} = req.body;

  try {
    // Basic validation
    if ( !email || !password ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(406).json({ error: 'Account already exists' });
    }
    /* // Optional: Validate referral code if provided
        let referredBy = null;
        if (referralCode) {
          const referrer = await users.findOne({ referralCode });
          if (!referrer) {
            return res.status(400).json({ error: 'Invalid referral code' });
          }
          referredBy = referrer._id;
        }
     */

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
/* 
        // Generate unique referral code for the new user (simple example)
    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
 */
    // Create new user
    const newUser = new users({
      email,
      password: hashedPassword,
      /* referralCode: newReferralCode,
      referredBy, 
      store referrer’s _id if applicable */
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
 
//update user details

/* exports.updateProfileController = async(req,res)=>{
    const {name, email, password, gender, dob} = req.body

    try{
          const existingUser = await users.findOne({ email });

        const updatedUser = await users.findByIdAndUpdate({_id:existingUser._id},{name,email:email,password,gender,dob},{new:true})
        await updatedUser.save()
        res.status(200).json(updatedUser)
    }
    catch(error){
        res.status(401).json(`Request failed due to ${error}`)
    }

} */

exports.updateProfileController = async (req, res) => {
    const { userId, name,email, mobile, gender, dob, password, address } = req.body;

    try {
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const existingUser = await users.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build the update object
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = mobile;
        if (gender) updateData.gender = gender;
        if (dob) updateData.dob = dob;

        // Optional password update
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        //update Address
        if (address && typeof address === 'object') {
    existingUser.addresses.push(address);
    updateData.addresses = existingUser.addresses;
}


        

        const updatedUser = await users.findByIdAndUpdate(userId, updateData, { new: true });

        // Hide password in response
        const { password: _, ...userWithoutPassword } = updatedUser._doc;

        res.status(200).json({
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};


exports.getUserByIdController = async (req, res) => {
    const { id } = req.params;
    console.log(id);
    

    try {
        const user = await users.findById(id).select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Fetch user error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

