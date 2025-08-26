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

## Step 4: Update CORS Configuration

Before deploying, update your CORS configuration in `config/cors.js`:

```javascript
production: {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://your-frontend-domain.com', // Replace with your frontend URL
      'https://your-mobile-app-domain.com',
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
  // ... rest of config
}
```

## Step 5: Test Your Deployment

1. Wait for the build to complete
2. Your app will be available at: `https://your-app-name.onrender.com`
3. Test your API endpoints

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
