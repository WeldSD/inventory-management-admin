'use client';

export default function TabNavigation({ activeTab, setActiveTab, checkedOutCount, overdueCount }) {
  return (
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
          Checked Out Items ({checkedOutCount})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`${
            activeTab === 'overdue'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Overdue Items ({overdueCount})
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
  );
}