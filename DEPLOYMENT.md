# Deploying EduNexus Backend to Render

This guide will help you deploy your EduNexus backend application to Render.

## Prerequisites

1. A Render account (free at [render.com](https://render.com))
2. A MongoDB database (you can use MongoDB Atlas for free)
3. Your code pushed to a Git repository (GitHub, GitLab, etc.)

## Step 1: Prepare Your Database

### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/edunexus?retryWrites=true&w=majority`)

### Option B: Render MongoDB (Paid)
1. In your Render dashboard, create a new MongoDB service
2. Use the provided connection string

## Step 2: Deploy to Render

### Method 1: Using render.yaml (Recommended)
1. Push your code to GitHub/GitLab with the `render.yaml` file
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" and select "Blueprint"
4. Connect your repository
5. Render will automatically detect the `render.yaml` file and create your service

### Method 2: Manual Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `edunexus-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Step 3: Configure Environment Variables

In your Render service dashboard, go to "Environment" tab and add:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string_here
```

## Step 4: Mobile App API Configuration

Your CORS configuration has been updated to support mobile app development. The configuration includes:

- **Mobile App Protocols**: `capacitor://localhost`, `ionic://localhost`, `file://`
- **Local Network Testing**: Support for local IP addresses (192.168.x.x, 10.x.x.x)
- **Android Emulator**: Support for Android emulator localhost (10.0.2.2)
- **Render Domains**: All Render domains for deployment

### For Mobile App Development:

1. **Update your mobile app's API base URL** to point to your Render deployment:
   ```
   https://your-app-name.onrender.com
   ```

2. **For local development**, your mobile app can still use:
   ```
   http://192.168.x.x:3000 (your local IP)
   http://10.0.2.2:3000 (Android emulator)
   ```

3. **For production**, use your Render URL:
   ```
   https://edunexusbackend.onrender.com
   ```

### CORS Configuration (Already Updated)

The CORS configuration in `config/cors.js` is now optimized for mobile apps:

```javascript
production: {
  origin: function (origin, callback) {
    // For mobile apps, we need to be more permissive with origins
    if (!origin) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://edunexusbackend.onrender.com',
      'capacitor://localhost',
      'ionic://localhost',
      'file://',
      // Allow all Render domains for testing
      /^https:\/\/.*\.onrender\.com$/,
      // Allow local development for mobile testing
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Local network IPs
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,  // Android emulator IPs
    ];
    
    // ... rest of validation logic
  }
}
```

## Step 5: Test Your Deployment

1. Wait for the build to complete
2. Your app will be available at: `https://your-app-name.onrender.com`
3. Test your API endpoints

## Step 6: Mobile App Integration

### Update Your Mobile App Configuration

1. **For Production**: Update your mobile app's API base URL to:
   ```
   https://edunexusbackend.onrender.com
   ```

2. **For Development**: Keep using your local development URL:
   ```
   http://192.168.x.x:3000 (your local IP)
   http://10.0.2.2:3000 (Android emulator)
   ```

### Testing Your Mobile App

1. **Test with Postman/Insomnia**:
   - Base URL: `https://edunexusbackend.onrender.com`
   - Test your authentication endpoints: `/api/auth/login`, `/api/auth/register`
   - Test your course endpoints: `/api/courses`

2. **Test with Your Mobile App**:
   - Update the API base URL in your mobile app
   - Test login/registration functionality
   - Test course listing and details
   - Test file uploads (if applicable)

### Common Mobile App Issues

1. **CORS Errors**: The CORS configuration is now optimized for mobile apps
2. **Network Timeout**: Render free tier has cold starts (30-60 seconds for first request)
3. **SSL Certificate**: Render provides automatic HTTPS
4. **API Response Time**: Consider implementing loading states in your mobile app

## Important Notes

- **Free Plan Limitations**: 
  - Services sleep after 15 minutes of inactivity
  - First request after sleep may take 30-60 seconds
  - 750 hours per month

- **Environment Variables**: Never commit sensitive data like database passwords to your repository

- **Logs**: Check the "Logs" tab in Render dashboard for debugging

- **Custom Domain**: You can add a custom domain in the "Settings" tab

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check the build logs for missing dependencies
2. **Database Connection**: Ensure your MongoDB URI is correct and accessible
3. **CORS Errors**: Update your CORS configuration for production
4. **Port Issues**: Render automatically sets the PORT environment variable

### Getting Help:
- Check Render's [documentation](https://render.com/docs)
- Review your application logs in the Render dashboard
- Ensure all environment variables are properly set
