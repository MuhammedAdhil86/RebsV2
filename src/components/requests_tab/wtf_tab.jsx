import React from "react";
import { MoreHorizontal } from "lucide-react";

// --------------------------------------
// STATUS COLORS
// --------------------------------------
const statusColors = {
  Pending: "text-yellow-500",
  Approved: "text-green-600",
  Rejected: "text-red-600",
};

// --------------------------------------
// WFH REQUEST DATA (INSIDE SAME FILE)
// --------------------------------------
const requests = {
  recent: [
    {
      name: "Greeshma r",
      status: "Pending",
      reason:
        "Due to minor health issues, I would like to request permission to work from home for the day to ensure productivity while also recovering",
      start: "25/09/2024",
      end: "25/09/2024",
    },
    {
      name: "Gokul S",
      status: "Pending",
      reason:
        "Due to minor health issues, I would like to request permission to work from home for the day to ensure productivity while also recovering",
      start: "25/09/2024",
      end: "26/09/2024",
    },
  ],
  approved: [
    {
      name: "Aleona Eldhose",
      status: "Approved",
      reason:
        "Due to minor health issues, I would like to request permission to work from home for the day to ensure productivity while also recovering",
      start: "25/09/2024",
      end: "25/09/2024",
    },
  ],
  rejected: [
    {
      name: "Rohith E R",
      status: "Rejected",
      reason:
        "Due to minor health issues, I would like to request permission to work from home for the day to ensure productivity while also recovering",
      start: "23/09/2024",
      end: "25/09/2024",
    },
  ],
};

// --------------------------------------
// REQUEST CARD COMPONENT
// --------------------------------------
const RequestCard = ({ req }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border w-full">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium">{req.name}</p>

        <span
          className={`text-[11px] flex items-center gap-1 ${statusColors[req.status]}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              req.status === "Pending"
                ? "bg-yellow-600"
                : statusColors[req.status].replace("text", "bg")
            }`}
          ></span>
          {req.status}
        </span>
      </div>

      <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer" />
    </div>

    <div className="bg-[#f9fafb] p-3 rounded-lg mt-3">
      <p className="text-[11px] font-medium text-gray-700">Reason :</p>
      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{req.reason}</p>

      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span className="bg-white px-3 py-1 rounded">{req.start}</span>
        <span className="bg-white px-3 py-1 rounded">{req.end}</span>
      </div>
    </div>

    {req.status === "Pending" && (
      <div className="flex gap-2 mt-5">
        <button className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-red-400 text-red-500 hover:bg-red-50">
          Reject
        </button>

        <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800">
          Approve
        </button>
      </div>
    )}
  </div>
);

// --------------------------------------
// MAIN WFH TAB COMPONENT
// --------------------------------------
export default function WfhTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-4 transition-all duration-300">
      
      {/* Recent */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Recent Requests{" "}
          <span className="text-gray-400">( {requests.recent.length} )</span>
        </h3>

        <div className="flex flex-col gap-4">
          {requests.recent.map((req, i) => (
            <RequestCard key={i} req={req} />
          ))}
        </div>
      </div>

      {/* Approved */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Approved Requests{" "}
          <span className="text-gray-400">( {requests.approved.length} )</span>
        </h3>

        <div className="flex flex-col gap-4">
          {requests.approved.map((req, i) => (
            <RequestCard key={i} req={req} />
          ))}
        </div>
      </div>

      {/* Rejected */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Rejected Requests{" "}
          <span className="text-gray-400">( {requests.rejected.length} )</span>
        </h3>

        <div className="flex flex-col gap-4">
          {requests.rejected.map((req, i) => (
            <RequestCard key={i} req={req} />
          ))}
        </div>
      </div>
    </div>
  );
}
