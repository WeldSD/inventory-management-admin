'use client';
import ReportPeriodSelector from './ReportPeriodSelector';
import ReportSummary from './ReportSummary';
import EmailReportForm from './EmailReportForm';
import ItemsTable from '../ItemsTable';
import useReports from '../../hooks/useReports';

export default function ReportsPanel({ checkedOutItems }) {
  const { reportPeriod, setReportPeriod, getReportData, getReportTitle } = useReports(checkedOutItems);
  const reportData = getReportData();

  return (
    <div className="flex flex-col">
      {/* Report Period Selection */}
      <ReportPeriodSelector 
        reportPeriod={reportPeriod} 
        setReportPeriod={setReportPeriod} 
      />

      {/* Report Data */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{getReportTitle()}</h2>
        
        <ReportSummary reportData={reportData} />

        {/* Email Report Form */}
        <EmailReportForm reportPeriod={reportPeriod} reportData={reportData} />
      </div>

      {/* Detailed Items Table */}
      {reportData.items.length > 0 && (
        <ItemsTable items={reportData.items} />
      )}
    </div>
  );
}