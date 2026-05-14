import React, { useState, useEffect } from "react";
import Drawer from "@mui/material/Drawer";
import {
  FiX,
  FiClock,
  FiInfo,
  FiUser,
  FiArrowLeftCircle,
} from "react-icons/fi";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@mui/lab";
import toast from "react-hot-toast";

import EmployeeAsset from "./employeeasset";
import {
  fetchAssetAllocationById,
  returnAsset,
} from "../../service/assetservice";
import axiosInstance from "../../service/axiosinstance";

const AssetDetailDrawer = ({ asset, onRefresh, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState("details");
  const [allocations, setAllocations] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const getPlaceholderImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name,
    )}&background=f3f4f6&color=a1a1aa&size=512&bold=true`;

  const fetchAllocations = async () => {
    if (!asset?.id) return;
    setIsLoading(true);
    try {
      const response = await fetchAssetAllocationById(asset.id);
      if (response?.status_code === 200) {
        const data = response.data || [];
        setAllocations(data);

        // Logic: If there is an allocation history, take the status of the latest record
        // Otherwise, fallback to the asset's main status
        const latestStatus =
          data.length > 0 ? data[data.length - 1].status : asset.asset_status;

        setCurrentStatus(latestStatus);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load asset history",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (asset?.id) fetchAllocations();
  }, [asset?.id]);

  const handleReturn = async () => {
    // Find the most recent "Allocated" entry to get the staff_id
    const activeEntry = [...allocations]
      .reverse()
      .find((a) => a.status.toLowerCase() === "allocated");

    if (!activeEntry) {
      toast.error("No active allocation found to return");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await returnAsset(asset.id, activeEntry.staff_id);
      toast.success(res?.data?.message || "Asset returned successfully");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return asset");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedEmployee) {
      toast.error("Please select a staff member");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await axiosInstance.post("/admin/assetallocation/add", {
        asset_id: asset.id,
        staff_id: selectedEmployee.uuid,
      });
      toast.success(res?.data?.message || "Asset allocated successfully");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Allocation failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!asset) return null;

  // Normalize status for conditional rendering
  const isCurrentlyAllocated = currentStatus?.toLowerCase() === "allocated";

  return (
    <Drawer
      anchor="right"
      open={!!asset}
      onClose={onClose}
      PaperProps={{ className: "w-full max-w-[500px] shadow-2xl border-none" }}
    >
      <div className="h-full flex flex-col bg-white font-poppins">
        {/* HEADER */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-gray-900 text-[18px] uppercase tracking-tight">
              {asset.asset_name}
            </h2>
            <p className="text-gray-400 text-[10px]  uppercase tracking-widest mt-1">
              {asset.asset_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex px-8 pt-2 gap-8 border-b border-gray-100">
          {["details", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 text-[11px] uppercase tracking-widest  flex items-center gap-2 transition-all ${
                activeSubTab === tab
                  ? "border-b-2 border-black text-black"
                  : "text-gray-400"
              }`}
            >
              {tab === "details" ? <FiInfo /> : <FiClock />} {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeSubTab === "details" ? (
            <div className="space-y-8">
              <div className="rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden aspect-video bg-gray-50 relative group">
                <img
                  src={asset.image || getPlaceholderImage(asset.asset_name)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt="Asset"
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest shadow-sm ${
                      isCurrentlyAllocated
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {[
                  { label: "Condition", value: asset.condition },
                  { label: "Status", value: currentStatus },
                  {
                    label: "Current Holder",
                    value: asset.staff_name || "Unassigned",
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 tracking-widest ml-1">
                      {item.label}
                    </label>
                    <p className="text-sm font-medium text-gray-800 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] uppercase  text-gray-400 tracking-widest">
                    Fetching History
                  </p>
                </div>
              ) : allocations.length > 0 ? (
                <Timeline position="right" sx={{ p: 0 }}>
                  {[...allocations].reverse().map((item, idx) => (
                    <TimelineItem
                      key={idx}
                      sx={{ "&:before": { display: "none" } }}
                    >
                      <TimelineSeparator>
                        <TimelineDot
                          sx={{ bgcolor: "black", boxShadow: "none" }}
                        />
                        {idx !== allocations.length - 1 && (
                          <TimelineConnector sx={{ bgcolor: "#f3f4f6" }} />
                        )}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: "12px", px: 2 }}>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <p className=" text-gray-900 text-sm">
                              {item.staff_name}
                            </p>
                            <span
                              className={`text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded ${
                                item.status.toLowerCase() === "allocated"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-500 bg-gray-100"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-gray-400">
                            <FiClock size={12} />
                            <p className="text-[10px] font-medium italic">
                              {new Date(item.date).toLocaleDateString(
                                undefined,
                                { dateStyle: "long" },
                              )}
                            </p>
                          </div>
                        </div>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest">
                    No Allocation History Found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-8 border-t border-gray-100 bg-white sticky bottom-0">
          {isCurrentlyAllocated ? (
            <button
              onClick={handleReturn}
              disabled={isActionLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-black text-black py-4 rounded-2xl uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            >
              {isActionLoading ? (
                "Processing..."
              ) : (
                <>
                  <FiArrowLeftCircle size={18} /> Return Asset
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => setIsEmployeeDrawerOpen(true)}
                className="flex-[1.5] bg-gray-50 border border-gray-200 text-gray-700 py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:bg-gray-100 transition-all"
              >
                <FiUser size={16} />
                <span className="truncate">
                  {selectedEmployee ? selectedEmployee.name : "Select Staff"}
                </span>
              </button>

              <button
                disabled={!selectedEmployee || isActionLoading}
                onClick={handleAllocate}
                className="flex-1 bg-black text-white py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30"
              >
                {isActionLoading ? "..." : "Allocate"}
              </button>
            </div>
          )}
        </div>

        {/* EMPLOYEE SELECTION DRAWER */}
        <Drawer
          anchor="right"
          open={isEmployeeDrawerOpen}
          onClose={() => setIsEmployeeDrawerOpen(false)}
          PaperProps={{
            className: "w-full max-w-[500px] border-none shadow-2xl",
          }}
        >
          <EmployeeAsset
            onBack={() => setIsEmployeeDrawerOpen(false)}
            onEmployeeSelect={(emp) => {
              setSelectedEmployee(emp);
              setIsEmployeeDrawerOpen(false);
            }}
          />
        </Drawer>
      </div>
    </Drawer>
  );
};

export default AssetDetailDrawer;
