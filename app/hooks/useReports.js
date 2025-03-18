'use client';
import { useState } from 'react';
import { isItemOverdue } from '../utils/dateUtils';

export default function useReports(checkedOutItems) {
  const [reportPeriod, setReportPeriod] = useState('daily');
  const currentTime = new Date();
  
  // Get data for reports based on selected period
  const getReportData = () => {
    if (!checkedOutItems.length) return { items: [], total: 0, overdue: 0 };

    const now = new Date();
    let startDate;

    // Determine start date based on report period
    switch(reportPeriod) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    // Filter items for the selected period
    const periodItems = checkedOutItems.filter(item => {
      if (!item.timestamp) return false;
      
      let checkoutTime;
      if (typeof item.timestamp.toDate === 'function') {
        checkoutTime = item.timestamp.toDate();
      } else {
        checkoutTime = new Date(item.timestamp);
      }
      
      return checkoutTime >= startDate;
    });

    // Count overdue items in the selected period
    const overdueInPeriod = periodItems.filter(item => isItemOverdue(item.timestamp, currentTime));

    return {
      items: periodItems,
      total: periodItems.length,
      overdue: overdueInPeriod.length
    };
  };

  // Format report title
  const getReportTitle = () => {
    switch(reportPeriod) {
      case 'daily': return 'Today\'s Report';
      case 'weekly': return 'Weekly Report (Last 7 Days)';
      case 'monthly': return 'Monthly Report (Last 30 Days)';
      default: return 'Inventory Report';
    }
  };

  return {
    reportPeriod,
    setReportPeriod,
    getReportData,
    getReportTitle
  };
}