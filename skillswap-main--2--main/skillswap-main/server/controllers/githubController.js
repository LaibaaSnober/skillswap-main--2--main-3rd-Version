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
  'GraphQL': 'GraphQL',
  'React': 'React',
  'React Native': 'React Native',
  'Flutter': 'Flutter',
  'TensorFlow': 'TensorFlow',
  'PyTorch': 'PyTorch',
  'AI/ML': 'AI/ML',
  'DevOps': 'DevOps'
};

// Calculate verification score
const calculateScore = (repos, followers, publicRepos, verifiedSkills) => {
  let score = 0;
  
  // Base score from verified skills (15 points each)
  score += verifiedSkills.length * 15;
  
  // Repository count score (max 30 points)
  score += Math.min(publicRepos, 15) * 2;
  
  // Followers score (max 25 points)
  score += Math.min(Math.floor(followers / 4), 25);
  
  // Additional bonus for multiple skills
  if (verifiedSkills.length >= 5) score += 20;
  else if (verifiedSkills.length >= 3) score += 15;
  else if (verifiedSkills.length >= 1) score += 10;
  
  return Math.min(score, 100);
};

// Get badge based on score
const getBadge = (score) => {
  if (score >= 80) return '🥇 Gold Verified';
  if (score >= 50) return '🥈 Silver Verified';
  if (score >= 25) return '🥉 Bronze Verified';
  return '⚪ Novice';
};

