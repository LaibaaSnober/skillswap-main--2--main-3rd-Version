const User = require('../models/User');

// Add skill
exports.addSkill = async (req, res) => {
  try {
    const { type, skill } = req.body; 
    // type = "offered" or "wanted"

    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (type === 'offered') {
      user.skillsOffered.push(skill);
    } else if (type === 'wanted') {
      user.skillsWanted.push(skill);
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove skill
exports.removeSkill = async (req, res) => {
  try {
    const { type, skill } = req.body;

    const user = await User.findById(req.user.userId);

    if (type === 'offered') {
      user.skillsOffered = user.skillsOffered.filter(s => s !== skill);
    } else if (type === 'wanted') {
      user.skillsWanted = user.skillsWanted.filter(s => s !== skill);
    }

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};