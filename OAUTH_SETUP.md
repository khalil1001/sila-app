# OAuth Setup Guide for Sila App

Google OAuth is now functional, but requires configuration in your Supabase dashboard.

## Current Status

✅ **Code is ready** - Google OAuth integration is fully implemented
⚠️ **Configuration needed** - You need to enable Google provider in Supabase

## How It Works Now

When you click "Continuer avec Google":
1. The app will show a helpful message explaining what's needed
2. If Google provider is configured, it will redirect to Google for authentication
3. After auth, the user is redirected back and a profile is automatically created

## To Enable Google OAuth

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. For application type, select "Web application"
7. Add authorized redirect URIs (add BOTH):
   ```
   https://hodmhqrisqskgyggwgyu.supabase.co/auth/v1/callback
   silaapp://
   ```
   Note: The first URL is for Supabase, the second is for your mobile app
8. Save and copy your:
   - Client ID
   - Client Secret

### 2. Configure in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Authentication → URL Configuration
4. Add `silaapp://` to the "Redirect URLs" list
5. Click Save
6. Go to Authentication → Providers
7. Find "Google" in the list
8. Toggle it ON
9. Paste your Google Client ID
10. Paste your Google Client Secret
11. Click Save

### 3. Test It

1. Reload your Sila app
2. Click "Continuer avec Google"
3. You'll be redirected to Google login
4. After authentication, you'll be back in the app with your account created!

## For Mobile Apps (Later)

When you deploy to real iOS/Android devices, you'll need to:

1. Add deep linking configuration
2. Update redirect URLs in OAuth providers
3. Use `expo-auth-session` for better mobile OAuth handling

## Current Fallback

Until you configure OAuth providers:
- Clicking OAuth buttons shows a helpful message
- Users can still use email/password authentication
- The message explains what's needed to enable OAuth

## What Happens After OAuth

1. User authenticates with Google/Facebook
2. App receives the user session
3. Profile is automatically created with:
   - Email from OAuth provider
   - User type (transporter/client) from signup screen
   - Empty phone field (can be updated in profile later)
4. User is taken to appropriate dashboard

## Testing Google OAuth (After Setup)

### As Transporter
1. Click "Transporteur" on welcome screen
2. Click "Continuer avec Google"
3. Authenticate with Google
4. You'll be in Transporter Dashboard

### As Client
1. Click "Client" on welcome screen
2. Click "Continuer avec Google"
3. Authenticate with Google
4. You'll be in Client Dashboard

## Troubleshooting

### "Configuration requise" alert shows
- Google OAuth is not configured in Supabase
- Follow the setup steps above

### OAuth redirect doesn't work
- Check redirect URLs match exactly
- Make sure Google provider is enabled in Supabase
- Clear browser cache and try again

### Profile not created
- Check browser console for errors
- Verify RLS policies allow profile insertion
- Make sure localStorage is available

## Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Your Supabase Dashboard](https://app.supabase.com/project/hodmhqrisqskgyggwgyu)
- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)

---

**Note**: Email/password authentication works perfectly without any additional setup, so users can start using the app immediately!
