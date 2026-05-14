import React from "react";
import { Edit2 } from "lucide-react";
import PayrollTable from "../../../ui/payrolltable";

const DefaultAttendanceTemplates = ({ data = [], loading, onEdit }) => {
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "0000-01-01T00:00:00Z") return "N/A";
    const timePart = timeStr.includes("T")
      ? timeStr.split("T")[1].substring(0, 5)
      : timeStr.substring(0, 5);
    const [hour, minute] = timePart.split(":");
    const hr = parseInt(hour, 10);
    const ampm = hr >= 12 ? "PM" : "AM";
    const displayHour = hr % 12 === 0 ? 12 : hr % 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Logic for the status badges
  const getBadgeDetails = (row) => {
    if (row.is_flexible) {
      return {
        label: "Flexible",
        color: "text-blue-600 bg-blue-50 border-blue-100",
      };
    }
    if (row.for_weekly_off) {
      return {
        label: "Weekly Off",
        color: "text-purple-600 bg-purple-50 border-purple-100",
      };
    }
    if (row.consider_as_halfday) {
      return {
        label: "Half Day",
        color: "text-orange-600 bg-orange-50 border-orange-100",
      };
    }
    return {
      label: "Regular",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    };
  };

  const columns = [
    {
      key: "policy_name",
      label: <span className="font-['Poppins']">Template Name</span>,
      align: "left",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: row.policy_colour || "#000" }}
          />
          <div className="flex flex-col">
            <span className="truncate font-medium text-gray-900 font-['Poppins'] text-[13px]">
              {value}
            </span>
            <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">
              {row.policy_code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "shift_window",
      label: "Shift Window",
      align: "center",
      render: (_, row) => (
        <div className="flex flex-col items-center">
          <span className="text-gray-700 text-[12px] font-medium font-['Poppins']">
            {row.is_flexible
              ? "Anytime"
              : `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`}
          </span>
          <span className="text-[10px] text-gray-400 font-['Poppins']">
            {row.working_hours} Hrs Shift
          </span>
        </div>
      ),
    },
    {
      key: "weekly_expected_hours",
      label: "Weekly Target",
      align: "center",
      render: (val) => (
        <div className="flex items-center justify-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          <span className="text-zinc-900 font-semibold font-['Poppins'] text-[12px]">
            {val || 0}
          </span>
          <span className="text-[10px] text-gray-400 font-['Poppins']">
            Hrs/Week
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      align: "center",
      render: (_, row) => {
        const badge = getBadgeDetails(row);
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] border uppercase tracking-wider ${badge.color} font-['Poppins']`}
          >
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      align: "center",
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(row);
          }}
          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          title="View Template Details"
        >
          <Edit2 size={16} />
        </button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-[12px] font-['Poppins']">
          Loading system templates...
        </p>
      </div>
    );

  return (
    <div className="w-full relative">
      <PayrollTable
        columns={columns}
        data={data || []}
        rowsPerPage={8}
        rowClickHandler={null}
      />
    </div>
  );
};

export default DefaultAttendanceTemplates;
