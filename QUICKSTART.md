# Sila - Quick Start Guide

Get your Sila transport app running in 5 minutes!

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Set Up Supabase (2 min)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details

### Get API Keys
1. Go to Settings > API
2. Copy "Project URL" and "anon public" key

### Update Configuration
Edit `lib/supabase.js`:
```javascript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';
```

### Create Database Tables
1. Go to SQL Editor in Supabase
2. Copy all SQL from `SETUP.md` (Database Schema section)
3. Click "Run" to create tables and policies

## Step 3: Start the App (1 min)

```bash
npm start
```

Choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

## Step 4: Test the App (1 min)

### Create Transporter Account
1. On Welcome screen, tap "Transporteur" 🚚
2. Tap "Inscrivez-vous" (Sign up)
3. Fill in email, phone, password
4. Tap "S'inscrire"
5. Create a transport offer
6. Select locations on the gradient map
7. Set dates and capacity
8. View your offer on the dashboard

### Create Client Account
1. Go back to Welcome screen (logout first)
2. Tap "Client" 📦
3. Sign up with different email
4. Create a transport request
5. If there's a matching offer, you'll see the match!
6. Complete the mock payment

## Common URLs

- **Supabase Dashboard**: https://app.supabase.com
- **Expo DevTools**: http://localhost:19002 (opens automatically)

## Troubleshooting

### "Cannot find module @react-native-community/datetimepicker"
```bash
npm install
```

### Database errors
- Check your Supabase URL and key in `lib/supabase.js`
- Make sure you ran all SQL from SETUP.md

### Metro bundler issues
```bash
npm start -- --clear
```

### App crashes on start
- Make sure all dependencies are installed
- Check that you're using Node.js v18 or higher
- Clear Metro cache: `expo start --clear`

## What's Next?

Read the full documentation:
- `SETUP.md` - Complete setup instructions
- `PROJECT_SUMMARY.md` - Feature overview

## Need Help?

Check the documentation:
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)

---

**That's it! You should now have a working Sila transport app.** 🎉
