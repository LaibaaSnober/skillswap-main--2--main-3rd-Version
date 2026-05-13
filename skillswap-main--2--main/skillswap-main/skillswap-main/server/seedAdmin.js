const mongoose = require('mongoose');
const User = require('./models/User'); // path check karo

mongoose.connect('mongodb://laibasnober:admin123@ac-x76thgf-shard-00-00.jgkz6b1.mongodb.net:27017,ac-x76thgf-shard-00-01.jgkz6b1.mongodb.net:27017,ac-x76thgf-shard-00-02.jgkz6b1.mongodb.net:27017/?ssl=true&replicaSet=atlas-9lqban-shard-0&authSource=admin&appName=SkillSwapDB');

async function createAdmin() {
  try {
    const exists = await User.findOne({ email: 'admin@example.com' });

    if (exists) {
      console.log('⚠️ Admin already exists');
      return mongoose.connection.close();
    }

    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'adminpass'
    });

    console.log('✅ Admin created successfully');
    mongoose.connection.close();
  } catch (err) {
    console.log('❌ Error:', err.message);
    mongoose.connection.close();
  }
}

createAdmin();