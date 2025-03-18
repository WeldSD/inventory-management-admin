'use client';

export default function ReportPeriodSelector({ reportPeriod, setReportPeriod }) {
  return (
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
  );
}