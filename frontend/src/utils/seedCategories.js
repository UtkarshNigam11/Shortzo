const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Categories to create
const categories = [
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Fun and entertaining content',
    icon: '🎬',
    color: '#EF4444'
  },
  {
    name: 'Music',
    slug: 'music',
    description: 'Musical performances and content',
    icon: '🎵',
    color: '#8B5CF6'
  },
  {
    name: 'Dance',
    slug: 'dance',
    description: 'Dance performances and tutorials',
    icon: '💃',
    color: '#EC4899'
  },
  {
    name: 'Comedy',
    slug: 'comedy',
    description: 'Funny and humorous content',
    icon: '😄',
    color: '#F59E0B'
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports highlights and content',
    icon: '⚽',
    color: '#10B981'
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming content and highlights',
    icon: '🎮',
    color: '#3B82F6'
  },
  {
    name: 'Food',
    slug: 'food',
    description: 'Food recipes and cooking',
    icon: '🍕',
    color: '#F97316'
  },
  {
    name: 'Travel',
    slug: 'travel',
    description: 'Travel vlogs and destinations',
    icon: '✈️',
    color: '#6366F1'
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational and learning content',
    icon: '📚',
    color: '#14B8A6'
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Tech reviews and tutorials',
    icon: '💻',
    color: '#6B7280'
  }
];

async function createCategory(category) {
  try {
    const response = await axios.post(`${API_BASE_URL}/categories`, category);
    console.log(`✅ Created category: ${category.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create category ${category.name}:`, error.response?.data?.message || error.message);
  }
}

async function seedCategories() {
  console.log('🌱 Starting to seed categories...');
  
  for (const category of categories) {
    await createCategory(category);
  }
  
  console.log('🎉 Category seeding completed!');
}

// Check if categories exist first
async function checkCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    const existingCategories = response.data?.data?.categories || [];
    
    console.log(`📊 Found ${existingCategories.length} existing categories`);
    
    if (existingCategories.length === 0) {
      console.log('🔧 No categories found, seeding...');
      await seedCategories();
    } else {
      console.log('✅ Categories already exist:');
      existingCategories.forEach(cat => {
        console.log(`   - ${cat.icon || '📁'} ${cat.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking categories:', error.message);
    console.log('🔧 Attempting to seed categories anyway...');
    await seedCategories();
  }
}

// Run the script
checkCategories().catch(console.error);
