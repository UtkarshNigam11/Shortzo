const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const categories = [
  {
    name: 'Infotainment',
    description: 'Educational and informative content that entertains',
    icon: '🧠',
    color: '#4285F4',
    sortOrder: 1
  },
  {
    name: 'Entertainment',
    description: 'General entertainment content',
    icon: '🎭',
    color: '#DB4437',
    sortOrder: 2
  },
  {
    name: 'News',
    description: 'Current events and news updates',
    icon: '📰',
    color: '#F4B400',
    sortOrder: 3
  },
  {
    name: 'Music',
    description: 'Music performances, covers, and original songs',
    icon: '🎵',
    color: '#0F9D58',
    sortOrder: 4
  },
  {
    name: 'Dance',
    description: 'Dance performances and choreography',
    icon: '💃',
    color: '#AB47BC',
    sortOrder: 5
  },
  {
    name: 'Makeup',
    description: 'Makeup tutorials and beauty tips',
    icon: '💄',
    color: '#FF7043',
    sortOrder: 6
  },
  {
    name: 'Beauty',
    description: 'Beauty tips, skincare, and lifestyle',
    icon: '✨',
    color: '#EC407A',
    sortOrder: 7
  },
  {
    name: 'Edits',
    description: 'Creative video edits and transitions',
    icon: '🎬',
    color: '#42A5F5',
    sortOrder: 8
  },
  {
    name: 'Comedy',
    description: 'Funny and humorous content',
    icon: '😂',
    color: '#FFA726',
    sortOrder: 9
  },
  {
    name: 'Sports',
    description: 'Sports highlights and athletic content',
    icon: '⚽',
    color: '#66BB6A',
    sortOrder: 10
  },
  {
    name: 'Food',
    description: 'Cooking, recipes, and food reviews',
    icon: '🍳',
    color: '#FF8A65',
    sortOrder: 11
  },
  {
    name: 'Travel',
    description: 'Travel vlogs and destination content',
    icon: '✈️',
    color: '#26C6DA',
    sortOrder: 12
  },
  {
    name: 'Education',
    description: 'Educational tutorials and learning content',
    icon: '📚',
    color: '#7E57C2',
    sortOrder: 13
  },
  {
    name: 'Technology',
    description: 'Tech reviews, tutorials, and innovations',
    icon: '💻',
    color: '#78909C',
    sortOrder: 14
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️ Cleared existing categories');

    // Insert new categories
    await Category.insertMany(categories);
    console.log('✅ Categories seeded successfully');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@shortzo.com' });
    
    if (!adminExists) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@shortzo.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        bio: 'Shortzo Administrator'
      });

      await adminUser.save();
      console.log('✅ Admin user created');
      console.log('📧 Email: admin@shortzo.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
