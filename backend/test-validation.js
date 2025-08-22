const { validateMonthEndPrerequisites } = require('./controllers/payrollController');

// Mock request and response objects
const mockReq = {
  query: {
    month: 12,
    year: 2024
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('Response Status:', code);
      console.log('Response Data:', JSON.stringify(data, null, 2));
    }
  })
};

// Test the validation function
async function testValidation() {
  try {
    console.log('Testing month-end payroll validation...');
    console.log('Month:', mockReq.query.month, 'Year:', mockReq.query.year);
    console.log('----------------------------------------');
    
    await validateMonthEndPrerequisites(mockReq, mockRes);
    
    console.log('----------------------------------------');
    console.log('Validation test completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testValidation();
