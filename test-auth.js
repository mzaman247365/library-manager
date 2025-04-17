import fetch from 'node-fetch';

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'n1mD@'
};

// Base URL
const BASE_URL = 'http://localhost:5000';

// Test login flow
async function testLogin() {
  console.log('===== TESTING AUTHENTICATION =====');
  
  let cookieJar = '';
  let userId = null;

  try {
    // Step 1: Login attempt
    console.log('1. Testing login API...');
    
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed with status: ${loginRes.status}`);
    }

    // Get cookies from response
    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (setCookieHeader) {
      cookieJar = setCookieHeader;
      console.log('✓ Login successful, got session cookie');
    } else {
      throw new Error('No cookie returned from login');
    }
    
    const userData = await loginRes.json();
    userId = userData.id;
    console.log(`✓ Login returned user data: ${userData.username} (ID: ${userId})`);

    // Step 2: Verify session with /api/user
    console.log('\n2. Testing session validation...');
    
    const userRes = await fetch(`${BASE_URL}/api/user`, {
      headers: {
        Cookie: cookieJar
      }
    });

    if (!userRes.ok) {
      throw new Error(`Session validation failed with status: ${userRes.status}`);
    }

    const user = await userRes.json();
    console.log(`✓ Session validated, user data returned: ${user.username} (ID: ${user.id})`);

    // Test passed!
    console.log('\n✅ AUTHENTICATION TEST PASSED');
    return true;
  } catch (error) {
    console.error(`❌ TEST FAILED: ${error.message}`);
    return false;
  }
}

// Run the test
testLogin();
