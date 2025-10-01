const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up test environment...\n');

// 1. Read .env file and extract MONGODB_URI
console.log('1. Reading .env configuration...');
let mongoUri;
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    if (line.startsWith('MONGODB_URI=')) {
      mongoUri = line.substring(12).trim(); // Remove "MONGODB_URI=" prefix
      break;
    }
  }
} catch (error) {
  console.log('Error reading .env file:', error.message);
  process.exit(1);
}

// 2. Check MongoDB URI configuration
console.log('2. Checking MongoDB URI configuration...');
if (!mongoUri) {
  console.log('MongoDB URI not found in .env file');
  console.log('Please make sure MONGODB_URI is set in your .env file');
  process.exit(1);
}

console.log(`Raw MongoDB URI: ${mongoUri}`);
console.log(`Sanitized MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
console.log('MongoDB connection will be tested during seeding...');

// 3. Check Node.js and npm
console.log('\n3. Checking Node.js and npm...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`Node.js: ${nodeVersion}`);
  console.log(`npm: ${npmVersion}`);
} catch (error) {
  console.log('Node.js or npm not found. Please install Node.js.');
  process.exit(1);
}

// 4. Install dependencies if needed
console.log('\n4. Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.log('Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('Dependencies already installed');
}

// 5. Database cleanup
console.log('\n5. Database cleanup...');
console.log('Database will be cleared automatically by the seeder');

// 6. Check TypeScript compilation
console.log('\n6. Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('TypeScript compilation successful');
} catch (error) {
  console.log('TypeScript compilation failed. Please fix compilation errors first.');
  console.log('Error details:', error.message);
  process.exit(1);
}

// 7. Run seeder
console.log('\n7. Seeding test data...');
try {
  execSync('npx ts-node src/seeds/test-data.seed.ts', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGODB_URI: mongoUri
    }
  });
  console.log('Test data seeded successfully');
} catch (error) {
  console.log('Seeding failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Make sure MongoDB Atlas connection is working');
  console.log('2. Check that MONGODB_URI is correctly set in .env file');
  console.log('3. Verify network access to MongoDB Atlas');
  console.log('4. Check that all entities are properly imported');
  process.exit(1);
}

console.log('\nTest environment setup complete!');
console.log(`\nDatabase: Using MongoDB Atlas`);
console.log(`URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
console.log('\nNext steps:');
console.log('1. Start the server: npm run start:dev');
console.log('2. Open Thunder Client or Postman');
console.log('3. Use these test credentials:');
console.log('   Email: juan.perez@estudiante.edu');
console.log('   Password: password123');
console.log('   Student Code: SIS2024001');
console.log('\nHappy testing!');