// Check if a skill already exists in user's offered skills
const skillExists = (skills, skillName) => {
  if (!skills || !Array.isArray(skills)) return false;
  return skills.some(s => s.name && s.name.toLowerCase() === skillName.toLowerCase());
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

    const cleanUsername = githubUsername.trim().replace('@', '');

    // Fetch GitHub profile
    let profileResponse;
    try {
      profileResponse = await axios.get(`https://api.github.com/users/${cleanUsername}`, {
        headers: {
          'User-Agent': 'SkillSwap-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      });
    } catch (error) {
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

    // Fetch repositories
    let reposResponse;
    try {
      reposResponse = await axios.get(`https://api.github.com/users/${cleanUsername}/repos`, {
        headers: {
          'User-Agent': 'SkillSwap-App',
          'Accept': 'application/vnd.github.v3+json'
        },
        params: { per_page: 100, sort: 'updated', direction: 'desc' },
        timeout: 10000
      });
    } catch (error) {
      console.log('Repo fetch error, continuing with empty repos');
      reposResponse = { data: [] };
    }

    const repos = reposResponse.data;
    console.log(`Found ${repos.length} repositories for ${cleanUsername}`);
    
    // Detect skills from repositories
    const detectedSkills = new Set();

    repos.forEach(repo => {
      // Add language as skill
      if (repo.language && languageToSkill[repo.language]) {
        detectedSkills.add(languageToSkill[repo.language]);
      }
      
      // Check repo name/framework detection
      const repoName = repo.name.toLowerCase();
      const repoDesc = (repo.description || '').toLowerCase();
      
      const frameworkMap = {
        'react': 'React',
        'vue': 'Vue.js',
        'angular': 'Angular',
        'node': 'Node.js',
        'express': 'Express.js',
        'django': 'Django',
        'flask': 'Flask',
        'docker': 'Docker',
        'kubernetes': 'Kubernetes',
        'aws': 'AWS',
        'graphql': 'GraphQL',
        'mongodb': 'MongoDB',
        'postgres': 'PostgreSQL',
        'mysql': 'MySQL',
        'flutter': 'Flutter',
        'tensorflow': 'TensorFlow',
        'pytorch': 'PyTorch',
        'next': 'Next.js',
        'typescript': 'TypeScript',
        'javascript': 'JavaScript',
        'python': 'Python',
        'java': 'Java',
        'php': 'PHP',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'swift': 'Swift',
        'kotlin': 'Kotlin'
      };
      
      for (const [key, value] of Object.entries(frameworkMap)) {
        if (repoName.includes(key) || repoDesc.includes(key)) {
          detectedSkills.add(value);
        }
      }
    });

    const verifiedSkills = Array.from(detectedSkills);
    console.log(`Detected skills: ${verifiedSkills.join(', ')}`);
    
    // Fetch current user
    let currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create updated skills offered array
    let updatedSkillsOffered = currentUser.skillsOffered ? [...currentUser.skillsOffered] : [];
    const newSkillsAdded = [];
    const updatedExistingSkills = [];
    
    // Process each verified skill
    for (const skillName of verifiedSkills) {
      // Check if skill already exists in offered skills
      const existingSkillIndex = updatedSkillsOffered.findIndex(s => 
        s.name && s.name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (existingSkillIndex === -1) {
        // Add as new skill with verified flag
        const newSkill = {
          name: skillName,
          description: `✓ Verified via GitHub - ${skillName} expertise detected from repositories`,
          proficiency: 'Verified',
          verified: true,
          verifiedVia: 'github',
          verifiedDate: new Date()
        };
        updatedSkillsOffered.push(newSkill);
        newSkillsAdded.push(skillName);
        console.log(`Added new verified skill: ${skillName}`);
      } else {
        // Update existing skill to mark as verified if not already
        if (!updatedSkillsOffered[existingSkillIndex].verified) {
          updatedSkillsOffered[existingSkillIndex].verified = true;
          updatedSkillsOffered[existingSkillIndex].verifiedVia = 'github';
          updatedSkillsOffered[existingSkillIndex].verifiedDate = new Date();
          updatedSkillsOffered[existingSkillIndex].proficiency = 'Verified';
          updatedSkillsOffered[existingSkillIndex].description = `✓ Verified via GitHub - ${skillName} expertise detected from repositories`;
          updatedExistingSkills.push(skillName);
          console.log(`Updated existing skill to verified: ${skillName}`);
        }
      }
    }
    
    // Calculate score and badge
    const verificationScore = calculateScore(
      repos,
      profile.followers || 0,
      profile.public_repos || 0,
      verifiedSkills
    );
    
    const badge = getBadge(verificationScore);

    // Get top repos for display
    const topRepos = repos.slice(0, 10).map(r => ({
      name: r.name,
      language: r.language,
      stars: r.stargazers_count || 0,
      url: r.html_url,
      description: r.description
    }));

    // Update user with GitHub data AND add verified skills to offered skills
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        githubUsername: cleanUsername,
        githubProfile: profile.html_url,
        githubConnected: true,
        verifiedSkills: verifiedSkills,
        verificationScore: verificationScore,
        verificationBadge: badge,
        skillsOffered: updatedSkillsOffered,
        githubStats: {
          publicRepos: profile.public_repos || 0,
          followers: profile.followers || 0,
          following: profile.following || 0,
          repos: topRepos
        },
        $inc: { reputation: Math.min(verifiedSkills.length * 8, 60) }
      },
      { new: true }
    ).select('-password');

    console.log(`GitHub connection complete. Added ${newSkillsAdded.length} new verified skills. Total skills offered: ${updatedSkillsOffered.length}`);
    console.log(`Skills offered now: ${updatedSkillsOffered.map(s => s.name).join(', ')}`);

    res.status(200).json({
      success: true,
      message: `GitHub connected successfully! Added ${newSkillsAdded.length} verified skills to your profile.`,
      user: updatedUser,
      stats: {
        verifiedSkills,
        newSkillsAdded: newSkillsAdded,
        updatedExistingSkills: updatedExistingSkills,
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

// Disconnect GitHub - Remove verified skills from offered skills
const disconnectGitHub = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Count skills before removal
    const beforeCount = (currentUser.skillsOffered || []).length;
    
    // Remove github-verified skills from offered skills
    const updatedSkillsOffered = (currentUser.skillsOffered || []).filter(skill => {
      // Keep skills that are NOT verified via GitHub
      return !(skill.verified === true && skill.verifiedVia === 'github');
    });
    
    const removedCount = beforeCount - updatedSkillsOffered.length;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        githubUsername: null,
        githubProfile: null,
        githubConnected: false,
        verifiedSkills: [],
        verificationScore: 0,
        verificationBadge: null,
        githubStats: null,
        skillsOffered: updatedSkillsOffered
      },
      { new: true }
    ).select('-password');

    console.log(`GitHub disconnected. Removed ${removedCount} verified skills. Remaining skills: ${updatedSkillsOffered.length}`);

    res.status(200).json({
      success: true,
      message: `GitHub disconnected. Removed ${removedCount} verified skills from your profile.`,
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
    
    const user = await User.findById(userId).select('githubConnected githubUsername githubStats verifiedSkills verificationScore verificationBadge skillsOffered');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get only verified skills from offered skills
    const verifiedOfferedSkills = (user.skillsOffered || []).filter(skill => skill.verified === true);

    res.status(200).json({
      success: true,
      githubConnected: user.githubConnected,
      githubUsername: user.githubUsername,
      verifiedSkills: user.verifiedSkills || [],
      verificationScore: user.verificationScore || 0,
      verificationBadge: user.verificationBadge || '⚪ Novice',
      verifiedOfferedSkills: verifiedOfferedSkills,
      allOfferedSkills: user.skillsOffered || [],
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