'use client';
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

export default function ReportsPage() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState('daily');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "demoreport"));
        const querySnapshot = await getDocs(q);
        
        const itemsSummary = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const itemName = data.name || data.itemName || 'Unnamed Item';
          const isOverdue = data.dueDate?.toDate?.() < new Date();
          
          if (!itemsSummary[itemName]) {
            itemsSummary[itemName] = {
              name: itemName,
              totalCheckouts: 1,  // Comma added here
              overdueCount: isOverdue ? 1 : 0  // This was likely where the comma was missing
            };
          } else {
            itemsSummary[itemName].totalCheckouts += 1;
            if (isOverdue) itemsSummary[itemName].overdueCount += 1;
          }
        });

        setReportData(Object.values(itemsSummary));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportPeriod]);

  const avgCheckouts = reportData.length > 0 
    ? Math.round(reportData.reduce((sum, item) => sum + item.totalCheckouts, 0) / reportData.length): 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Inventory Summary Report</h1>
        
        {/* Report Period Selector */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Report Period:</h2>
          <div className="flex gap-2">
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

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-sm text-gray-600">Total Items</h3>
            <p className="text-xl font-bold">
              {loading ? '...' : reportData.length}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-sm text-gray-600">Overdue Items</h3>
            <p className="text-xl font-bold">
              {loading ? '...' : reportData.reduce((sum, item) => sum + item.overdueCount, 0)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-sm text-gray-600">Checkout Rate</h3>
            <p className="text-xl font-bold">
              {loading ? '...' : reportData.length > 0 ? `${avgCheckouts} avg` : '0%'}
            </p>
          </div>
        </div>

        {/* Items Table */}
        {loading ? (
          <p className="text-center py-4">Loading data...</p>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">ITEM NAME</th>
                  <th className="text-left p-3">TOTAL CHECKOUTS</th>
                  <th className="text-left p-3">OVERDUE COUNT</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.totalCheckouts}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.overdueCount > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.overdueCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">No items found for selected period</p>
        )}
      </div>
    </div>
  );
}