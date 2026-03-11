const express = require('express');
const router = express.Router();
const Role = require('../schemas/roles');
const User = require('../schemas/users');

// GET all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find({ isDeleted: false });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET role by id
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, isDeleted: false });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create role
router.post('/', async (req, res) => {
  try {
    const newRole = new Role({
      name: req.body.name,
      description: req.body.description || ""
    });
    const savedRole = await newRole.save();
    res.status(201).json(savedRole);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update role
router.put('/:id', async (req, res) => {
  try {
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE soft delete role
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role soft deleted', role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BONUS: GET all users of a specific role
router.get('/:id/users', async (req, res) => {
  try {
    const users = await User.find({
      role: req.params.id,
      isDeleted: false
    })
      .populate('role', 'name description')
      .select('-password'); // không trả về password

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;