'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { isItemOverdue } from '../utils/dateUtils';

export default function useInventoryItems() {
  const [checkedOutItems, setCheckedOutItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const currentTime = new Date(); // ✅ Ensure current time is fetched inside useEffect

    const q = query(collection(db, "demoreport"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ 
          id: doc.id, 
          ...doc.data()  // ✅ Ensure checkedOutBy is included
        });
      });

      setCheckedOutItems(items);

      // Filter for overdue items
      const overdue = items.filter(item => isItemOverdue(item.timestamp, currentTime));
      setOverdueItems(overdue);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory items:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Return values so other components can use them
  return { checkedOutItems, overdueItems, loading };
}
