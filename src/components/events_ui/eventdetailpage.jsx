import React from "react";
import {
  FiClock,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiArrowLeft,
  FiFileText,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { format } from "date-fns"; // ✅ Standard import to fix your error

const EventDetailPage = ({ event, onBack }) => {
  if (!event) return null;

  // Safe formatting to prevent crashes on invalid dates
  const formatDate = (dateStr) => {
    try {
      return dateStr
        ? format(new Date(dateStr), "EEEE, dd MMMM yyyy")
        : "Date not set";
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatTime = (dateStr) => {
    try {
      return dateStr ? format(new Date(dateStr), "hh:mm a") : "N/A";
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <div className="font-poppins text-[12px] h-full flex flex-col">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase tracking-widest font-normal"
      >
        <FiArrowLeft /> Back to Calendar
      </button>

      <div className="flex-1 space-y-10">
        <div>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-normal">
            Event Detail
          </span>
          <h2 className="text-[16px] text-gray-900 uppercase tracking-tighter mt-4 font-normal">
            {event.title}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FiCalendar />
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-1">
                Date
              </p>
              <p className="text-gray-800 font-normal">
                {formatDate(event.start_date || event.start)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FiClock />
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-1">
                Time
              </p>
              <p className="text-gray-800 font-normal">
                {formatTime(event.start_date)} - {formatTime(event.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FiFileText />
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-1">
                Description
              </p>
              <p className="text-gray-600 leading-relaxed font-normal">
                {event.description || "No description provided for this event."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-gray-100 flex gap-4">
        <button className="flex-1 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest font-normal flex items-center justify-center gap-2">
          <FiEdit2 size={14} /> Edit
        </button>
        <button className="flex-1 py-3 border border-red-50 text-red-500 rounded-xl hover:bg-red-50 transition-all uppercase tracking-widest font-normal flex items-center justify-center gap-2">
          <FiTrash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};

export default EventDetailPage;
