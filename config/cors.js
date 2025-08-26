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
        'http://0.0.0.0:3000'
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
      // In production, be more restrictive
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'https://yourdomain.com', // Replace with your actual domain
        'https://www.yourdomain.com',
        'capacitor://localhost',
        'ionic://localhost',
        'file://'
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
      'X-Auth-Token'
    ],
    exposedHeaders: ['Content-Length'],
    maxAge: 86400
  }
};

module.exports = corsConfig;
