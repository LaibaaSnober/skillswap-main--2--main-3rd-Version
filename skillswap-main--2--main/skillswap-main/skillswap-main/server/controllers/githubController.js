const axios = require('axios');
const User = require('../models/User');

// Language to skill mapping
const languageToSkill = {
  'JavaScript': 'JavaScript',
  'TypeScript': 'TypeScript',
  'Python': 'Python',
  'Java': 'Java',
  'C#': 'C#',
  'C++': 'C++',
  'Ruby': 'Ruby',
  'Go': 'Go',
  'Swift': 'Swift',
  'Kotlin': 'Kotlin',
  'PHP': 'PHP',
  'HTML': 'HTML/CSS',
  'CSS': 'HTML/CSS',
  'Vue': 'Vue.js',
  'React': 'React',
  'Angular': 'Angular',
  'Django': 'Django',
  'Flask': 'Flask',
  'Spring': 'Spring Boot',
  'Express': 'Express.js',
  'Node': 'Node.js',
  'MongoDB': 'MongoDB',
  'SQL': 'SQL',
  'PostgreSQL': 'PostgreSQL',
  'MySQL': 'MySQL',
  'Docker': 'Docker',
  'Kubernetes': 'Kubernetes',
  'AWS': 'AWS',
  'Git': 'Git',
  'GraphQL': 'GraphQL'
};

// Calculate verification score
const calculateScore = (repos, followers, publicRepos, verifiedSkills) => {
  let score = 0;
  
  // Base score from verified skills (10 points each)
  score += verifiedSkills.length * 10;
  
  // Repository count score (max 30 points)
  score += Math.min(publicRepos, 15) * 2;
  
  // Followers score (max 20 points)
  score += Math.min(Math.floor(followers / 5), 20);
  
  // Additional points for having multiple skills (bonus)
  if (verifiedSkills.length >= 5) score += 15;
  else if (verifiedSkills.length >= 3) score += 10;
  else if (verifiedSkills.length >= 1) score += 5;
  
  return Math.min(score, 100);
};

// Get badge based on score
const getBadge = (score) => {
  if (score >= 80) return '🥇 Gold Verified';
  if (score >= 50) return '🥈 Silver Verified';
  if (score >= 25) return '🥉 Bronze Verified';
  return '⚪ Novice';
};

