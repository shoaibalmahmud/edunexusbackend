const corsConfig = {
  development: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // Allow specific origins for development
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
        'http://192.168.1.100:3000', // Common local IP for Android testing
        'http://192.168.1.101:3000',
        'http://192.168.1.102:3000',
        'http://192.168.1.103:3000',
        'http://192.168.1.104:3000',
        'http://192.168.1.105:3000',
        'http://10.0.2.2:3000', // Android emulator localhost
        'http://10.0.3.2:3000', // Genymotion emulator localhost
        'capacitor://localhost', // Capacitor apps
        'ionic://localhost', // Ionic apps
        'file://', // File protocol for mobile apps
        'http://localhost', // General localhost
        'https://localhost', // HTTPS localhost
        'http://0.0.0.0:8080',
        'http://0.0.0.0:3000',
        'https://edunexusbackend.onrender.com'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Auth-Token',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    maxAge: 86400
  },
  
  production: {
    origin: function (origin, callback) {
      // For mobile apps, we need to be more permissive with origins
      // Mobile apps often don't send proper origin headers
      if (!origin) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'https://edunexusbackend.onrender.com',
        'https://edunexus-frontend.onrender.com',
        'capacitor://localhost',
        'ionic://localhost',
        'file://',
        'http://10.0.2.2:3000',
        // Allow all Render domains for testing
        /^https:\/\/.*\.onrender\.com$/,
        // Allow local development for mobile testing
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Local network IPs
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,  // Android emulator IPs
        /^http:\/\/localhost:\d+$/,
        /^https:\/\/localhost:\d+$/
      ];
      
      // Check if origin matches any allowed origin (including regex patterns)
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        // For mobile apps, we might want to be more lenient
        // Uncomment the line below if you want to allow all origins in production
        // callback(null, true);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Auth-Token'
    ],
    exposedHeaders: ['Content-Length'],
    maxAge: 86400
  }
};

module.exports = corsConfig;
