import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
export async function getUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}
