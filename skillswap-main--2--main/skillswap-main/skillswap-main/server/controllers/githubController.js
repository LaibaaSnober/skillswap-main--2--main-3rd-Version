const axios = require('axios');
const User = require('../models/User');

const connectGitHub = async (req, res) => {

  try {

    const userId = req.user.id;

    const { githubUsername } = req.body;
    if (!githubUsername) {
        return res.status(400).json({
        success: false,
        message: "GitHub username is required"
  });
}

    // ===============================
    // FETCH GITHUB PROFILE
    // ===============================

    const profileResponse = await axios.get(
  `https://api.github.com/users/${githubUsername}`,
  {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  }
);

    // ===============================
    // FETCH REPOSITORIES
    // ===============================

    const repoResponse = await axios.get(
  `https://api.github.com/users/${githubUsername}/repos`,
  {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  }
);
    const repos = repoResponse.data;

    let verifiedSkills = [];

    let score = 0;

    // ===============================
    // ANALYZE REPOSITORIES
    // ===============================

    repos.forEach(repo => {

      // Detect Languages
      if (repo.language) {

        verifiedSkills.push(repo.language);

      }

      // Detect React
      if (
        repo.name.toLowerCase().includes('react')
      ) {

        verifiedSkills.push('React');

      }

      // Detect Node
      if (
        repo.name.toLowerCase().includes('node')
      ) {

        verifiedSkills.push('Node.js');

      }

      // Detect Express
      if (
        repo.name.toLowerCase().includes('express')
      ) {

        verifiedSkills.push('Express');

      }

      // Detect MongoDB
      if (
        repo.name.toLowerCase().includes('mongo')
      ) {

        verifiedSkills.push('MongoDB');

      }

    });

    // Remove duplicates
    verifiedSkills = [...new Set(verifiedSkills)];

    // ===============================
    // CALCULATE SCORE
    // ===============================

    score += verifiedSkills.length * 10;

    score += repos.length * 2;

    // ===============================
    // UPDATE USER
    // ===============================

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {

        githubUsername,

        githubProfile: profileResponse.data.html_url,

        githubConnected: true,

        verifiedSkills,

        verificationScore: score,

        githubStats: {

          publicRepos:
            profileResponse.data.public_repos,

          followers:
            profileResponse.data.followers,

          following:
            profileResponse.data.following

        }

      },

      { new: true }

    );

    res.status(200).json({

      success: true,

      message: 'GitHub connected successfully',

      user: updatedUser

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: 'GitHub connection failed'

    });

  }

};

module.exports = {
  connectGitHub
};