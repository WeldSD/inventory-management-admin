"use client";  // Required for React hooks in App Router

import { useState, useEffect } from "react";

export default function Report() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch("/api/generateReport"); // Fetch the API route
        const data = await response.json();
        console.log("Fetched Report:", data);
        setReport(data);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  return (
    <div>
      <h2>Today&apo;s Report</h2>
      {loading ? (
        <p>Loading report...</p>
      ) : report ? (
        <div>
          <p><strong>Total Items:</strong> {report.totalItems}</p>
          <p><strong>Overdue Items:</strong> {report.overdueItems}</p>
          <p><strong>Checked Out Rate:</strong> {report.checkedOutRate}</p>
        </div>
      ) : (
        <p>No report available.</p>
      )}
    </div>
  );
}
