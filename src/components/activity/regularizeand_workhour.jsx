// FILE: src/components/calendar/EmployeeActions.jsx
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axiosInstance from "../../service/axiosinstance";
import moment from "moment";

export default function RegularizeAndWorkHour({
  UUID,
  selectedDate,
  selectedDayData,
  refreshAttendance,
}) {
  const [regularizeMode, setRegularizeMode] = useState(false);
  const [viewAllMode, setViewAllMode] = useState(false); // state for view all
  const [viewAllData, setViewAllData] = useState(null); // data from /master/location-device
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editDate, setEditDate] = useState(selectedDate || new Date());

  const [workHourFrom, setWorkHourFrom] = useState("");
  const [workHourTo, setWorkHourTo] = useState("");
  const [workHourResult, setWorkHourResult] = useState("");
  const [fullData, setFullData] = useState(null);

  useEffect(() => {
    if (!selectedDayData) return;
    setEditCheckIn(extractTimeForInput(selectedDayData?.in));
    setEditCheckOut(extractTimeForInput(selectedDayData?.out));
    setEditDate(selectedDate);
  }, [selectedDayData, selectedDate]);

  const extractTimeForInput = (dateString) => {
    if (!dateString) return "";
    const match = dateString.split("T")[1]?.split(":");
    if (!match) return "";
    if (match[0] === "00" && match[1] === "00") return "";
    return `${match[0]}:${match[1]}`;
  };

  const toggleRegularizeMode = () => {
    if (!regularizeMode) {
      setEditCheckIn(extractTimeForInput(selectedDayData?.in));
      setEditCheckOut(extractTimeForInput(selectedDayData?.out));
      setEditDate(selectedDate);
    }
    setRegularizeMode(!regularizeMode);
    setViewAllMode(false); // hide view all mode when regularize is active
  };

  const handleRegularize = async () => {
    if (!editCheckIn && !editCheckOut) {
      alert("Please enter at least check-in or check-out time");
      return;
    }

    const inIso = editCheckIn
      ? `${format(editDate, "yyyy-MM-dd")}T${editCheckIn}:00Z`
      : "";
    const outIso = editCheckOut
      ? `${format(editDate, "yyyy-MM-dd")}T${editCheckOut}:00Z`
      : "";

    try {
      const res = await axiosInstance.post(
        `/admin/staff/regularize/${UUID}`,
        {
          date: format(editDate, "yyyy-MM-dd"),
          check_in: inIso,
          check_out: outIso,
        }
      );

      if (res.data.status_code === 200) {
        alert("Work hours regularized successfully!");
        setRegularizeMode(false);
        refreshAttendance();
      } else {
        alert("Error regularizing work hours");
      }
    } catch (err) {
      console.error("REGULARIZE API ERROR:", err);
      alert("Error regularizing work hours");
    }
  };

  const handleShowWorkHours = async () => {
    if (!workHourFrom || !workHourTo) {
      alert("Please select both From and To dates");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/admin/staff/daterange/workhours/${UUID}`,
        { from: workHourFrom, to: workHourTo }
      );

      if (res.data.status_code === 200) {
        setWorkHourResult(res.data.data);
        setFullData(res.data);
      } else {
        setWorkHourResult("Error fetching work hours");
        setFullData(null);
      }
    } catch (err) {
      console.error("WORK HOUR API ERROR:", err);
      setWorkHourResult("Error fetching work hours");
      setFullData(null);
    }
  };

  const handleViewAllData = async () => {
    try {
      const res = await axiosInstance.get(
        `${axiosInstance.baseURL2}/master/location-device/${UUID}`
      );
      if (res.data.status_code === 200) {
        setViewAllData(res.data.data);
        setViewAllMode(true);
      } else {
        alert("Error fetching full data");
      }
    } catch (err) {
      console.error("VIEW ALL DATA ERROR:", err);
      alert("Error fetching full data");
    }
  };

  const cleanTime = (t) => {
    if (!t || !t.includes("T")) return "-";
    const timePart = t.split("T")[1].replace("Z", "");
    const [hh, mm] = timePart.split(":");
    return moment(`${hh}:${mm}`, "HH:mm").format("hh:mm A");
  };

  const cleanDuration = (t) => {
    if (!t || !t.includes("T")) return "0 hrs";
    const timePart = t.split("T")[1].replace("Z", "");
    const [h, m] = timePart.split(":").map(Number);
    return `${h} hrs ${m} mins`;
  };

  // If view all mode is active, show only the View All Data section
  if (viewAllMode) {
    return (
      <div className="flex flex-col gap-4 border p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-medium text-[14px]">Location & Device Data</h2>
          <button
            className="px-2 py-1 rounded text-[12px] bg-gray-500 text-white hover:bg-gray-600"
            onClick={() => setViewAllMode(false)}
          >
            Back
          </button>
        </div>

        {viewAllData ? (
          <div className="text-[12px] flex flex-col gap-1">
            <p><strong>Device:</strong> {viewAllData.device}</p>
            <p><strong>IP:</strong> {viewAllData.ip}</p>
            <p><strong>Location:</strong> {viewAllData.location}</p>
            <p><strong>Latitude:</strong> {viewAllData.latitude}</p>
            <p><strong>Longitude:</strong> {viewAllData.longitude}</p>
            <p><strong>Network:</strong> {viewAllData.network}</p>
            <p><strong>Source:</strong> {viewAllData.source}</p>
          </div>
        ) : (
          <p className="text-[12px]">No data available</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border p-4">
      {/* Header with date and regularize button */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-medium text-[14px]">{format(selectedDate, "MMMM d, yyyy")}</h2>
        <button
          className="px-2 py-1 rounded text-[12px] bg-black text-white hover:bg-gray-600"
          onClick={toggleRegularizeMode}
        >
          {regularizeMode ? "Cancel" : "Regularize"}
        </button>
      </div>

      {/* Regularize Form */}
      {regularizeMode ? (
        <div className="flex flex-col gap-2">
          <label className="text-[12px] text-gray-500">Select Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-[12px]"
            value={format(editDate, "yyyy-MM-dd")}
            onChange={(e) => setEditDate(new Date(e.target.value))}
          />

          <label className="text-[12px] text-gray-500">Check-in</label>
          <input
            type="time"
            className="border rounded px-2 py-1 text-[12px]"
            value={editCheckIn}
            onChange={(e) => setEditCheckIn(e.target.value)}
          />

          <label className="text-[12px] text-gray-500">Check-out</label>
          <input
            type="time"
            className="border rounded px-2 py-1 text-[12px]"
            value={editCheckOut}
            onChange={(e) => setEditCheckOut(e.target.value)}
          />

          <button
            className="mt-2 w-full bg-green-500 text-white text-[12px] py-1 rounded hover:bg-green-600"
            onClick={handleRegularize}
          >
            Submit Regularization
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-500 text-[12px]">
            {selectedDayData ? selectedDayData.record_type : "No Data"}
          </p>

          <div className="flex justify-between mt-2 text-[12px]">
            <div>
              <p className="text-gray-500">Check-in</p>
              <p>{cleanTime(selectedDayData?.in)}</p>
            </div>
            <div>
              <p className="text-gray-500">Check-out</p>
              <p>{cleanTime(selectedDayData?.out)}</p>
            </div>
          </div>

          <div className="flex justify-between mt-2 text-[12px]">
            <div>
              <p className="text-gray-500">Total Hours</p>
              <p>{cleanDuration(selectedDayData?.total_hour)}</p>
            </div>
            <div>
              <p className="text-gray-500">Overtime</p>
              <p>{cleanDuration(selectedDayData?.overtime_hr)}</p>
            </div>
          </div>
        </div>
      )}

      <hr />

      {/* View All Data Button */}
      <div className="flex justify-end mt-2 mb-2">
        <button
          className="px-2 py-1 rounded text-[12px] bg-black text-white hover:bg-gray-800"
          onClick={handleViewAllData}
        >
          View All Data
        </button>
      </div>

      {/* Calculate Work Hours */}
      <div>
        <p className="text-gray-500 text-[12px]">Calculate Work Hours</p>

        <div className="flex gap-2 mt-1">
          <input
            type="date"
            className="border rounded px-2 py-1 w-1/2 text-[12px]"
            value={workHourFrom}
            onChange={(e) => setWorkHourFrom(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-2 py-1 w-1/2 text-[12px]"
            value={workHourTo}
            onChange={(e) => setWorkHourTo(e.target.value)}
          />
        </div>

        <button
          className="mt-2 w-full bg-black text-white text-[12px] py-1 rounded hover:bg-gray-600"
          onClick={handleShowWorkHours}
        >
          Show Work Hours
        </button>

        {workHourResult && (
          <p className="text-[12px] mt-2 font-medium">Total Work Hours: {workHourResult}</p>
        )}
      </div>
    </div>
  );
}
