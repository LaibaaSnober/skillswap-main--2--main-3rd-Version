const User = require('../models/User');

//
// GET ALL USERS
//
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    // ⭐ STEP 11: PRIORITY SORT (VERIFICATION BASED)
    users.sort(
      (a, b) =>
        (b.verificationScore || 0) - (a.verificationScore || 0)
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// GET SINGLE USER
//
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// UPDATE PROFILE
//
exports.updateUser = async (req, res) => {
  try {
    const { name, bio, location, skillsOffered, skillsWanted } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (skillsOffered) user.skillsOffered = skillsOffered;
    if (skillsWanted) user.skillsWanted = skillsWanted;
    // ⭐ STEP 12 — REPUTATION SYSTEM

    if (user.githubConnected) {
      user.reputation = (user.reputation || 0) + 20;
    }

    if (user.skillsOffered && user.skillsOffered.length > 3) {
      user.reputation = (user.reputation || 0) + 10;
    }

    if (user.skillsWanted && user.skillsWanted.length > 3) {
      user.reputation = (user.reputation || 0) + 5;
}
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// ➕ ADD SKILL OFFERED
//
exports.addSkillOffered = async (req, res) => {
  try {
    const { name, description, proficiency } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const exists = user.skillsOffered.some(
      s => s.name && s.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsOffered.push({
      name,
      description,
      proficiency
    });

    await user.save();

    res.json(user.skillsOffered);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// ➕ ADD SKILL WANTED
//
exports.addSkillWanted = async (req, res) => {
  try {
    const { name, description, priority } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const exists = user.skillsWanted.some(
      s => s.name && s.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsWanted.push({
      name,
      description,
      priority
    });

    await user.save();

    res.json(user.skillsWanted);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// ⭐ STEP 13 — GET GITHUB VERIFIED USERS
//
exports.getGithubUsers = async (req, res) => {
  try {
    const users = await User.find({
      githubConnected: true
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching GitHub users'
    });
  }
};

//
// ⭐ STEP 14 — GITHUB AUTO SKILL DETECTION
//
exports.detectGithubSkills = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.githubConnected) {
      return res.status(400).json({
        message: 'GitHub not connected'
      });
    }

    // Simulated GitHub repos (later real API lagegi)
    const repos = [
      'react-portfolio',
      'node-api',
      'express-server',
      'mongodb-project'
    ];

    let detectedSkills = [];

    repos.forEach(repo => {
      if (repo.includes('react')) detectedSkills.push('React');
      if (repo.includes('node')) detectedSkills.push('Node.js');
      if (repo.includes('express')) detectedSkills.push('Express.js');
      if (repo.includes('mongo')) detectedSkills.push('MongoDB');
    });

    // remove duplicates
    detectedSkills = [...new Set(detectedSkills)];

    // update user
    user.verifiedSkills = detectedSkills;

    // increase score
    user.verificationScore =
      (user.verificationScore || 0) + detectedSkills.length * 10;

    await user.save();

    res.json({
      message: 'Skills detected successfully',
      verifiedSkills: user.verifiedSkills,
      verificationScore: user.verificationScore
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error detecting GitHub skills'
    });
  }
};
module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  addSkillOffered,
  addSkillWanted,
  getGithubUsers,
  detectGithubSkills
};