"use client"; // Needed for useState & useEffect in Next.js App Router

import { useEffect, useState } from "react";

export default function ReportPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/reports") // Fetch data from your Vercel API
      .then((res) => res.json())
      .then((data) => setData(data.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Inventory Report</h1>
      <table className="w-full mt-4 border">
        <thead>
          <tr>
            <th className="border p-2">Item Name</th>
            <th className="border p-2">Checked Out</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.checkedOut ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}