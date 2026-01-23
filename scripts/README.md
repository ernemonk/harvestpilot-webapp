# Data Import Script

This directory contains scripts to populate your Firestore database with initial sample data.

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your Firebase User ID:
   - Sign in to your app
   - Open browser console (F12)
   - Run: `firebase.auth().currentUser.uid`
   - Copy the user ID

## Usage

Run the import script with your user ID:

```bash
npm run load-data YOUR_USER_ID
```

Example:
```bash
npm run load-data abc123xyz789
```

## What Gets Imported

### 1. Crop Data (crops collection)
- **Source**: `sample-crops.csv`
- **Count**: 83 actual crop records
- **Includes**: planted crops, varieties, fields, sections, dates, status

### 2. Crop Research Data (cropResearch collection)
- **Source**: `sample-crop-research.csv`
- **Count**: 65 market research entries
- **Includes**: profitability analysis, growing requirements, pest/disease info

## Script Details

- **File**: `scripts/loadInitialData.js`
- Reads CSV files from project root
- Adds your userId to all records
- Adds Firestore timestamps (createdAt, updatedAt)
- Provides progress feedback
- Shows success/error summary

## Troubleshooting

**Error: "Please provide userId as argument"**
- Make sure to include your user ID when running the command
- Get it from the browser console: `firebase.auth().currentUser.uid`

**Error: "PERMISSION_DENIED"**
- Ensure Firestore security rules are published in Firebase Console
- Check that you're using the correct user ID

**Error: "Cannot find module"**
- Run `npm install` to install dependencies
- Make sure you're in the `/farm-web` directory
