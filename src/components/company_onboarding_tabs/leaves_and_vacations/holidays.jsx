import React, { useState, useEffect, useRef } from "react";
import { Plus, List as ListIcon, Upload } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import HolidayCalendar from "./holidayscalender";
import HolidayList from "./holidayslist";
import {
  fetchHolidaysByDate,
  fetchAllHolidays,
  addHoliday,
  modifyHoliday,
} from "../../../service/holidayservices";
import { getBranchData } from "../../../service/companyService";
import HolidayModal from "../../../ui/addholiday";
import BulkUploadModal from "../../../ui/holidaybulk";

/* ================= TOAST HELPERS ================= */
// Plain text only: App.jsx's <ToastContainer /> controls how every toast looks.

// Flattens backend "errors" / "data" (string | array | object) into lines.
const detailsText = (data, key) => {
  if (data === null || data === undefined || data === "") return [];
  if (typeof data === "string" || typeof data === "number")
    return [key ? `${key}: ${data}` : String(data)];
  if (Array.isArray(data)) return data.flatMap((d) => detailsText(d, key));
  if (typeof data === "object")
    return Object.entries(data).flatMap(([k, v]) => detailsText(v, k));
  return [];
};

// Backend message + errors + data as one plain string.
// Also works when a service throws a plain Error("message").
const apiErrorText = (error, fallback) => {
  const res = error?.response?.data;
  if (!res) return error?.message || fallback;
  if (typeof res === "string") return res.slice(0, 300);
  const message = res.message || res.error || fallback;
  const details = [
    ...new Set([...detailsText(res.errors), ...detailsText(res.data)]),
  ].filter((d) => d !== message);
  return details.length ? `${message}: ${details.join("; ")}` : message;
};

