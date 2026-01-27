import { collection, addDoc, Timestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
export async function loadTestCropResearchData(userId) {
    // Fetch and parse the CSV file
    const response = await fetch('/sample-crop-research.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    let count = 0;
    // Skip header row, process data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Parse CSV line (handle quoted fields)
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                values.push(currentValue);
                currentValue = '';
            }
            else {
                currentValue += char;
            }
        }
        values.push(currentValue); // Add last value
        if (values.length < headers.length)
            continue;
        try {
            const cropData = {
                name: values[0],
                category: values[1],
                startupCostPerAcre: values[2],
                annualRevenuePerAcre: values[3],
                profitMargin: values[4],
                growingTime: values[5],
                laborIntensity: values[6],
                bayAreaSuitability: parseInt(values[7]),
                marketDemand: values[8],
                waterNeeds: values[9],
                soilType: values[10],
                commonPests: values[11],
                commonDiseases: values[12],
                nutrientRequirements: values[13],
                pricePerPound: values[14],
                harvestFrequency: values[15],
                notes: values[16] || '',
                userId,
                updatedAt: Timestamp.now()
            };
            // Check if crop with this name already exists
            const q = query(collection(db, 'cropResearch'), where('name', '==', values[0]), where('userId', '==', userId));
            const existingDocs = await getDocs(q);
            if (existingDocs.empty) {
                // Create new document
                await addDoc(collection(db, 'cropResearch'), {
                    ...cropData,
                    createdAt: Timestamp.now()
                });
            }
            else {
                // Update existing document
                const existingDoc = existingDocs.docs[0];
                await updateDoc(doc(db, 'cropResearch', existingDoc.id), cropData);
            }
            count++;
        }
        catch (error) {
            console.error('Error adding/updating crop research:', error);
        }
    }
    return count;
}
export async function loadTestCropsData(userId) {
    // Fetch and parse the CSV file
    const response = await fetch('/sample-crops.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n');
    // Skip headers - first line
    let count = 0;
    // Skip header row, process data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Parse CSV line (handle quoted fields)
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                values.push(currentValue);
                currentValue = '';
            }
            else {
                currentValue += char;
            }
        }
        values.push(currentValue); // Add last value
        if (values.length < 10)
            continue;
        try {
            const cropData = {
                name: values[0],
                variety: values[1],
                fieldName: values[2],
                sectionName: values[3],
                plantedDate: Timestamp.fromDate(new Date(values[4])),
                harvestReadyDate: Timestamp.fromDate(new Date(values[5])),
                status: values[6],
                area: values[7] ? parseFloat(values[7]) : undefined,
                expectedYield: values[8] ? parseFloat(values[8]) : undefined,
                notes: values[9] || undefined,
                fieldId: 'field-' + values[2].toLowerCase().replace(/\s+/g, '-'),
                sectionId: 'section-' + values[3].toLowerCase().replace(/\s+/g, '-'),
                userId,
                updatedAt: Timestamp.now()
            };
            // Check if crop with this name and field already exists
            const q = query(collection(db, 'crops'), where('name', '==', values[0]), where('fieldName', '==', values[2]), where('userId', '==', userId));
            const existingDocs = await getDocs(q);
            if (existingDocs.empty) {
                // Create new document
                await addDoc(collection(db, 'crops'), {
                    ...cropData,
                    createdAt: Timestamp.now()
                });
            }
            else {
                // Update existing document
                const existingDoc = existingDocs.docs[0];
                await updateDoc(doc(db, 'crops', existingDoc.id), cropData);
            }
            count++;
        }
        catch (error) {
            console.error('Error adding/updating crop:', error);
        }
    }
    return count;
}
