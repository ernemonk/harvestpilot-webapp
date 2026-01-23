# Admin Role Setup

## How to Make Your User an Admin

The test data buttons are only visible to users with the `admin` role. Here's how to set your user role:

### Option 1: Via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `harvest-hub-2025`
3. Navigate to **Firestore Database**
4. Find the `users` collection
5. Locate your user document (your user ID)
6. Click **Edit document**
7. Add a field:
   - **Field**: `role`
   - **Type**: `string`
   - **Value**: `admin`
8. Click **Update**

### Option 2: Via Browser Console

1. Sign in to your app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Run this command:
   ```javascript
   // First, get your user ID
   const userId = firebase.auth().currentUser.uid;
   console.log('Your user ID:', userId);
   
   // Then update your role to admin
   firebase.firestore().collection('users').doc(userId).update({
     role: 'admin'
   }).then(() => {
     console.log('✅ You are now an admin! Reload the page.');
   });
   ```
5. Reload the page

### Option 3: Quick Browser Script

After signing in, paste this in browser console:

```javascript
firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).update({ role: 'admin' }).then(() => alert('Admin role granted! Reload the page.'));
```

## Test Data Buttons

Once you have admin role, you'll see **"Add Test Data"** buttons on:

- **Crops page** - Adds 3 sample crops (Tomato, Lettuce, Basil)
- **Crop Research page** - Adds 5 sample research entries (Microgreens, Mushrooms, Strawberries, Basil, Lavender)

## Security Note

The test data buttons check the `role` field in your user document. Make sure to add security rules to prevent unauthorized users from setting themselves as admin:

```javascript
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && 
                   request.auth.uid == userId && 
                   // Prevent users from changing their own role
                   !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
}
```

This rule prevents users from changing their own role - only you (via Firebase Console) can set admin status.
