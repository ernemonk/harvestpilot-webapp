import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
export function useFirestore(fetchFunction) {
    const { currentUser } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchData = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFunction(currentUser.uid);
            setData(result);
        }
        catch (err) {
            setError(err.message || 'An error occurred');
            console.error('Firestore error:', err);
        }
        finally {
            setLoading(false);
        }
    }, [currentUser, fetchFunction]);
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    return { data, loading, error, refetch: fetchData };
}
export function useFirestoreList(fetchFunction) {
    const { currentUser } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasFetchedRef = useRef(false);
    const isMountedRef = useRef(true);
    const fetchData = useCallback(async () => {
        if (!currentUser || !fetchFunction) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const result = fetchFunction.length === 0
                ? await fetchFunction()
                : await fetchFunction(currentUser.uid);
            if (isMountedRef.current) {
                setData(result);
            }
        }
        catch (err) {
            if (isMountedRef.current) {
                setError(err.message || 'An error occurred');
                console.error('Firestore error:', err);
            }
        }
        finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [currentUser, fetchFunction]);
    // Initial fetch when component mounts and has valid fetchFunction
    useEffect(() => {
        isMountedRef.current = true;
        if (currentUser && fetchFunction && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchData();
        }
        else if (!fetchFunction) {
            setLoading(false);
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [currentUser, fetchFunction, fetchData]);
    // Reset hasFetchedRef when fetchFunction becomes null (e.g., org changes)
    useEffect(() => {
        if (!fetchFunction) {
            hasFetchedRef.current = false;
        }
    }, [fetchFunction]);
    const refetch = useCallback(async () => {
        await fetchData();
    }, [fetchData]);
    return { data, loading, error, refetch };
}
export function useFirestoreDoc(collectionName, documentId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchData = async () => {
        if (!documentId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const docRef = doc(db, collectionName, documentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setData({ id: docSnap.id, ...docSnap.data() });
            }
            else {
                setError('Document not found');
                setData(null);
            }
        }
        catch (err) {
            setError(err.message || 'An error occurred');
            console.error('Firestore error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [documentId, collectionName]);
    return { data, loading, error, refetch: fetchData };
}
