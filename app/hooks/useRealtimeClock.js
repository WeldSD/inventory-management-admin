'use client';
import { useState, useEffect } from 'react';

export default function useRealtimeClock() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return currentDateTime;
}