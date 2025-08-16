# Google OAuth Setup Guide

This guide will help you set up Google OAuth for local development.

## 🚀 Quick Setup (5 minutes)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a Project
1. Click "Select a project" → "New Project"
2. **Project name:** `DateKeeper Development`
3. Click "Create"

### Step 3: Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure OAuth consent screen:
   - **Application type:** External
   - **Application name:** DateKeeper Local
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **Scopes:** Add email, profile, openid
   - **Test users:** Add your email
   - Click "Save and Continue"

### Step 5: Configure OAuth Client
1. **Application type:** Web application
2. **Name:** DateKeeper Local Development
3. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
4. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Click "Create"

### Step 6: Copy Credentials
1. Copy the **Client ID** and **Client Secret**
2. Add them to your `.env.local` file

## 🔧 Update Your Environment

Update your `.env.local` file:

```bash
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

## ✅ Test Your Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** http://localhost:3000

3. **Click "Sign In"** and test the Google OAuth flow

4. **Check your database:** http://localhost:5555
   - You should see your user created in the User table

## 🔒 Security Notes

### For Local Development
- ✅ Use localhost URLs only
- ✅ Separate from staging/production credentials
- ✅ Add team members as test users if needed

### Important
- 🚨 **Never commit real credentials to git**
- 🚨 **Use different credentials for each environment**
- 🚨 **Keep your `.env.local` file private**

## 🛠️ Alternative: Mock Authentication

If you prefer to mock authentication for local development:

### Option 1: Development-Only Mock User

Add this to your auth configuration:

```typescript
// In src/lib/auth.ts - only for development
const isDevelopment = process.env.NODE_ENV === 'development';

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    // Add a development-only mock provider
    ...(isDevelopment ? [
      {
        id: "dev-mock",
        name: "Development Mock",
        type: "credentials",
        credentials: {},
        authorize: async () => ({
          id: "dev-user-123",
          name: "Dev User",
          email: "dev@localhost",
          image: null,
        }),
      }
    ] : []),
    
    GoogleProvider({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
      // ... rest of config
    }),
  ],
  // ... rest of config
});
```

### Option 2: Environment-Based Mock

```typescript
// In src/lib/config.ts
export const config = {
  features: {
    useMockAuth: process.env.USE_MOCK_AUTH === 'true',
    // ... other features
  },
  // ... rest of config
};
```

## 🎯 Recommendation

**For DateKeeper, I recommend the real OAuth setup because:**

1. **Your app is auth-centric** - OAuth is core functionality
2. **Easy to set up** - Takes 5 minutes
3. **Better testing** - Catches real-world issues
4. **Team consistency** - Same experience for all developers

## 🆘 Troubleshooting

### "redirect_uri_mismatch" Error
- Check that `http://localhost:3000/api/auth/callback/google` is in your authorized redirect URIs
- Make sure there are no trailing slashes

### "invalid_client" Error
- Verify your Client ID and Client Secret are correct
- Check that the OAuth consent screen is configured

### "access_blocked" Error
- Add your email to test users in OAuth consent screen
- Make sure the app is in "Testing" mode for development

### Can't Access Consent Screen
- Try incognito/private browsing mode
- Clear browser cookies for Google

Need help? Check the [Local Development Guide](LOCAL_DEVELOPMENT.md) or open an issue.
