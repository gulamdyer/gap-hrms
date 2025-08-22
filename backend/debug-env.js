const fs = require('fs');
const path = require('path');

console.log('Debugging .env file...');

const envPath = path.join(__dirname, '.env');
console.log('Env file path:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\nFile content (first 500 chars):');
  console.log(content.substring(0, 500));
  
  // Check for BOM or encoding issues
  const buffer = fs.readFileSync(envPath);
  console.log('\nFirst 10 bytes:', buffer.slice(0, 10));
  
  // Try to parse manually
  const lines = content.split('\n');
  console.log('\nParsed lines:');
  lines.slice(0, 10).forEach((line, index) => {
    console.log(`${index + 1}: ${line}`);
  });
}

// Try dotenv
console.log('\n--- Testing dotenv ---');
require('dotenv').config({ path: envPath });

console.log('ORACLE_USER:', process.env.ORACLE_USER);
console.log('ORACLE_PASSWORD:', process.env.ORACLE_PASSWORD ? 'Set' : 'Not set');
console.log('ORACLE_CONNECT_STRING:', process.env.ORACLE_CONNECT_STRING ? 'Set' : 'Not set');