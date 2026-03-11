// var express = require('express');
// var router = express.Router();

// /* GET users listing. */
// //localhost:3000/api/v1/users
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });
// //localhost:3000/api/v1/users/1
// router.get('/:id', function(req, res, next) {
//   res.send('respond with a resource');
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../schemas/users');

// GET all users (có query username includes)
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    const filter = { isDeleted: false };

    if (username) {
      filter.username = { $regex: username, $options: 'i' }; // case-insensitive contains
    }

    const users = await User.find(filter)
      .populate('role', 'name description')
      .select('-password');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .populate('role', 'name description')
      .select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,          // Nên hash password trong thực tế
      email: req.body.email,
      fullName: req.body.fullName || "",
      avatarUrl: req.body.avatarUrl,
      role: req.body.role,                  // phải là ObjectId hợp lệ
      status: req.body.status || false,
      loginCount: req.body.loginCount || 0
    });

    const savedUser = await newUser.save();
    const populated = await savedUser.populate('role', 'name description');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE soft delete
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User soft deleted', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /enable
router.post('/enable', async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: 'Cần cung cấp email và username' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email, username, isDeleted: false },
      { status: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user với email và username này' });
    }

    res.json({ message: 'User đã được kích hoạt', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /disable
router.post('/disable', async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: 'Cần cung cấp email và username' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email, username, isDeleted: false },
      { status: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user với email và username này' });
    }

    res.json({ message: 'User đã bị vô hiệu hóa', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;