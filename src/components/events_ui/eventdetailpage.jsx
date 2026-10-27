import React, { useState, useEffect } from "react";
import {
  FiClock,
  FiCalendar,
  FiArrowLeft,
  FiFileText,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { deleteEventApi } from "../../service/eventservice";
import { fetchTimeZone } from "../../service/eventservices";
import DeleteConfirmationModal from "../../ui/deletemodal";
import EventEdit from "./eventedit";

// true only for real IANA names like "Asia/Kolkata" (not ids like "1")
const isValidTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const EventDetailPage = ({ event, onBack, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timeZones, setTimeZones] = useState([]);

  // Load the timezone list so an id like "1" can be turned into "Asia/Kolkata"
  useEffect(() => {
    let mounted = true;
    fetchTimeZone()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data;
        if (mounted) setTimeZones(Array.isArray(list) ? list : []);
      })
      .catch(() => mounted && setTimeZones([]));
    return () => {
      mounted = false;
    };
  }, []);

  if (!event) return null;

  // Show the edit window instead of the details
  if (isEditing) {
    return (
      <EventEdit
        event={event}
        onClose={() => setIsEditing(false)}
        onUpdateSuccess={async () => {
          await onDeleteSuccess?.(); // refreshes the React Query cache
          onBack?.(); // closes the drawer
        }}
      />
    );
  }

  // Resolve the event's timezone (id or name) to a valid IANA name
  const resolveTimezone = () => {
    const raw = String(event.time_zone ?? event.timezone ?? "").trim();
    if (!raw) return "Asia/Kolkata";

    const match = timeZones.find(
      (tz) => String(tz.id) === raw || tz.name === raw,
    );
    if (match && isValidTimeZone(match.name)) return match.name;

    if (isValidTimeZone(raw)) return raw;
    return "Asia/Kolkata";
  };

  const targetTimezone = resolveTimezone();

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return "Date not set";
      const cleanDateStr =
        typeof dateStr === "string" && dateStr.includes("Z")
          ? dateStr.split("Z")[0]
          : dateStr;
      const date = new Date(cleanDateStr);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: targetTimezone,
      }).format(date);
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatTime = (dateStr) => {
    try {
      if (!dateStr) return "N/A";
      const cleanDateStr =
        typeof dateStr === "string" && dateStr.includes("Z")
          ? dateStr.split("Z")[0]
          : dateStr;
      const date = new Date(cleanDateStr);
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: targetTimezone,
      }).format(date);
    } catch (e) {
      return "N/A";
    }
  };

  const handleConfirmDelete = async () => {
    setIsModalOpen(false);
    setIsDeleting(true);

    try {
      const eventId = event.id || event._id;
      await deleteEventApi(eventId);
      toast.success("Event deleted successfully");
      if (onDeleteSuccess) await onDeleteSuccess();
      if (onBack) onBack();
    } catch (err) {
      console.error("Failed to delete the event:", err);
      toast.error("Failed to delete the event. Please try again");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="font-poppins text-[12px] h-full flex flex-col bg-white text-black">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase tracking-widest font-normal font-poppins"
        disabled={isDeleting}
      >
        <FiArrowLeft /> Back to Calendar
      </button>

      <div className="flex-1 space-y-10">
        <div>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-normal font-poppins">
            Event Detail
          </span>
          <h2 className="text-[16px] text-gray-900 uppercase tracking-tighter mt-4 font-normal font-poppins">
            {event.title}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FiCalendar />
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-1 font-poppins">
                Date
              </p>
              <p className="text-gray-800 font-normal font-poppins">
                {formatDate(event.start_date || event.start)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FiClock />
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-1 font-poppins">
                Time
              </p>
              <p className="text-gray-800 font-normal font-poppins">
                {formatTime(event.start_date || event.start)} -{" "}
                {formatTime(event.end_date || event.end)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FiFileText />
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-1 font-poppins">
                Description
              </p>
              <p className="text-gray-600 leading-relaxed font-normal font-poppins">
                {event.description || "No description provided for this event."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-gray-100 flex gap-4">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
          className="flex-1 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest font-normal flex items-center justify-center gap-2 disabled:opacity-50 font-poppins"
        >
          <FiEdit2 size={14} /> Edit
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isDeleting}
          className="flex-1 py-3 border border-red-50 text-red-500 rounded-xl hover:bg-red-50 transition-all uppercase tracking-widest font-normal flex items-center justify-center gap-2 disabled:opacity-50 font-poppins"
        >
          <FiTrash2 size={14} /> {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={event.title || "this event"}
      />
    </div>
  );
};

export default EventDetailPage;
