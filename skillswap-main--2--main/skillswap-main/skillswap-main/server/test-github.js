const axios = require('axios');

async function testGitHubAPI() {
  try {
    // Test with a known username
    const username = 'octocat';
    console.log(`Testing GitHub API for user: ${username}`);
    
    const response = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        'User-Agent': 'SkillSwap-Test'
      }
    });
    
    console.log('✅ GitHub API is working!');
    console.log(`User: ${response.data.name}`);
    console.log(`Repos: ${response.data.public_repos}`);
    console.log(`Followers: ${response.data.followers}`);
    
    // Test repos
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        'User-Agent': 'SkillSwap-Test'
      },
      params: { per_page: 5 }
    });
    
    console.log(`\nRecent Repositories:`);
    reposResponse.data.forEach(repo => {
      console.log(`  - ${repo.name} (${repo.language || 'No language'})`);
    });
    
  } catch (error) {
    console.error('❌ GitHub API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testGitHubAPI();