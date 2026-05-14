import React, { useState, useEffect } from "react";
import axios from "axios";

const LogPage = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟢 API function (inline)
  const fetchMusterRoll = async (month, year, user_id) => {
    try {
      const response = await axios.get(
        `/admin/staff/workhours/${month}/${year}`
      );
      console.log("📦 Muster Roll Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching Employee Calendar:", error.message);
      throw error;
    }
  };

  // 🗓 Set default month/year when component mounts
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString("default", { month: "long" });
    const currentYear = currentDate.getFullYear();
    setMonth(currentMonth);
    setYear(currentYear);
  }, []);

  // 🚀 Fetch data whenever month/year changes
  useEffect(() => {
    const getData = async () => {
      if (!month || !year) return;
      try {
        setLoading(true);
        const monthNumber = new Date(Date.parse(`${month} 1`)).getMonth() + 1;
        const response = await fetchMusterRoll(monthNumber, year);
        console.log("✅ API Data:", response);
        setData(response);
      } catch (error) {
        console.error("❌ Error fetching Muster Roll:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [month, year]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      {/* Header */}
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Log Page (Muster Roll API Integration)
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Month Selector */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Month</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Year</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {[2023, 2024, 2025].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="text-gray-600 text-sm">Fetching Muster Roll data...</div>
      )}

      {/* Data Table */}
      {!loading && data?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Muster Roll Data for {month} {year}
            </h2>
            <span className="text-sm text-gray-500">
              Showing {data.length} records
            </span>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-r">
                    Employee Name
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">
                    Raw Data (preview)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((emp, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-2 text-sm font-medium text-gray-800 border-r">
                      {emp.user_name || "Unknown"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 font-mono whitespace-pre-wrap">
                      {JSON.stringify(emp, null, 2).slice(0, 150)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data */}
      {!loading && data?.length === 0 && (
        <div className="text-gray-500 text-sm mt-4">
          No data found for {month} {year}.
        </div>
      )}
    </div>
  );
};

export default LogPage;
