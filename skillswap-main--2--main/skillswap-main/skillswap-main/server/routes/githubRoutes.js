const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  connectGitHub,
  disconnectGitHub,
  getGitHubStatus
} = require('../controllers/githubController');

// Connect GitHub account
router.post('/connect', auth, connectGitHub);

// Disconnect GitHub account
router.delete('/disconnect', auth, disconnectGitHub);

// Get GitHub status for a user (public)
router.get('/status/:userId', getGitHubStatus);

// Get current user's GitHub status
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      githubConnected: req.user.githubConnected,
      githubUsername: req.user.githubUsername,
      verifiedSkills: req.user.verifiedSkills || [],
      verificationScore: req.user.verificationScore || 0,
      verificationBadge: req.user.verificationBadge || '⚪ Novice',
      githubStats: req.user.githubStats
    });
  } catch (error) {
    console.error('Get GitHub status error:', error);
    res.status(500).json({ message: 'Failed to get GitHub status' });
  }
});

module.exports = router;