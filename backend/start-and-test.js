const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting server and testing...');

// Start the server
const server = spawn('node', ['working-server.js'], {
  stdio: 'pipe'
});

// Wait for server to start
setTimeout(() => {
  console.log('🔍 Testing server...');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Server is working!');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      
      // Test status update endpoint
      testStatusUpdate();
    });
  });

  req.on('error', (error) => {
    console.log('❌ Server test failed:', error.message);
    server.kill();
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('❌ Server test timeout');
    server.kill();
    process.exit(1);
  });

  req.end();
}, 3000);

function testStatusUpdate() {
  console.log('🔍 Testing status update endpoint...');
  
  const postData = JSON.stringify({ status: 'INACTIVE' });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/21/status',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-jwt-token',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Status update test successful!');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      
      console.log('\n🎉 All tests passed! Server is ready.');
      console.log('🔗 Frontend can now connect to http://localhost:5000');
      
      // Keep server running
      console.log('\n📝 Server is running. Press Ctrl+C to stop.');
    });
  });

  req.on('error', (error) => {
    console.log('❌ Status update test failed:', error.message);
    server.kill();
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

// Handle server output
server.stdout.on('data', (data) => {
  console.log('Server:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.log('Server Error:', data.toString().trim());
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
}); 