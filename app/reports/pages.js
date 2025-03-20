"use client";

import { useEffect, useState } from "react";

export default function ReportPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setData(data.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Checked Out Items</h1>
      <table className="w-full mt-4 border">
        <thead>
          <tr>
            <th className="border p-2">Item Name</th>
            <th className="border p-2">Checked Out</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((item) => item.checkedOut) // Only show checked-out items
            .map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">✅</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