const Holidays = () => {
  const [activeTab, setActiveTab] = useState("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [monthHolidays, setMonthHolidays] = useState([]);
  const [yearHolidays, setYearHolidays] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  // The "Syncing holiday records..." toast shows only on the very first load
  const syncToastShown = useRef(false);

  // Year shared by the calendar and the list
  const selectedYear = currentMonth.getFullYear();

  // Load every holiday of the selected year (GET /admin/holiday/get?year=YYYY)
  const loadYearHolidays = async (year) => {
    try {
      const data = await fetchAllHolidays(year);
      // Safety net: keep only rows that belong to the requested year
      setYearHolidays(
        (data || []).filter(
          (h) => String(h.date || "").slice(0, 4) === String(year),
        ),
      );
    } catch (e) {
      console.error("Failed to load year holidays:", e);
      toast.error(apiErrorText(e, "Failed to load holidays for this year."));
    }
  };

  // Move the shared month by whole years (keeps the same month)
  const changeYear = (offset) =>
    setCurrentMonth(
      new Date(selectedYear + offset, currentMonth.getMonth(), 1),
    );

  const loadData = async () => {
    // Show the sync toast only the first time, every later refresh is silent
    const showSync = !syncToastShown.current;
    syncToastShown.current = true;
    const syncToastId = "dashboard-sync-toast";
    if (showSync) {
      toast.loading("Syncing holiday records...", { toastId: syncToastId });
    }

    try {
      const [rawMonthData, rawBranches] = await Promise.all([
        fetchHolidaysByDate(
          currentMonth.getMonth() + 1,
          currentMonth.getFullYear(),
        ),
        getBranchData(),
      ]);

      setMonthHolidays(rawMonthData || []);

      if (rawBranches) {
        setBranchOptions(
          rawBranches.map((b) => ({
            label: b.name.trim(),
            value: b.id.toString(),
          })),
        );
      }
      if (showSync) toast.dismiss(syncToastId);
    } catch (e) {
      console.error("Dashboard Synchronization Interrupted:", e);
      if (showSync) toast.dismiss(syncToastId);
      toast.error(apiErrorText(e, "Failed to sync holiday records dashboard."));
    }
  };

  // Calendar data + branches: reload when the month changes
  useEffect(() => {
    loadData();
  }, [currentMonth]);

  // List data: reload only when the year changes
  useEffect(() => {
    loadYearHolidays(selectedYear);
  }, [selectedYear]);

  // Refresh both views silently (after add / edit / delete / bulk upload).
  // Returns a promise so callers can wait until the screen is up to date.
  const refreshAll = () =>
    Promise.all([loadData(), loadYearHolidays(selectedYear)]);

  // Instantly drop a deleted holiday from the calendar and the list
  const removeHolidayLocal = (id) => {
    setMonthHolidays((prev) => prev.filter((h) => String(h.id) !== String(id)));
    setYearHolidays((prev) => prev.filter((h) => String(h.id) !== String(id)));
  };

  /**
   * Lifted Form Submission Action Handler with Manual Toast Pipeline Integration
   */
  const handleHolidaySubmit = async (
    formDataPayload,
    isEditMode,
    editId = null,
  ) => {
    // 1. Fire sequential processing toast with tracking token
    const toastId = toast.loading(
      isEditMode ? "Updating holiday record..." : "Saving new holiday...",
    );

    // 2. Create the genuine multipart/form-data payload container instance
    const data = new FormData();
    data.append("title", formDataPayload.title.trim());
    data.append("date", formDataPayload.date);
    if (formDataPayload.image) {
      data.append("image", formDataPayload.image);
    }

    // Map selected branches array out onto flat individual payload fields
    if (formDataPayload.selectedBranches.includes("0")) {
      branchOptions.forEach((b) => {
        data.append("branch", String(b.value).trim());
      });
    } else {
      formDataPayload.selectedBranches.forEach((id) => {
        data.append("branch", String(id).trim());
      });
    }

    try {
      const response = isEditMode
        ? await modifyHoliday(editId, data)
        : await addHoliday(data);

      // 3. Replace loading toast with the success message from backend
      toast.dismiss(toastId);
      toast.success(
        response?.message ||
          (isEditMode ? "Holiday updated!" : "Holiday added!"),
      );

      // Wait for fresh data so the list is already updated when the modal closes
      await refreshAll();
      setIsModalOpen(false); // Close modal
    } catch (error) {
      console.error("Core Processing Operation Rejection:", error);

      // 4. Show the backend message + errors + data
      toast.dismiss(toastId);
      toast.error(apiErrorText(error, "Failed to save holiday structure."));
      throw error; // Bubble error down to preserve inner user state
    }
  };

  const getBranchName = (id) => {
    if (id === "0" || !id) return "General";
    return (
      branchOptions.find((o) => o.value === id.toString())?.label ||
      `Branch ${id}`
    );
  };

  return (
    <div className="p-4 w-full bg-white min-h-screen">
      {/* TABS & ACTIONS SECTION */}
      <div className="flex justify-between items-end border-b border-gray-300 mb-6">
        {/* Left Side: Tab Navigation */}
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
              activeTab === "calendar" ? "text-black" : "text-black/30"
            }`}
          >
            <Icon icon="solar:calendar-outline" className="w-4 h-4" /> Calendar
            View
            {activeTab === "calendar" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
              activeTab === "list" ? "text-black" : "text-black/30"
            }`}
          >
            <ListIcon size={16} /> Holiday List
            {activeTab === "list" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
            )}
          </button>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="pb-2 flex items-center gap-3">
          {/* Bulk Upload Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-black text-[12px] font-light hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} strokeWidth={1.5} /> Bulk Upload
          </button>

          {/* Add Holiday Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg text-white text-[12px] font-light hover:bg-zinc-800 transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} /> Add Holiday
          </button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="w-full">
        {activeTab === "calendar" ? (
          <HolidayCalendar
            holidays={monthHolidays}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            getBranchName={getBranchName}
          />
        ) : (
          <HolidayList
            holidays={yearHolidays}
            year={selectedYear}
            onYearChange={changeYear}
            getBranchName={getBranchName}
            onRefresh={refreshAll}
            onRemoved={removeHolidayLocal}
            onSubmitAction={handleHolidaySubmit}
          />
        )}
      </div>

      {/* SINGLE HOLIDAY MODAL */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitAction={handleHolidaySubmit}
        editData={null}
      />

      {/* MULTI-BRANCH BULK UPLOAD MODAL */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onRefresh={refreshAll}
      />
    </div>
  );
};

export default Holidays;
