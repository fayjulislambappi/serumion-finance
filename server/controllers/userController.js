const User = require('../models/User');
const Partner = require('../models/Partner');
const bcrypt = require('bcryptjs');

// @desc    Get all system users
// @route   GET /api/users
// @access  Private (Restricted to super_admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').populate('partnerProfileRef');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// @desc    Create a new user account (partner or staff or admin)
// @route   POST /api/users
// @access  Private (Restricted to super_admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, equitySharePercentage, profitScaleFactor, totalCapitalInvested } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role && ['super_admin', 'partner', 'staff'].includes(role) ? role : 'staff';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
    });

    let partnerProfile = null;

    if (userRole === 'partner') {
      partnerProfile = await Partner.create({
        userId: user._id,
        partnerName: name,
        equitySharePercentage: equitySharePercentage || 0,
        profitScaleFactor: profitScaleFactor !== undefined ? Number(profitScaleFactor) : 1.0,
        totalCapitalInvested: totalCapitalInvested || 0,
        totalWithdrawn: 0,
      });

      user.partnerProfileRef = partnerProfile._id;
      await user.save();
    }

    const createdUser = await User.findById(user._id).select('-passwordHash').populate('partnerProfileRef');
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// @desc    Update user role or partner settings
// @route   PUT /api/users/:id
// @access  Private (Restricted to super_admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, equitySharePercentage, profitScaleFactor, totalCapitalInvested } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }
    if (role && ['super_admin', 'partner', 'staff'].includes(role)) {
      user.role = role;
    }

    // If role is partner, manage partner profile
    if (user.role === 'partner') {
      let partner = await Partner.findOne({ userId: user._id });
      if (!partner) {
        partner = await Partner.create({
          userId: user._id,
          partnerName: user.name,
          equitySharePercentage: equitySharePercentage || 0,
          profitScaleFactor: profitScaleFactor !== undefined ? Number(profitScaleFactor) : 1.0,
          totalCapitalInvested: totalCapitalInvested || 0,
        });
        user.partnerProfileRef = partner._id;
      } else {
        partner.partnerName = user.name;
        if (equitySharePercentage !== undefined) partner.equitySharePercentage = Number(equitySharePercentage);
        if (profitScaleFactor !== undefined) partner.profitScaleFactor = Number(profitScaleFactor);
        if (totalCapitalInvested !== undefined) partner.totalCapitalInvested = Number(totalCapitalInvested);
        await partner.save();
      }
    }

    await user.save();

    const updatedUser = await User.findById(id).select('-passwordHash').populate('partnerProfileRef');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Restricted to super_admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own master super_admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.partnerProfileRef) {
      await Partner.findByIdAndDelete(user.partnerProfileRef);
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
