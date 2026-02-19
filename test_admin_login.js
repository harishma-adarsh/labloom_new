const axios = require('axios');

async function testAdminLogin() {
    try {
        console.log('Testing Admin Request OTP...');
        const res = await axios.post('http://localhost:5000/api/admin/request-otp', {
            phone: '1234567890'
        });
        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        console.error('Data:', error.response ? error.response.data : 'no data');
    }
}

testAdminLogin();
