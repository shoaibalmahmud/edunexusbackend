const express = require('express');
const router = express.Router();

// Test endpoint for CORS verification
router.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin',
    userAgent: req.headers['user-agent'],
    method: req.method
  });
});

// Test endpoint for POST requests
router.post('/cors-test', (req, res) => {
  res.json({
    message: 'POST request successful!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin',
    body: req.body,
    method: req.method
  });
});

// Test endpoint for authentication headers
router.get('/auth-test', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = req.headers['x-auth-token'];
  
  res.json({
    message: 'Auth headers received!',
    timestamp: new Date().toISOString(),
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    authHeader: authHeader ? 'Present' : 'Missing',
    token: token ? 'Present' : 'Missing'
  });
});

module.exports = router;
