const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Category model
const Category = require('./models/Category');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Categories to seed
const categoriesToSeed = [
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Fun and entertaining content',
    icon: '🎬',
    color: '#EF4444',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Music',
    slug: 'music',
    description: 'Musical performances and content',
    icon: '🎵',
    color: '#8B5CF6',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Dance',
    slug: 'dance',
    description: 'Dance performances and tutorials',
    icon: '💃',
    color: '#EC4899',
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Comedy',
    slug: 'comedy',
    description: 'Funny and humorous content',
    icon: '😄',
    color: '#F59E0B',
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports highlights and content',
    icon: '⚽',
    color: '#10B981',
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming content and highlights',
    icon: '🎮',
    color: '#3B82F6',
    sortOrder: 6,
    isActive: true
  },
  {
    name: 'Food',
    slug: 'food',
    description: 'Food recipes and cooking',
    icon: '🍕',
    color: '#F97316',
    sortOrder: 7,
    isActive: true
  },
  {
    name: 'Travel',
    slug: 'travel',
    description: 'Travel vlogs and destinations',
    icon: '✈️',
    color: '#6366F1',
    sortOrder: 8,
    isActive: true
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational and learning content',
    icon: '📚',
    color: '#14B8A6',
    sortOrder: 9,
    isActive: true
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Tech reviews and tutorials',
    icon: '💻',
    color: '#6B7280',
    sortOrder: 10,
    isActive: true
  }
];

// Seed categories function
const seedCategories = async () => {
  try {
    console.log('🌱 Starting category seeding...');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');
    
    // Insert new categories
    const createdCategories = await Category.insertMany(categoriesToSeed);
    console.log(`✅ Successfully seeded ${createdCategories.length} categories:`);
    
    createdCategories.forEach(category => {
      console.log(`   - ${category.icon} ${category.name} (${category.slug})`);
    });
    
    console.log('🎉 Category seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await seedCategories();
  await mongoose.connection.close();
  console.log('👋 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
