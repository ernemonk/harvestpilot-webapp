import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide userId as argument');
  console.log('Usage: node scripts/loadInitialData.js YOUR_USER_ID');
  console.log('\nTo get your userId:');
  console.log('1. Sign up/login to your app');
  console.log('2. Open browser console');
  console.log('3. Run: firebase.auth().currentUser.uid');
  process.exit(1);
}

async function loadCropData() {
  console.log('📦 Loading crop data from sample-crops.csv...');
  
  const csvPath = join(__dirname, '..', 'sample-crops.csv');
  const fileContent = readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Found ${records.length} crops to import`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      // Convert date strings to Firestore Timestamps
      const plantedDate = new Date(record.plantedDate);
      const harvestReadyDate = new Date(record.harvestReadyDate);

      const cropData = {
        name: record.name,
        variety: record.variety,
        fieldName: record.fieldName,
        sectionName: record.sectionName,
        plantedDate: Timestamp.fromDate(plantedDate),
        harvestReadyDate: Timestamp.fromDate(harvestReadyDate),
        status: record.status,
        area: record.area ? parseFloat(record.area) : undefined,
        expectedYield: record.expectedYield ? parseFloat(record.expectedYield) : undefined,
        notes: record.notes || undefined,
        userId: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Dummy IDs for fieldId and sectionId
        fieldId: 'field-' + record.fieldName.toLowerCase().replace(/\s+/g, '-'),
        sectionId: 'section-' + record.sectionName.toLowerCase().replace(/\s+/g, '-')
      };

      await addDoc(collection(db, 'crops'), cropData);
      successCount++;
      console.log(`✅ Added: ${record.name} (${record.variety})`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to add ${record.name}:`, error.message);
    }
  }

  console.log(`\n📊 Crop Import Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
}

async function loadCropResearchData() {
  console.log('\n📚 Loading crop research data from sample-crop-research.csv...');
  
  const csvPath = join(__dirname, '..', 'sample-crop-research.csv');
  const fileContent = readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Found ${records.length} crop research entries to import`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      const researchData = {
        name: record.name,
        category: record.category,
        startupCostPerAcre: record.startupCostPerAcre,
        annualRevenuePerAcre: record.annualRevenuePerAcre,
        profitMargin: record.profitMargin,
        growingTime: record.growingTime,
        laborIntensity: record.laborIntensity,
        bayAreaSuitability: parseInt(record.bayAreaSuitability),
        marketDemand: record.marketDemand,
        waterNeeds: record.waterNeeds,
        soilType: record.soilType,
        commonPests: record.commonPests,
        commonDiseases: record.commonDiseases,
        nutrientRequirements: record.nutrientRequirements,
        pricePerPound: record.pricePerPound,
        harvestFrequency: record.harvestFrequency,
        notes: record.notes,
        userId: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'cropResearch'), researchData);
      successCount++;
      console.log(`✅ Added: ${record.name} (${record.category})`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to add ${record.name}:`, error.message);
    }
  }

  console.log(`\n📊 Crop Research Import Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
}

async function main() {
  console.log('🚀 Starting data import...\n');
  console.log(`👤 User ID: ${userId}\n`);
  
  try {
    await loadCropData();
    await loadCropResearchData();
    
    console.log('\n✨ All data imported successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  }
}

main();