// Connect GitHub
const connectGitHub = async (req, res) => {
  try {
    const userId = req.user._id;
    const { githubUsername } = req.body;

    console.log(`Connecting GitHub for user ${userId} with username: ${githubUsername}`);

    if (!githubUsername || !githubUsername.trim()) {
      return res.status(400).json({
        success: false,
        message: 'GitHub username is required'
      });
    }

    // Clean the username
    const cleanUsername = githubUsername.trim().replace('@', '');

    // Fetch GitHub profile with better error handling
    let profileResponse;
    try {
      console.log(`Fetching GitHub profile for: ${cleanUsername}`);
      profileResponse = await axios.get(`https://api.github.com/users/${cleanUsername}`, {
        headers: {
          'User-Agent': 'SkillSwap-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      });
    } catch (error) {
      console.error('GitHub profile fetch error:', error.response?.status, error.response?.data);
      if (error.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: `GitHub user "${cleanUsername}" not found. Please check the username.`
        });
      }
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          message: 'GitHub API rate limit exceeded. Please try again later.'
        });
      }
      throw error;
    }

    const profile = profileResponse.data;

    // Fetch user's repositories
    let reposResponse;
    try {
      console.log(`Fetching repositories for: ${cleanUsername}`);
      reposResponse = await axios.get(`https://api.github.com/users/${cleanUsername}/repos`, {
        headers: {
          'User-Agent': 'SkillSwap-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          per_page: 100,
          sort: 'updated',
          direction: 'desc'
        },
        timeout: 10000
      });
    } catch (error) {
      console.error('GitHub repos fetch error:', error.message);
      // Continue with empty repos if fetch fails
      reposResponse = { data: [] };
    }

    const repos = reposResponse.data;
    console.log(`Found ${repos.length} repositories for ${cleanUsername}`);
    
    // Detect skills from repositories
    const detectedSkills = new Set();
    const languageCount = {};

    repos.forEach(repo => {
      // Add language as skill
      if (repo.language && languageToSkill[repo.language]) {
        const skill = languageToSkill[repo.language];
        detectedSkills.add(skill);
        languageCount[skill] = (languageCount[skill] || 0) + 1;
      }
      
      // Check repo name for framework detection
      const repoName = repo.name.toLowerCase();
      const repoDesc = (repo.description || '').toLowerCase();
      
      if (repoName.includes('react') || repoDesc.includes('react')) detectedSkills.add('React');
      if (repoName.includes('vue') || repoDesc.includes('vue')) detectedSkills.add('Vue.js');
      if (repoName.includes('angular') || repoDesc.includes('angular')) detectedSkills.add('Angular');
      if (repoName.includes('node') || repoDesc.includes('node')) detectedSkills.add('Node.js');
      if (repoName.includes('express') || repoDesc.includes('express')) detectedSkills.add('Express.js');
      if (repoName.includes('django') || repoDesc.includes('django')) detectedSkills.add('Django');
      if (repoName.includes('docker') || repoDesc.includes('docker')) detectedSkills.add('Docker');
      if (repoName.includes('kubernetes') || repoDesc.includes('k8s')) detectedSkills.add('Kubernetes');
      if (repoName.includes('aws') || repoDesc.includes('aws')) detectedSkills.add('AWS');
      if (repoName.includes('graphql') || repoDesc.includes('graphql')) detectedSkills.add('GraphQL');
      if (repoName.includes('mongodb') || repoDesc.includes('mongo')) detectedSkills.add('MongoDB');
      if (repoName.includes('postgres') || repoDesc.includes('postgres')) detectedSkills.add('PostgreSQL');
      if (repoName.includes('docker') || repoDesc.includes('docker')) detectedSkills.add('Docker');
      if (repoName.includes('flutter') || repoDesc.includes('flutter')) detectedSkills.add('Flutter');
      if (repoName.includes('react-native') || repoDesc.includes('react native')) detectedSkills.add('React Native');
    });

    const verifiedSkills = Array.from(detectedSkills);
    
    // Calculate score and badge
    const verificationScore = calculateScore(
      repos,
      profile.followers || 0,
      profile.public_repos || 0,
      verifiedSkills
    );
    
    const badge = getBadge(verificationScore);

    // Get top 5 repos for display
    const topRepos = repos.slice(0, 10).map(r => ({
      name: r.name,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      description: r.description
    }));

    // Update user with GitHub data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        githubUsername: cleanUsername,
        githubProfile: profile.html_url,
        githubConnected: true,
        verifiedSkills: verifiedSkills,
        verificationScore: verificationScore,
        verificationBadge: badge,
        githubStats: {
          publicRepos: profile.public_repos || 0,
          followers: profile.followers || 0,
          following: profile.following || 0,
          repos: topRepos
        },
        // Update reputation based on GitHub
        $inc: { reputation: Math.min(verifiedSkills.length * 5, 50) }
      },
      { new: true, runValidators: true }
    ).select('-password');

    console.log(`GitHub connected successfully for user ${updatedUser.name}. Score: ${verificationScore}`);

    res.status(200).json({
      success: true,
      message: 'GitHub connected successfully',
      user: updatedUser,
      stats: {
        verifiedSkills,
        verificationScore,
        badge,
        totalRepos: profile.public_repos,
        followers: profile.followers,
        reposAnalyzed: repos.length
      }
    });

  } catch (error) {
    console.error('GitHub connection error:', error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'GitHub connection failed. Please try again.'
    });
  }
};

// Disconnect GitHub
const disconnectGitHub = async (req, res) => {
  try {
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        githubUsername: null,
        githubProfile: null,
        githubConnected: false,
        verifiedSkills: [],
        verificationScore: 0,
        verificationBadge: null,
        githubStats: null
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'GitHub disconnected successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('GitHub disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect GitHub'
    });
  }
};

// Get GitHub status for a user
const getGitHubStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('githubConnected githubUsername githubStats verifiedSkills verificationScore verificationBadge');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      githubConnected: user.githubConnected,
      githubUsername: user.githubUsername,
      verifiedSkills: user.verifiedSkills || [],
      verificationScore: user.verificationScore || 0,
      verificationBadge: user.verificationBadge || '⚪ Novice',
      stats: user.githubStats || null
    });

  } catch (error) {
    console.error('Get GitHub status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get GitHub status' });
  }
};

module.exports = {
  connectGitHub,
  disconnectGitHub,
  getGitHubStatus
};