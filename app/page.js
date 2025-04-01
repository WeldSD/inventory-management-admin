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

  // Helper to format dates
  const formatDateTime = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    } 
    else if (timestamp) {
      return new Date(timestamp).toLocaleString();
    }
    return 'No date available';
  };

  // Fetch data from Firestore
  useEffect(() => {
    setLoading(true);
    
    const q = query(collection(db, "CheckedOutItems"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        let data = doc.data();

        let checkOutTime;
        if (data.checkOutTime) {
          if (typeof data.checkOutTime.toDate === 'function') {
            checkOutTime = data.checkOutTime.toDate();
          } else {
            checkOutTime = new Date(data.checkOutTime);
          }
        } else {
          checkOutTime = null;
        }

        items.push({ 
          id: doc.id, 
          name: data.name || "Unknown", 
          usersName: data.usersName || "Unknown", 
          timestamp: checkOutTime || "No date available" 
        });
      });

      setCheckedOutItems(items);

      // Calculate overdue items
      const todayCutoff = new Date();
      todayCutoff.setHours(17, 0, 0, 0); // 5:00 PM cutoff
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const overdue = items.filter(item => {
        if (!item.timestamp || item.timestamp === "No date available") return false;
        const checkoutTime = new Date(item.timestamp);
        const isPreviousDayCheckout = checkoutTime < todayStart;
        const isPastCutoffToday = new Date() > todayCutoff && checkoutTime < todayCutoff;
        return isPreviousDayCheckout || isPastCutoffToday;
      });

      setOverdueItems(overdue);
      setLoading(false);
    }, (error) => {
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
      if (!item.timestamp) return false;
      let checkoutTime;
      if (typeof item.timestamp.toDate === 'function') {
        checkoutTime = item.timestamp.toDate();
      } else {
        checkoutTime = new Date(item.timestamp);
      }
      return checkoutTime >= startDate;
    });

    const overdueInPeriod = periodItems.filter(item => {
      if (!item.timestamp) return false;
      let checkoutTime;
      if (typeof item.timestamp.toDate === 'function') {
        checkoutTime = item.timestamp.toDate();
      } else {
        checkoutTime = new Date(item.timestamp);
      }
      const todayStart = new Date(currentTime);
      todayStart.setHours(0, 0, 0, 0);
      const isPreviousDayCheckout = checkoutTime < todayStart;
      const todayCutoff = new Date(todayStart);
      todayCutoff.setHours(17, 0, 0, 0);
      const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;
      return isPreviousDayCheckout || isPastCutoffToday;
    });

    return {
      items: periodItems,
      total: periodItems.length,
      overdue: overdueInPeriod.length
    };
  };

  // Helper function to check if an item is overdue
  const isItemOverdue = (item) => {
    if (!item.timestamp) return false;
    
    const todayCutoff = new Date();
    todayCutoff.setHours(17, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let checkoutTime;
    if (typeof item.timestamp.toDate === 'function') {
      checkoutTime = item.timestamp.toDate();
    } else {
      checkoutTime = new Date(item.timestamp);
    }

    const isPreviousDayCheckout = checkoutTime < todayStart;
    const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;
    return isPreviousDayCheckout || isPastCutoffToday;
  };

  // Send weekly overdue report
  const sendOverdueReport = async (email) => {
    if (!email) return;
    
    setSendingEmail(true);
    setEmailError(null);
    
    try {
      // Calculate the date 7 days ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Filter items that are overdue AND were checked out in the past week
      const weeklyOverdueItems = overdueItems.filter(item => {
        if (!item.timestamp) return false;
        let checkoutTime;
        if (typeof item.timestamp.toDate === 'function') {
          checkoutTime = item.timestamp.toDate();
        } else {
          checkoutTime = new Date(item.timestamp);
        }
        return checkoutTime >= oneWeekAgo;
      });

      const templateParams = {
        to_email: email,
        report_title: 'Weekly Overdue Items Report',
        date: new Date().toLocaleDateString(),
        count: weeklyOverdueItems.length,
        items: weeklyOverdueItems.map(item => ({
          name: item.name || "Unknown item",
          user: item.usersName || "Unknown user",
          time: formatDateTime(item.timestamp)
        }))
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
      await sendOverdueReport(email);
    } else {
      // Full report for other tabs
      setSendingEmail(true);
      setEmailError(null);
      
      try {
        const reportData = getReportData();
        const reportTitle = getReportTitle();
        
        const templateParams = {
          to_email: email,
          report_title: reportTitle,
          date: new Date().toLocaleDateString(),
          total_items: reportData.total || 0,
          overdue_items: reportData.overdue || 0,
          overdue_rate: `${reportData.total ? Math.round((reportData.overdue / reportData.total) * 100) : 0}%`,
          
          // PRE-GENERATE THE ITEMS TABLE HTML
          items_html: reportData.items.map(item => `
            <tr>
              <td>${item.name || "Unknown"}</td>
              <td>${item.user || "Unknown"}</td>
              <td>${formatDateTime(item.timestamp) || "N/A"}</td>
              <td style="${isItemOverdue(item) ? 'color: red; font-weight: bold;' : 'color: green;'}">
                ${isItemOverdue(item) ? "⚠️ Overdue" : "✓ Active"}
              </td>
            </tr>
          `).join('') // Combine all rows into a single string
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
    }
  };

  const getReportTitle = () => {
    switch(reportPeriod) {
      case 'daily': return 'Today\'s Report';
      case 'weekly': return 'Weekly Report (Last 7 Days)';
      case 'monthly': return 'Monthly Report (Last 30 Days)';
      default: return 'Inventory Report';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {!loading && (
          <>
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
                          {(activeTab === 'checked-out' ? checkedOutItems : overdueItems).map((item) => {
                            const todayCutoff = new Date();
                            todayCutoff.setHours(17, 0, 0, 0);
                            const todayStart = new Date();
                            todayStart.setHours(0, 0, 0, 0);

                            let checkoutTime;
                            if (item.timestamp && typeof item.timestamp.toDate === 'function') {
                              checkoutTime = item.timestamp.toDate();
                            } else if (item.timestamp) {
                              checkoutTime = new Date(item.timestamp);
                            }

                            const isPreviousDayCheckout = checkoutTime < todayStart;
                            const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;
                            const isOverdue = isPreviousDayCheckout || isPastCutoffToday;
                            
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
                              let checkoutTime;
                              if (item.timestamp && typeof item.timestamp.toDate === 'function') {
                                checkoutTime = item.timestamp.toDate();
                              } else if (item.timestamp) {
                                checkoutTime = new Date(item.timestamp);
                              }

                              const todayStart = new Date(currentTime);
                              todayStart.setHours(0, 0, 0, 0);
                              const isPreviousDayCheckout = checkoutTime < todayStart;
                              
                              const todayCutoff = new Date(todayStart);
                              todayCutoff.setHours(17, 0, 0, 0);
                              const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;

                              const isOverdue = isPreviousDayCheckout || isPastCutoffToday;
                              
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