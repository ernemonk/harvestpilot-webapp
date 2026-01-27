/**
 * Migration Script: Convert Single-User Data to Multi-Tenant Organization Model
 *
 * This script helps migrate existing data from the old single-user model
 * to the new multi-tenant organization model.
 *
 * WARNING: This is a one-time migration. Test on a backup database first!
 *
 * Run this from Firebase Console or a Node.js script with Firebase Admin SDK
 */
import { collection, getDocs, doc, updateDoc, Timestamp, query, where, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
export async function migrateToMultiTenant() {
    const stats = {
        usersProcessed: 0,
        organizationsCreated: 0,
        cropsUpdated: 0,
        harvestsUpdated: 0,
        customersUpdated: 0,
        fieldsUpdated: 0,
        cropResearchUpdated: 0,
        errors: []
    };
    console.log('🚀 Starting migration to multi-tenant model...');
    try {
        // Step 1: Get all users who don't have an organization yet
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            // Skip if user already has an organization
            if (userData.defaultOrganizationId) {
                console.log(`⏭️  Skipping user ${userData.email} - already has organization`);
                continue;
            }
            try {
                console.log(`👤 Processing user: ${userData.email}`);
                // Step 2: Create organization for this user
                const orgName = `${userData.displayName || userData.email}'s Farm`;
                const orgData = {
                    name: orgName,
                    type: 'farm',
                    ownerId: userId,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    settings: {
                        timezone: 'America/Los_Angeles',
                        defaultUnits: 'imperial',
                        fiscalYearStart: '01-01'
                    },
                    subscription: {
                        plan: 'free',
                        status: 'active'
                    }
                };
                const orgRef = await addDoc(collection(db, 'organizations'), orgData);
                const orgId = orgRef.id;
                console.log(`  ✅ Created organization: ${orgName} (${orgId})`);
                stats.organizationsCreated++;
                // Step 3: Create organization membership
                const memberData = {
                    organizationId: orgId,
                    userId,
                    userEmail: userData.email,
                    userName: userData.displayName || userData.email,
                    role: 'owner',
                    invitedBy: userId,
                    joinedAt: Timestamp.now(),
                    status: 'active'
                };
                await setDoc(doc(db, 'organization_members', `${userId}_${orgId}`), memberData);
                console.log(`  ✅ Created owner membership`);
                // Step 4: Update user with default organization
                await updateDoc(doc(db, 'users', userId), {
                    defaultOrganizationId: orgId,
                    updatedAt: Timestamp.now()
                });
                // Step 5: Update all user's data with organizationId
                await migrateUserData(userId, orgId, stats);
                stats.usersProcessed++;
                console.log(`✅ Completed migration for ${userData.email}\n`);
            }
            catch (error) {
                const errorMsg = `Error migrating user ${userData.email}: ${error}`;
                console.error(`❌ ${errorMsg}`);
                stats.errors.push(errorMsg);
            }
        }
        console.log('\n🎉 Migration complete!');
        console.log('📊 Statistics:');
        console.log(`  Users processed: ${stats.usersProcessed}`);
        console.log(`  Organizations created: ${stats.organizationsCreated}`);
        console.log(`  Crops updated: ${stats.cropsUpdated}`);
        console.log(`  Harvests updated: ${stats.harvestsUpdated}`);
        console.log(`  Customers updated: ${stats.customersUpdated}`);
        console.log(`  Fields updated: ${stats.fieldsUpdated}`);
        console.log(`  Crop research updated: ${stats.cropResearchUpdated}`);
        if (stats.errors.length > 0) {
            console.log(`\n⚠️  Errors (${stats.errors.length}):`);
            stats.errors.forEach(err => console.log(`  - ${err}`));
        }
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
    return stats;
}
async function migrateUserData(userId, orgId, stats) {
    // Migrate Crops
    const cropsSnap = await getDocs(query(collection(db, 'crops'), where('userId', '==', userId)));
    for (const cropDoc of cropsSnap.docs) {
        await updateDoc(doc(db, 'crops', cropDoc.id), {
            organizationId: orgId,
            createdBy: userId,
            updatedAt: Timestamp.now()
        });
        stats.cropsUpdated++;
    }
    console.log(`  📝 Updated ${cropsSnap.size} crops`);
    // Migrate Harvests
    const harvestsSnap = await getDocs(query(collection(db, 'harvests'), where('userId', '==', userId)));
    for (const harvestDoc of harvestsSnap.docs) {
        await updateDoc(doc(db, 'harvests', harvestDoc.id), {
            organizationId: orgId,
            createdBy: userId,
            updatedAt: Timestamp.now()
        });
        stats.harvestsUpdated++;
    }
    console.log(`  📦 Updated ${harvestsSnap.size} harvests`);
    // Migrate Customers
    const customersSnap = await getDocs(query(collection(db, 'customers'), where('userId', '==', userId)));
    for (const customerDoc of customersSnap.docs) {
        await updateDoc(doc(db, 'customers', customerDoc.id), {
            organizationId: orgId,
            createdBy: userId,
            updatedAt: Timestamp.now()
        });
        stats.customersUpdated++;
    }
    console.log(`  👥 Updated ${customersSnap.size} customers`);
    // Migrate Fields
    const fieldsSnap = await getDocs(query(collection(db, 'fields'), where('userId', '==', userId)));
    for (const fieldDoc of fieldsSnap.docs) {
        await updateDoc(doc(db, 'fields', fieldDoc.id), {
            organizationId: orgId,
            createdBy: userId,
            updatedAt: Timestamp.now()
        });
        stats.fieldsUpdated++;
    }
    console.log(`  🌾 Updated ${fieldsSnap.size} fields`);
    // Migrate Crop Research
    const researchSnap = await getDocs(query(collection(db, 'crop_research'), where('userId', '==', userId)));
    for (const researchDoc of researchSnap.docs) {
        await updateDoc(doc(db, 'crop_research', researchDoc.id), {
            organizationId: orgId,
            createdBy: userId,
            updatedAt: Timestamp.now()
        });
        stats.cropResearchUpdated++;
    }
    console.log(`  🔬 Updated ${researchSnap.size} crop research entries`);
}
/**
 * How to run this migration:
 *
 * Option 1: From Browser Console (Temporary - for testing)
 * 1. Open your app in the browser
 * 2. Open DevTools Console
 * 3. Import and run:
 *    import { migrateToMultiTenant } from './utils/migrate';
 *    migrateToMultiTenant();
 *
 * Option 2: Create a dedicated migration page (Recommended)
 * 1. Create src/pages/Migration.tsx
 * 2. Add a protected route /migration
 * 3. Add a button to trigger migration
 * 4. Only allow admin/owner access
 *
 * Option 3: Firebase Functions (Production)
 * 1. Create a Cloud Function
 * 2. Use Firebase Admin SDK
 * 3. Trigger via HTTP or scheduled
 */
// Export for use in migration page
export default migrateToMultiTenant;
