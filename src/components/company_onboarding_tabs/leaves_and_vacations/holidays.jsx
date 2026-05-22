import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  List as ListIcon,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
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

const Holidays = () => {
  const [activeTab, setActiveTab] = useState("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [monthHolidays, setMonthHolidays] = useState([]);
  const [allHolidays, setAllHolidays] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const loadData = async () => {
    const syncToastId = "dashboard-sync-toast";
    toast.loading("Syncing holiday records...", { id: syncToastId });

    try {
      const [rawMonthData, rawAllData, rawBranches] = await Promise.all([
        fetchHolidaysByDate(
          currentMonth.getMonth() + 1,
          currentMonth.getFullYear(),
        ),
        fetchAllHolidays(),
        getBranchData(),
      ]);

      setMonthHolidays(rawMonthData || []);
      setAllHolidays(rawAllData || []);

      if (rawBranches) {
        setBranchOptions(
          rawBranches.map((b) => ({
            label: b.name.trim(),
            value: b.id.toString(),
          })),
        );
      }
      toast.dismiss(syncToastId);
    } catch (e) {
      console.error("Dashboard Synchronization Interrupted:", e);
      toast.error(e?.message || "Failed to sync holiday records dashboard.", {
        id: syncToastId,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

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
      // ✅ SUCCESS FIX: Now passing 'data' (the FormData variable), NOT 'formDataPayload'
      const response = isEditMode
        ? await modifyHoliday(editId, data)
        : await addHoliday(data);

      // 3. Resolve loading toast with clean success tracking message from backend
      toast.success(
        response?.message ||
          (isEditMode ? "Holiday updated!" : "Holiday added!"),
        {
          id: toastId,
        },
      );

      loadData(); // Sync parent dashboard charts and rows
      setIsModalOpen(false); // Close Modal view layer
    } catch (error) {
      console.error("Core Processing Operation Rejection:", error);

      // 4. Paint exact Go validator rejection message onto the viewport hot-toast canvas
      toast.error(error.message || "Failed to save holiday structure.", {
        id: toastId,
        duration: 5000,
      });
      throw error; // Bubble error down to preserve inner user state arrays
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
            <CalendarIcon size={16} /> Calendar View
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
            holidays={allHolidays}
            getBranchName={getBranchName}
            onRefresh={loadData}
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
        onRefresh={loadData}
      />
    </div>
  );
};

export default Holidays;
