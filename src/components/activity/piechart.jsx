// PieChartComponent.jsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import moment from 'moment';
import { fetchPieChart } from '../../service/companyService';

const COLOR_MAP = {
  'Absents': '#EF4444',
  'Present': '#10B981',
  'Leaves': '#3B82F6',
  'Holidays': '#F59E0B',
  'Weekly Offs': '#6B7280'
};

const PieChartComponent = ({ month, year, employeeId }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseAttendanceData = (data) => {
    if (!data) return [];
    return Object.entries(data).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: parseFloat(value),
      color: COLOR_MAP[key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())] || '#9CA3AF'
    })).filter(item => item.value > 0);
  };

  useEffect(() => {
    const getData = async () => {
      if (!month || !year || !employeeId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchPieChart(month, year, employeeId);
        const parsed = parseAttendanceData(res);
        setChartData(parsed);
      } catch (err) {
        console.error("PieChart API error:", err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [month, year, employeeId]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 border bg-white text-black">
          <p>{`${payload[0].name}: ${payload[0].value.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) return <p className="text-center">Loading chart...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!chartData.length) return <p className="text-center">No data available</p>;

  return (
    <div>
      {/* Heading */}
      <h2 className="text-[16px] font-normal text-center mb-4">Attendance Overview</h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={5} label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}>
            {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;
