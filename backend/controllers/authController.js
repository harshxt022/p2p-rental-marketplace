const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      city: city ? city.trim() : 'Chandigarh'
    });
    const token = signToken(user._id);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, city, isVerified } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof city === 'string' && city.trim()) updates.city = city.trim();
    if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
