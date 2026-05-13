const express = require('express');

const router = express.Router();

const {
  connectGitHub
} = require('../controllers/githubController');

const authMiddleware = require('../middleware/auth');

router.post(
  '/connect',
  authMiddleware,
  connectGitHub
);

module.exports = router;