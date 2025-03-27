'use client';
import { useState, useEffect, useRef } from 'react';
import useInventoryItems from '../../hooks/useInventoryItems';  // ✅ Import Hook

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('reports'); // Default to reports tab
  const [reportPeriod, setReportPeriod] = useState('daily');
  const emailRef = useRef(null);
  const { checkedOutItems, overdueItems, loading } = useInventoryItems();  // ✅ Fetch data from Firestore

  // Filter based on report period
  const now = new Date();
  let startDate = new Date(now);
  
  switch (reportPeriod) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  const periodItems = checkedOutItems.filter(item => {
    const checkoutTime = item.timestamp?.toDate?.() || new Date(item.timestamp);
    return checkoutTime >= startDate;
  });

  const overdueCount = overdueItems.length;
  const totalCheckedOut = periodItems.length;
  const overduePercentage = totalCheckedOut > 0 ? Math.round((overdueCount / totalCheckedOut) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Zoo Inventory Manager</h1>

        {/* Navigation Menu */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Configurations</h2>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('checkedOut')}
              className={`px-4 py-2 rounded ${activeTab === 'checkedOut' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Checked Out Items
            </button>
            <button 
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 rounded ${activeTab === 'overdue' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Overdue Items
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded ${activeTab === 'reports' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Reports Section */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow">
            {/* Report Period Selection */}
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Report Period:</h2>
              <div className="flex space-x-2">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportPeriod(period)}
                    className={`px-3 py-1 rounded ${
                      reportPeriod === period 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Today's Report</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-600">Total Checked Out</h3>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : totalCheckedOut}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Overdue Items</h3>
                  <p className="text-2xl font-bold text-red-500">
                    {loading ? '...' : overdueCount}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Overdue Percentage</h3>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : `${overduePercentage}%`}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Table */}
            {!loading && periodItems.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Item Name</th>
                      <th className="text-left p-3">Checked Out By</th>
                      <th className="text-left p-3">Due Date</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{item.name || 'N/A'}</td>
                        <td className="p-3">{item.checkedOutBy || 'Unknown'}</td>
                        <td className="p-3">
                          {item.dueDate?.toDate?.().toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            new Date(item.dueDate) > new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {new Date(item.dueDate) > new Date() ? 'Active' : 'Overdue'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {!loading && periodItems.length === 0 && (
              <div className="mb-6 text-center py-8 bg-gray-50 rounded">
                <p className="text-gray-500">No report data available for selected period</p>
              </div>
            )}

            {/* Email Form */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Send Report via Email</h2>
              <form className="flex items-center gap-2">
                <input
                  type="email"
                  ref={emailRef}
                  placeholder="Enter email address"
                  className="flex-1 p-2 border rounded"
                  required
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send Report
                </button>
              </form>
            </div>
          </div>
        )}

        <footer className="mt-8 text-center text-gray-500">
          © 2025 Calgary Zoo
        </footer>
      </div>
    </div>
  );
}
