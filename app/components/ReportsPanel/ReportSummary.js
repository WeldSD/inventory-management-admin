'use client';

export default function ReportSummary({ reportData }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Items</h3>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reportData.total}</p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Overdue Items</h3>
        <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{reportData.overdue}</p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Overdue Rate</h3>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
          {reportData.total ? Math.round((reportData.overdue / reportData.total) * 100) : 0}%
        </p>
      </div>
    </div>
  );
}