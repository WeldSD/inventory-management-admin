// Helper to format dates
export function formatDateTime(timestamp) {
    // Check if timestamp is a Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    } 
    // Handle string timestamps
    else if (timestamp) {
      return new Date(timestamp).toLocaleString();
    }
    return 'No date available';
  }
  
  // Helper function to get the 5:00 PM MST cutoff time for a given date
  export function getCutoffTime(date) {
    const cutoff = new Date(date);
    // Set to 5:00 PM MST (17:00)
    cutoff.setHours(17, 0, 0, 0);
    return cutoff;
  }
  
  // Check if an item is overdue
  export function isItemOverdue(timestamp, currentTime) {
    if (!timestamp) return false;
    
    let checkoutTime;
    if (typeof timestamp.toDate === 'function') {
      checkoutTime = timestamp.toDate();
    } else {
      checkoutTime = new Date(timestamp);
    }
    
    // Get the start of today for checking previous days
    const todayStart = new Date(currentTime);
    todayStart.setHours(0, 0, 0, 0);
    
    // Check if the item was checked out on a previous day
    const isPreviousDayCheckout = checkoutTime < todayStart;
    
    // Check if current time is past today's cutoff and item was checked out before cutoff
    const todayCutoff = getCutoffTime(currentTime);
    const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;
    
    return isPreviousDayCheckout || isPastCutoffToday;
  }