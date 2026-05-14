import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, X, ArrowLeft, Save, RefreshCw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchEmployeeShift, fetchPolicyData, addShift } from "../../service/companyService";
import { toast, Toaster } from "react-hot-toast";

const localizer = momentLocalizer(moment);

// POLICY COLORS
const policyColors = [
  "#60a5fa", "#f97316", "#10b981", "#ef4444", "#8b5cf6", "#ec4899",
  "#f59e0b", "#06b6d4", "#6366f1", "#14b8a6", "#d946ef", "#84cc16"
];

const getPolicyColor = (policy) => {
  if (policy.color) return policy.color;
  const identifier = policy.id || policy.attendance_policy_id || policy.name || "";
  const index = Math.abs(
    identifier.toString().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % policyColors.length;
  return policyColors[index];
};

const formatTime = (t) => {
  if (!t) return "N/A";
  try {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  } catch {
    return "Invalid Time";
  }
};

const PolicyBadge = ({ policy, isSelected }) => {
  const color = getPolicyColor(policy);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${isSelected ? "bg-gray-100" : ""}`}>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="font-medium">{policy.name || policy.attendance_policy}</div>
        {policy.startTime && policy.endTime && (
          <div className="text-sm text-gray-500">{formatTime(policy.startTime)} - {formatTime(policy.endTime)}</div>
        )}
      </div>
    </div>
  );
};

///////////////////////////////////////////////////////////////////////////
// SIDEBAR
///////////////////////////////////////////////////////////////////////////
const ShiftSidebar = ({ selectedDate, onClose, employeeId, fetchedPolicies, onShiftAdded }) => {
  const [assignedPolicy, setAssignedPolicy] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [fromDate, setFromDate] = useState(moment(selectedDate).format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(moment(selectedDate).format("YYYY-MM-DD"));

  useEffect(() => {
    const d = moment(selectedDate).format("YYYY-MM-DD");
    const match = fetchedPolicies.find(p => p.date === d);
    if (match) {
      setAssignedPolicy({
        id: match.attendance_policy_id,
        name: match.attendance_policy,
        is_default: match.is_default,
        color: getPolicyColor(match)
      });
    } else setAssignedPolicy(null);

    setFromDate(d);
    setToDate(d);
  }, [selectedDate, fetchedPolicies]);

  useEffect(() => {
    if (!isAdding) return;
    setLoadingPolicies(true);

    fetchPolicyData()
      .then((res) => {
        const list = (res.data || res).map(p => ({
          id: p.id,
          name: p.name || p.policy_name,
          start_time: p.start_time,
          end_time: p.end_time,
          color: getPolicyColor(p)
        }));
        setAvailablePolicies(list);
        if (list.length > 0) setSelectedPolicyId(list[0].id);
      })
      .catch(() => console.error("Failed to fetch policies"))
      .finally(() => setLoadingPolicies(false));
  }, [isAdding]);

  const saveNewPolicy = async () => {
    const payload = { id: selectedPolicyId };

    try {
      await addShift(payload, employeeId, fromDate, toDate);

      const pol = availablePolicies.find(p => p.id === selectedPolicyId);
      if (pol) {
        setAssignedPolicy({
          id: pol.id,
          name: pol.name,
          startTime: pol.start_time,
          endTime: pol.end_time,
          color: pol.color
        });
      }

      toast.success(
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Shift added successfully! Refreshing...</span>
        </div>,
        { duration: 2000 }
      );

      onShiftAdded();
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding shift:", error);
      toast.error("Failed to allocate shift.");
    }
  };

  return (
    <div className="h-full border-l border-gray-200 w-full p-6 overflow-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {moment(selectedDate).format("MMMM D, YYYY")}
          </h3>
          <p className="text-sm text-gray-500">Manage shifts for this date</p>
          {employeeId && <p className="text-sm text-blue-500">Employee ID: {employeeId}</p>}
        </div>

        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ASSIGNED POLICY */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium text-gray-700">Assigned Policy</h4>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center text-sm text-green-600 hover:text-green-800"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Shift
          </button>
        </div>

        {assignedPolicy ? (
          <PolicyBadge policy={assignedPolicy} isSelected={true} />
        ) : (
          <div className="text-gray-500 text-sm py-3">No policy assigned.</div>
        )}
      </div>

      {/* ADD NEW POLICY */}
      {isAdding && (
        <div className="border rounded-md p-4 mt-4">
          <h4 className="text-md font-medium text-gray-700 mb-4">Select Attendance Policy</h4>

          {loadingPolicies ? (
            <div>Loading policies...</div>
          ) : (
            <>
              {/* DATE RANGE */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                </div>

                <div>
                  <label className="text-sm">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                </div>
              </div>

              {/* POLICY LIST */}
              <select
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                className="w-full border px-3 py-2 rounded-md mb-4"
              >
                {availablePolicies.map(pol => (
                  <option key={pol.id} value={pol.id}>{pol.name}</option>
                ))}
              </select>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>

                <button
                  onClick={saveNewPolicy}
                  className="px-4 py-2 bg-black text-white rounded-md flex items-center"
                >
                  <Save className="h-4 w-4 mr-1" /> Allocate Shift
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

///////////////////////////////////////////////////////////////////////////
// MAIN COMPONENT
///////////////////////////////////////////////////////////////////////////
const ManageShift = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(true);
  const [fetchedPolicies, setFetchedPolicies] = useState([]);

  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  const [refresh, setRefresh] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.employeeId) {
      setEmployeeId(location.state.employeeId);
    }
  }, [location]);

  useEffect(() => {
    if (!employeeId) return;

    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();

    setLoading(true);

    fetchEmployeeShift(employeeId, month, year)
      .then((data) => {
        setFetchedPolicies(data);

        const ev = data.map((p) => {
          const date = new Date(p.date);
          let start = new Date(date);
          let end = new Date(date);

          if (p.start_time && p.end_time) {
            const [sh, sm] = p.start_time.split(":").map(Number);
            const [eh, em] = p.end_time.split(":").map(Number);

            start.setHours(sh, sm);
            end.setHours(eh, em);

            if (end < start) end.setDate(end.getDate() + 1);
          } else {
            start.setHours(9, 0);
            end.setHours(17, 0);
          }

          return {
            title: p.attendance_policy,
            start,
            end,
            color: getPolicyColor(p)
          };
        });

        setEvents(ev);
      })
      .finally(() => setLoading(false));

  }, [employeeId, currentDate, refresh]);

  const onShiftAdded = () => {
    setTimeout(() => setRefresh(r => r + 1), 800);
  };

  const toolbar = (props) => (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button onClick={() => props.onNavigate('PREV')}>Back</button>
        <button onClick={() => props.onNavigate('TODAY')}>Today</button>
        <button onClick={() => props.onNavigate('NEXT')}>Next</button>
      </span>

      <span className="rbc-toolbar-label">{props.label}</span>

      <span className="rbc-btn-group">
        {props.views.map((v) => (
          <button
            key={v}
            onClick={() => props.onView(v)}
            className={props.view === v ? "rbc-active" : ""}
          >
            {v}
          </button>
        ))}
      </span>
    </div>
  );

  const components = {
    toolbar,
    dateCellWrapper: ({ children, value }) => (
      <div onClick={() => setSelectedDate(value)} className="relative h-full w-full cursor-pointer">
        {children}
        <div className="absolute bottom-1 left-1 text-gray-400 text-lg">{value.getDate()}</div>
      </div>
    ),
    month: {
      dateHeader: ({ date }) => (
        <div style={{ color: "black", fontSize: "13px" }}>{date.getDate()}</div>
      )
    }
  };

  return (
    <div className="bg-slate-100 p-8">
      <Toaster position="top-right" />

      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center">
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div>
          <h1 className="text-xl font-bold text-gray-800">Employee Shifts</h1>
          <h2 className="text-sm text-gray-600">{moment(currentDate).format("MMMM YYYY")}</h2>
        </div>
      </div>

      <div className="flex gap-4 mt-8" style={{ height: "75vh" }}>
        <div className={`bg-white rounded-lg p-4 ${showSidebar ? "w-2/3" : "w-full"}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={["month", "week", "day"]}
              onNavigate={setCurrentDate}
              onSelectEvent={(e) => setSelectedDate(e.start)}
              onSelectSlot={(s) => setSelectedDate(s.start)}
              components={components}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.color,
                  color: "white",
                  borderRadius: "5px",
                  padding: "2px"
                }
              })}
              style={{ height: "100%" }}
            />
          )}
        </div>

        {showSidebar && (
          <div className="bg-white rounded-lg w-1/3">
            <ShiftSidebar
              selectedDate={selectedDate}
              onClose={() => setShowSidebar(false)}
              employeeId={employeeId}
              fetchedPolicies={fetchedPolicies}
              onShiftAdded={onShiftAdded}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageShift;
