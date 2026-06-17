import React, { useState, useEffect } from "react"; // 1. Added useEffect
import DashboardLayout from "../ui/pagelayout";
import DashboardHead from "../components/dashboard/head";
import DashboardOverview from "../components/dashboard/overview";
import LogDetails from "../components/dashboard/Attendance Tabs/logdetails";
import LeaveRequestes from "../components/tables/leaverequests";
import MusterRoll from "../components/tables/musterroll";
import RegularizationTable from "../components/tables/regularizationtable";

function Dashboard({ userId, userName, onLogout }) {
  // 2. Initialize state from localStorage if it exists, otherwise default to "overview"
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("dashboardActiveTab") || "overview";
  });

  // 3. Save the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("dashboardActiveTab", activeTab);
  }, [activeTab]);

  // Attendance Data
  const ATTENDANCE_DATA = {
    total: 134,
    ontime: 86,
    delay: 12,
    late: 9,
    absent: 21,
  };

  const getWidth = (value) =>
    ATTENDANCE_DATA?.total ? `${(value / ATTENDANCE_DATA.total) * 100}%` : "0%";

  // Sample Data
  const CALENDAR_DAYS = [
    { day: "Sunday", date: "06" },
    { day: "Monday", date: "07" },
    { day: "Tuesday", date: "08" },
    { day: "Wednesday", date: "09" },
    { day: "Thursday", date: "10" },
    { day: "Friday", date: "11" },
    { day: "Saturday", date: "12" },
    { day: "Sunday", date: "13" },
  ];

  const EMPLOYEES = [
    { name: "Vishnu", role: "UI/UX Designer", status: "Online" },
    { name: "Aswin Lal", role: "Designer", status: "Online" },
    { name: "Aleena Edhose", role: "Senior Developer", status: "Absent" },
    { name: "Greesham B", role: "Junior Developer", status: "Absent" },
    { name: "Alwin Gigi", role: "Backend Developer", status: "Delay" },
    { name: "Hridya S B", role: "Junior Developer", status: "Late" },
  ];

  const LEAVES = [
    { name: "Vishnu", role: "UI/UX Designer", date: "Only Today" },
    { name: "Aswin Lal", role: "Designer", date: "14 Feb" },
    { name: "Aleena Edhose", role: "Sr UX Designer", date: "8 Feb to 10 Feb" },
  ];

  return (
    <DashboardLayout userId={userId} userName={userName} onLogout={onLogout}>
      <div className="h-full flex flex-col w-full m-0 p-0">
        <div className="flex-1 overflow-y-auto w-full m-0 p-0 scrollbar-hide">
          <DashboardHead
            userName={userName}
            ATTENDANCE_DATA={ATTENDANCE_DATA}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="mt-6 flex flex-col gap-6 w-full m-0 p-0">
            {activeTab === "overview" && (
              <DashboardOverview
                ATTENDANCE_DATA={ATTENDANCE_DATA}
                getWidth={getWidth}
                CALENDAR_DAYS={CALENDAR_DAYS}
                EMPLOYEES={EMPLOYEES}
                LEAVES={LEAVES}
              />
            )}

            {activeTab === "logdetails" && (
              <LogDetails CALENDAR_DAYS={CALENDAR_DAYS} EMPLOYEES={EMPLOYEES} />
            )}

            {activeTab === "leaverequests" && <LeaveRequestes />}

            {activeTab === "musterRoll" && <MusterRoll />}

            {activeTab === "regularization" && <RegularizationTable />}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default Dashboard;
