const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up test environment...\n');

// 1. Check if MongoDB is running
console.log('1️⃣ Checking MongoDB connection...');
try {
  execSync('mongosh --eval "db.adminCommand(\'ping\')"', { stdio: 'pipe' });
  console.log('✅ MongoDB is running');
} catch (error) {
  console.log('❌ MongoDB is not running. Please start MongoDB first.');
  console.log('   Run: mongod --dbpath /path/to/your/db');
  process.exit(1);
}

// 2. Install dependencies if needed
console.log('\n2️⃣ Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
} else {
  console.log('✅ Dependencies already installed');
}

// 3. Clear previous test data
console.log('\n3️⃣ Clearing previous test data...');
try {
  execSync('mongosh university_test --eval "db.dropDatabase()"', { stdio: 'pipe' });
  console.log('✅ Previous test data cleared');
} catch (error) {
  console.log('ℹ️ No previous test data to clear');
}

// 4. Build the application
console.log('\n4️⃣ Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully');
} catch (error) {
  console.log('❌ Build failed. Please fix compilation errors first.');
  process.exit(1);
}

// 5. Run seeder
console.log('\n5️⃣ Seeding test data...');
try {
  execSync('npx ts-node src/seeds/test-data.seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  console.log('✅ Test data seeded successfully');
} catch (error) {
  console.log('❌ Seeding failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Test environment setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Start the server: npm run start:dev');
console.log('2. Use the test credentials provided above');
console.log('3. Follow the testing guide');
console.log('\n🚀 Happy testing!');