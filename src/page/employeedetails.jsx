import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, X } from "lucide-react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../ui/pagelayout";
import avatar from "../assets/img/avatar.svg";
import toast, { Toaster } from "react-hot-toast";

// Zustand Store
import useEmployeeStore from "../store/employeeStore";

// Tabs
import PersonalInfoTab from "../components/profiledetailstabs/personal_info_tab.jsx";
import AttachmentsTab from "../components/profiledetailstabs/attachment_tab.jsx";
import ActivityTab from "../components/profiledetailstabs/activity_tab.jsx";
import SettingsTab from "../components/profiledetailstabs/settings_tab.jsx";
import ManageShiftTab from "../components/profiledetailstabs/manageshift.jsx";

import axiosInstance from "../service/axiosinstance.js";

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Personal Info");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const { selectedEmployee, fetchEmployeeById } = useEmployeeStore();

  useEffect(() => {
    if (id) fetchEmployeeById(id);
  }, [id, fetchEmployeeById]);

  const isActive =
    selectedEmployee?.is_active === true ||
    selectedEmployee?.is_active === "true";

  const toggleStatus = async () => {
    if (!selectedEmployee?.uuid) return;
    try {
      setStatusUpdating(true);
      const newStatus = !isActive;
      await axiosInstance.put(
        `/staff/toggle-activate/${selectedEmployee.uuid}?activate=${newStatus}`,
      );
      toast.success(
        `Employee ${newStatus ? "activated" : "deactivated"} successfully!`,
      );
      await fetchEmployeeById(selectedEmployee.id);
    } catch (err) {
      toast.error("Status update failed");
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }
    try {
      await axiosInstance.delete(`/staff/delete/${selectedEmployee.uuid}`, {
        data: { reason: deleteReason },
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Employee deleted successfully");
      setShowDeleteModal(false);
      setTimeout(() => navigate("/manageemployee"), 1500);
    } catch (err) {
      toast.error("Failed to delete employee");
      console.error(err);
    }
  };

  const sidebarTabs = [
    { name: "Personal Info", icon: "proicons:person" },
    { name: "Activities", icon: "solar:graph-outline" },
    { name: "Attachments", icon: "subway:pin" },
    { name: "Manage Shift", icon: "ic:twotone-manage-history" },
    { name: "Notifications", icon: "hugeicons:notification-02" },
    { name: "Settings", icon: "solar:settings-linear" },
  ];

  return (
    <DashboardLayout userName={selectedEmployee?.first_name || "Employee"}>
      <Toaster position="top-right" />

      <div className="bg-[#f9fafb] min-h-screen">
        <header className="flex items-center justify-between bg-white px-6 py-3 border-b shadow-sm rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </button>
            <h1 className="text-lg text-gray-800 font-medium">
              Employee Profile
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <Bell size={20} />
            </button>
            <img
              src={selectedEmployee?.image || avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full border object-cover"
            />
          </div>
        </header>

        <div className="flex gap-3 p-3">
          <aside className="sticky top-4 h-fit w-60 bg-white border rounded-2xl p-6 flex flex-col items-center shadow-sm">
            <span
              className={`absolute top-2 right-2 px-2 py-1 text-[10px]  rounded flex items-center gap-1 ${isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              {isActive ? "Active" : "Deactivated"}
            </span>

            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-gray-50 mt-4 shadow-sm">
              <img
                src={selectedEmployee?.image || avatar}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            </div>

            <h2 className="text-sm  text-gray-800 text-center">
              {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </h2>
            <p className="text-[12px] text-gray-400 mb-6">
              {selectedEmployee?.email}
            </p>

            <div className="w-full space-y-1">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl transition-all text-xs  ${
                    activeTab === tab.name
                      ? "bg-black text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    icon={tab.icon}
                    width="18"
                    className={
                      activeTab === tab.name ? "text-white" : "text-gray-400"
                    }
                  />
                  <span>{tab.name}</span>
                </button>
              ))}

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs  mt-4"
              >
                <Icon icon="fluent:delete-20-regular" width="18" />
                Delete User
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto max-h-[85vh] pr-2 scrollbar-none">
            {activeTab === "Activities" ? (
              <ActivityTab employee={selectedEmployee} />
            ) : activeTab === "Personal Info" ? (
              <PersonalInfoTab employee={selectedEmployee} />
            ) : activeTab === "Attachments" ? (
              <AttachmentsTab
                attachments={selectedEmployee?.attachments || []}
              />
            ) : activeTab === "Settings" ? (
              <SettingsTab
                employee={selectedEmployee}
                employeeUUID={selectedEmployee?.uuid}
              />
            ) : activeTab === "Manage Shift" ? (
              <ManageShiftTab employeeUUID={selectedEmployee?.uuid} />
            ) : (
              <div className="p-10 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                {activeTab} content coming soon...
              </div>
            )}
          </main>
        </div>

        {/* Delete Modal Logic remains the same */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg  text-gray-800 mb-2">Confirm Deletion</h2>
              <p className="text-xs text-gray-500 mb-4">
                Provide a reason for deleting{" "}
                <b>{selectedEmployee?.first_name}</b>.
              </p>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-xs mb-4 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                rows={3}
                placeholder="Reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2 text-xs  text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2 text-xs  bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
