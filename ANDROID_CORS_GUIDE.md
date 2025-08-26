# Android App CORS Configuration Guide

This guide explains how to configure your Android app to work with the EduNexus backend API.

## 🚀 Quick Start

### 1. Base URL Configuration

For development, use one of these base URLs in your Android app:

```kotlin
// For Android Emulator
val baseUrl = "http://10.0.2.2:3000/api"

// For Genymotion Emulator
val baseUrl = "http://10.0.3.2:3000/api"

// For Physical Device (replace with your computer's IP)
val baseUrl = "http://192.168.1.100:3000/api" // Adjust IP as needed

// For localhost testing
val baseUrl = "http://localhost:3000/api"
```

### 2. Network Security Configuration

Add this to your `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
        <domain includeSubdomains="true">192.168.1.100</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>
```

Update your `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true"
    ...>
```

### 3. HTTP Client Configuration

#### Using Retrofit + OkHttp:

```kotlin
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val original = chain.request()
        val request = original.newBuilder()
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .method(original.method, original.body)
            .build()
        chain.proceed(request)
    }
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl("http://10.0.2.2:3000/api/")
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
```

#### Using Volley:

```kotlin
val requestQueue = Volley.newRequestQueue(this)
val baseUrl = "http://10.0.2.2:3000/api"

// Example request
val jsonObjectRequest = JsonObjectRequest(
    Request.Method.GET,
    "$baseUrl/test/cors-test",
    null,
    { response ->
        // Handle success
        Log.d("API", "Response: $response")
    },
    { error ->
        // Handle error
        Log.e("API", "Error: ${error.message}")
    }
) {
    override fun getHeaders(): Map<String, String> {
        return mapOf(
            "Content-Type" to "application/json",
            "Accept" to "application/json"
        )
    }
}
requestQueue.add(jsonObjectRequest)
```

### 4. Testing CORS Configuration

Test your connection using these endpoints:

```kotlin
// Test GET request
GET http://10.0.2.2:3000/api/test/cors-test

// Test POST request
POST http://10.0.2.2:3000/api/test/cors-test
Content-Type: application/json

{
    "test": "data"
}

// Test authentication headers
GET http://10.0.2.2:3000/api/test/auth-test
Authorization: Bearer your-token-here
X-Auth-Token: your-token-here
```

## 🔧 Common Issues & Solutions

### Issue 1: Network Security Exception
**Error**: `NetworkSecurityException: Cleartext traffic not permitted`

**Solution**: 
- Add `android:usesCleartextTraffic="true"` to your manifest
- Configure network security config as shown above

### Issue 2: Connection Refused
**Error**: `java.net.ConnectException: Connection refused`

**Solution**:
- Ensure your backend server is running on port 3000
- Check if you're using the correct IP address
- For emulator: use `10.0.2.2` instead of `localhost`
- For physical device: use your computer's local IP address

### Issue 3: CORS Error
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- The backend is already configured for Android apps
- Ensure you're using the correct base URL
- Check that your request includes proper headers

### Issue 4: SSL/TLS Error
**Error**: `SSLHandshakeException` or `CertificateException`

**Solution**:
- For development, use HTTP instead of HTTPS
- Ensure `cleartextTrafficPermitted="true"` is set

## 📱 Example API Calls

### User Registration
```kotlin
val registrationData = JSONObject().apply {
    put("name", "John Doe")
    put("email", "john@example.com")
    put("password", "password123")
    put("role", "student")
}

val request = JsonObjectRequest(
    Request.Method.POST,
    "$baseUrl/auth/register",
    registrationData,
    { response -> /* Handle success */ },
    { error -> /* Handle error */ }
)
```

### User Login
```kotlin
val loginData = JSONObject().apply {
    put("email", "john@example.com")
    put("password", "password123")
}

val request = JsonObjectRequest(
    Request.Method.POST,
    "$baseUrl/auth/login",
    loginData,
    { response -> /* Handle success */ },
    { error -> /* Handle error */ }
)
```

### Get Courses
```kotlin
val request = JsonObjectRequest(
    Request.Method.GET,
    "$baseUrl/courses",
    null,
    { response -> /* Handle success */ },
    { error -> /* Handle error */ }
)
```

## 🔒 Security Notes

1. **For Production**: 
   - Use HTTPS instead of HTTP
   - Update the CORS configuration in `config/cors.js`
   - Remove `android:usesCleartextTraffic="true"`

2. **Authentication**:
   - Store tokens securely using Android Keystore
   - Include tokens in request headers
   - Implement token refresh logic

3. **Error Handling**:
   - Always handle network errors gracefully
   - Show user-friendly error messages
   - Implement retry logic for failed requests

## 🧪 Testing Checklist

- [ ] Backend server is running on port 3000
- [ ] Using correct IP address for your setup
- [ ] Network security config is properly set
- [ ] HTTP client is configured with proper headers
- [ ] Test endpoints return successful responses
- [ ] Authentication endpoints work correctly
- [ ] File upload/download works (if needed)

## 📞 Support

If you encounter issues:
1. Check the server logs for CORS errors
2. Verify your IP address configuration
3. Test with the provided test endpoints
4. Check the network security configuration
