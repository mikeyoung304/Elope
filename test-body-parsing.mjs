import fetch from 'node-fetch';

const testData = {
  email: "admin@elope.com",
  password: "admin123"
};

console.log('Testing with different Content-Type headers...\n');

// Test 1: With Content-Type
console.log('Test 1: With Content-Type: application/json');
const response1 = await fetch('http://localhost:3001/v1/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
});
console.log('Status:', response1.status);
console.log('Response:', await response1.text());
console.log('');

// Test 2: Without Content-Type (like browser might send)
console.log('Test 2: Without Content-Type header');
const response2 = await fetch('http://localhost:3001/v1/admin/login', {
  method: 'POST',
  body: JSON.stringify(testData)
});
console.log('Status:', response2.status);
console.log('Response:', await response2.text());
console.log('');

// Test 3: With extra headers browser might send
console.log('Test 3: With browser-like headers');
const response3 = await fetch('http://localhost:3001/v1/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:5173',
    'Referer': 'http://localhost:5173/',
    'User-Agent': 'Mozilla/5.0'
  },
  body: JSON.stringify(testData)
});
console.log('Status:', response3.status);
console.log('Response:', await response3.text());
