# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name your project (e.g., "Farm Intelligence")
4. Follow the setup wizard

## 2. Enable Authentication

1. In Firebase Console, click "Authentication" in the left sidebar
2. Click "Get Started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## 3. Enable Firestore Database

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (you can configure rules later)
4. Select your region (choose closest to your users)
5. Click "Enable"

## 4. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "Farm Web")
6. Copy the `firebaseConfig` object values

## 5. Configure Your App

1. Copy the `.env.example` file to create `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Firebase configuration values:
   ```
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Important:** Add `.env` to your `.gitignore` to keep your credentials private

## 6. Test Authentication

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:5173/signup
3. Create a test account with:
   - Full name
   - Email address
   - Password (min 6 characters)

4. You should be automatically logged in and redirected to the dashboard

## 7. Firestore Security Rules (Optional but Recommended)

Update your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Features Now Available

✅ **Sign Up**: New users can create accounts with email/password
✅ **Login**: Existing users can sign in
✅ **Logout**: Users can sign out from the user menu
✅ **Protected Routes**: Dashboard, Crops, Harvests, and Customers pages require authentication
✅ **User Menu**: Shows logged-in user's name with dropdown menu
✅ **Auto Redirect**: Unauthenticated users are redirected to login page

## Next Steps

- Set up Firestore collections for crops, harvests, and customers
- Add password reset functionality
- Configure production security rules
- Add email verification
- Implement profile management
