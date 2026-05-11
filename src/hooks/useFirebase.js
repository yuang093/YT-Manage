// Firebase CRUD 操作 hook
import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export const useFirebase = (db, collectionName = 'items') => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const itemsRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      itemsRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(data);
        setIsLoading(false);
        setPermissionError(false);
      },
      (error) => {
        console.error('Firebase read error:', error);
        setIsLoading(false);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        }
      }
    );

    return () => unsubscribe();
  }, [db, collectionName]);

  const handleCreate = async (newItem) => {
    if (!db) return false;
    try {
      const id = newItem.id || crypto.randomUUID();
      const itemRef = doc(db, collectionName, id);
      await setDoc(itemRef, { ...newItem, id, createdAt: Date.now() });
      return true;
    } catch (e) {
      console.error('Create error:', e);
      return false;
    }
  };

  const handleUpdate = async (item) => {
    if (!db) return false;
    try {
      const itemRef = doc(db, collectionName, item.id);
      await updateDoc(itemRef, item);
      return true;
    } catch (e) {
      console.error('Update error:', e);
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!db) return false;
    try {
      const itemRef = doc(db, collectionName, id);
      await deleteDoc(itemRef);
      return true;
    } catch (e) {
      console.error('Delete error:', e);
      return false;
    }
  };

  return { items, isLoading, permissionError, handleCreate, handleUpdate, handleDelete };
};
