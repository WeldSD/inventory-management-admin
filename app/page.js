'use client';
import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export default function Home() {
  const [activeTab, setActiveTab] = useState('checked-out');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedOutItems, setCheckedOutItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [reportPeriod, setReportPeriod] = useState('daily');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const emailRef = useRef(null);

  // Initialize EmailJS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    }
  }, []);

  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Helper to convert Firestore timestamp to Date
  const toDate = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  // Helper to format dates
  const formatDateTime = (timestamp) => {
    const date = toDate(timestamp);
    return date ? date.toLocaleString() : 'No date available';
  };

  // Check if item is overdue
  const isItemOverdue = (item) => {
    const checkoutTime = toDate(item.timestamp);
    if (!checkoutTime) return false;  // If no valid time, it's not overdue
  
    const todayCutoff = new Date();
    todayCutoff.setHours(17, 0, 0, 0); // 5:00 PM cutoff
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
  
    const isPreviousDayCheckout = checkoutTime < todayStart;
    const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;
    
    return isPreviousDayCheckout || isPastCutoffToday;
  };
  

  // Fetch data from Firestore
  useEffect(() => {
    setLoading(true);
    
    const q = query(collection(db, "CheckedOutItems"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          name: data.name || "Unknown", 
          usersName: data.usersName || "Unknown", 
          timestamp: data.checkOutTime || null,
          itemID: data.itemID || null
        };
      });

      setCheckedOutItems(items);
      setOverdueItems(items.filter(isItemOverdue));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get data for reports based on selected period
  const getReportData = () => {
    if (!checkedOutItems.length) return { items: [], total: 0, overdue: 0 };

    const now = new Date();
    let startDate;

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

    const periodItems = checkedOutItems.filter(item => {
      const checkoutTime = toDate(item.timestamp);
      return checkoutTime && checkoutTime >= startDate;
    });

    return {
      items: periodItems,
      total: periodItems.length,
      overdue: periodItems.filter(isItemOverdue).length
    };
  };

  const getReportTitle = () => {
    switch(reportPeriod) {
      case 'daily': return 'Today\'s Report';
      case 'weekly': return 'Weekly Report (Last 7 Days)';
      case 'monthly': return 'Monthly Report (Last 30 Days)';
      default: return 'Inventory Report';
    }
  };

  const sendWeeklyOverdueReport = async (email) => {
    if (!email) return;
    
    setSendingEmail(true);
    setEmailError(null);
    
    try {
      // Calculate the date 7 days ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Filter items that are overdue AND were checked out in the past week
      const weeklyOverdueItems = checkedOutItems.filter(item => {
        const checkoutTime = toDate(item.timestamp);
        if (!checkoutTime) return false;
        
        const isOverdue = isItemOverdue(item);
        const isWithinLastWeek = checkoutTime >= oneWeekAgo;
        
        return isOverdue && isWithinLastWeek;
      });

      const templateParams = {
        to_email: email,
        report_title: 'Weekly Overdue Items Report',
        date: new Date().toLocaleDateString(),
        total_items: weeklyOverdueItems.length,
        overdue_items: weeklyOverdueItems.length, // All items in this report are overdue
        overdue_rate: '100%', // Since this is an overdue-only report
        items_html: weeklyOverdueItems.map(item => `
          <tr>
            <td>${item.name || "Unknown"}</td>
            <td>${item.usersName || "Unknown"}</td>
            <td>${formatDateTime(item.timestamp)}</td>
            <td style="color: red; font-weight: bold;">
              ⚠️ Overdue
            </td>
          </tr>
        `).join('')
      };
      
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      setEmailSent(true);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };
  const sendEmailReport = async (email, items, title, isOverdueReport = false) => {
    setSendingEmail(true);
    setEmailError(null);
  
    try {
      const templateParams = {
        to_email: email,
        report_title: title,
        date: new Date().toLocaleDateString(),
        total_items: items.length,
        overdue_items: isOverdueReport ? items.length : items.filter(isItemOverdue).length,
        overdue_rate: isOverdueReport 
          ? '100%' 
          : `${items.length ? Math.round((items.filter(isItemOverdue).length / items.length) * 100) : 0}%`,
          items_html: items.map(item => `
            <tr>
              <td>${item.name || "Unknown"}</td>
              <td>${item.usersName || "Unknown"}</td>
              <td>${formatDateTime(item.timestamp)}</td>
              <td>
                <a href="${item.itemID ? item.itemID : '#'}" 
 
                   target="_blank" 
                   style="color: blue; text-decoration: underline;">
                  View Item
                </a>
              </td>
              <td style="${isOverdueReport || isItemOverdue(item) ? 'color: red; font-weight: bold;' : 'color: green;'}">
                ${isOverdueReport || isItemOverdue(item) ? "⚠️ Overdue" : "✓ Active"}
              </td>
            </tr>
          `).join('')
          
      };
  
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams
      );
  
      setEmailSent(true);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };
  
  const handleSendEmail = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value;
    if (!email) return;
  
    if (activeTab === 'overdue') {
      // Strictly filter only overdue items that were checked out in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
      const weeklyOverdueItems = checkedOutItems.filter(item => {
        const checkoutTime = toDate(item.timestamp);
        return checkoutTime && checkoutTime >= oneWeekAgo && isItemOverdue(item); // ✅ Properly filter overdue items
      });
  
      await sendEmailReport(
        email, 
        weeklyOverdueItems, 
        'Weekly Overdue Items Report', true
      );
    } else if (activeTab === 'reports') {
      // Filter out only overdue items for reports
      const overdueItemsOnly = getReportData().items.filter(isItemOverdue);
  
      await sendEmailReport(
        email, 
        overdueItemsOnly,  
        getReportTitle()
      );
    } else {
      // Filter only overdue items for checked-out tab
      const overdueCheckedOutItems = checkedOutItems.filter(isItemOverdue);
  
      await sendEmailReport(
        email, 
        overdueCheckedOutItems, 
        'All Overdue Items'
      );
    }
  };
    
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Image
            src="calgary-zoo-vector-logo.svg" 
            alt="Calgary Zoo"
            width={100} 
            height={100}
            className="mr-2"
          />
          <div className="flex items-center">
            <div className="mr-6 text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentDateTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {currentDateTime.toLocaleTimeString('en-US')}
              </p>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Admin Panel</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {!loading && (
          <>
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('checked-out')}
                  className={`${
                    activeTab === 'checked-out'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Checked Out Items ({checkedOutItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('overdue')}
                  className={`${
                    activeTab === 'overdue'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Overdue Items ({overdueItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`${
                    activeTab === 'reports'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Reports
                </button>
              </nav>
            </div>

            {((activeTab === 'checked-out' && checkedOutItems.length > 0) || 
              (activeTab === 'overdue' && overdueItems.length > 0)) && (
              <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Table Headers */}
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Item Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Checked Out By
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Checked Out Time
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        {/* Table Body */}
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {(activeTab === 'checked-out' ? checkedOutItems : overdueItems).map((item) => {
                            const isOverdue = isItemOverdue(item);
                            
                            return (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {item.usersName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {formatDateTime(item.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {isOverdue ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      Overdue
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      Active
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="flex flex-col">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Period:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setReportPeriod('daily')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        reportPeriod === 'daily' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setReportPeriod('weekly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        reportPeriod === 'weekly' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setReportPeriod('monthly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        reportPeriod === 'monthly' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{getReportTitle()}</h2>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Items</h3>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{getReportData().total}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Overdue Items</h3>
                      <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{getReportData().overdue}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Overdue Rate</h3>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {getReportData().total ? Math.round((getReportData().overdue / getReportData().total) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Email Form */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Send Report via Email</h3>
                    <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row gap-3">
                      <input
                        ref={emailRef}
                        type="email"
                        placeholder="Enter email address"
                        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 flex-grow"
                        required
                      />
                      <button
                        type="submit"
                        disabled={sendingEmail || emailSent}
                        className={`px-4 py-2 rounded-md text-white font-medium 
                          ${emailSent 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : sendingEmail 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-emerald-500 hover:bg-emerald-600'}`}
                      >
                        {emailSent ? 'Email Sent!' : sendingEmail ? 'Sending...' : 'Send Report'}
                      </button>
                    </form>
                    {emailError && (
                      <div className="text-red-500 text-sm mt-2">{emailError}</div>
                    )}
                  </div>
                </div>

                {/* Detailed Report Table */}
                {getReportData().items.length > 0 && (
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Item Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Checked Out By
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Checked Out Time
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {getReportData().items.map((item) => {
                              const isOverdue = isItemOverdue(item);
                              
                              return (
                                <tr key={item.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {item.usersName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {formatDateTime(item.timestamp)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {isOverdue ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        Overdue
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {(activeTab === 'checked-out' && checkedOutItems.length === 0) || 
             (activeTab === 'overdue' && overdueItems.length === 0) ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No items found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'checked-out' ? 'No items are currently checked out.' : 'No items are currently overdue.'}
                </p>
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2025 Calgary Zoo
          </p>
        </div>
      </footer>
    </div>
  );
}