'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { isItemOverdue } from '../utils/dateUtils';

export default function useInventoryItems() {
  const [checkedOutItems, setCheckedOutItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Current time for comparisons
  const currentTime = new Date();

  // Fetch data from Firestore
  useEffect(() => {
    setLoading(true);
    
    // Create a real-time listener for inventory items
    const q = query(collection(db, "inventory"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ 
          id: doc.id, 
          ...doc.data() 
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
    
    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

  return { checkedOutItems, overdueItems, loading };
}