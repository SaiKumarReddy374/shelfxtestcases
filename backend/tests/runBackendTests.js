import { execSync } from 'child_process';

// Run any backend test framework, e.g., Mocha, Jest, etc.
try {
  console.log('Running Backend Tests...');
  execSync('jest backend/tests', { stdio: 'inherit' });  // Adjust this if using Mocha or another test runner
} catch (error) {
  console.error('Backend Tests failed:', error);
  process.exit(1);  // Exit with error code if tests fail
}
