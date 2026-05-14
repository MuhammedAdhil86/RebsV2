import React, { useState, useEffect, useMemo, useCallback } from "react";
import Drawer from "@mui/material/Drawer";
import {
  FiX,
  FiClock,
  FiInfo,
  FiUser,
  FiCalendar,
  FiShield,
  FiExternalLink,
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
  const [currentStaffName, setCurrentStaffName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const getPlaceholderImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Asset")}&background=f3f4f6&color=a1a1aa&size=512&bold=true`;

  const fetchAllocations = useCallback(async () => {
    if (!asset?.id) return;
    setIsLoading(true);
    try {
      const response = await fetchAssetAllocationById(asset.id);
      if (response?.status_code === 200 && Array.isArray(response.data)) {
        setAllocations(response.data);
        if (response.data.length > 0) {
          const latest = response.data[response.data.length - 1];
          setCurrentStatus(latest.status);
          setCurrentStaffName(
            latest.status === "Allocated" ? latest.staff_name : "",
          );
        } else {
          setCurrentStatus(asset.asset_status);
          setCurrentStaffName(asset.staff_name || "");
        }
      }
    } catch (e) {
      console.error("History sync failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [asset?.id, asset?.asset_status, asset?.staff_name]);

  useEffect(() => {
    if (asset?.id) {
      fetchAllocations();
      setSelectedEmployee(null);
      setActiveSubTab("details");
    }
  }, [asset?.id, fetchAllocations]);

  const handleAction = async (type) => {
    const toastId = toast.loading(
      type === "return" ? "Processing return..." : "Allocating asset...",
    );

    try {
      if (type === "return") {
        // Find the staff ID from the most recent 'Allocated' record, or fallback to asset prop
        const activeAllocation = [...allocations]
          .reverse()
          .find((a) => a.status === "Allocated");
        const staffId = activeAllocation?.staff_id || asset.staff_id;

        if (!staffId) {
          throw new Error("No active Staff ID found for this asset.");
        }

        await returnAsset(asset.id, staffId);
        toast.success("Asset returned to inventory", { id: toastId });
      } else {
        if (!selectedEmployee) {
          toast.error("Please select a staff member", { id: toastId });
          return;
        }

        await axiosInstance.post("/admin/assetallocation/add", {
          asset_id: asset.id,
          staff_id: selectedEmployee.uuid,
        });
        toast.success(`Allocated to ${selectedEmployee.name}`, { id: toastId });
      }

      // Success cleanup
      onRefresh();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (e) {
      const errorMsg =
        e.response?.data?.message || e.message || "Action failed";
      toast.error(errorMsg, { id: toastId });
    }
  };

  const infoGrid = useMemo(() => {
    if (!asset) return [];
    const formatDate = (d) =>
      d && !d.startsWith("1970") ? new Date(d).toLocaleDateString() : "N/A";

    return [
      {
        label: "Condition",
        val: asset.condition || "Good",
        icon: <FiShield />,
      },
      {
        label: "Status",
        val: currentStatus || asset.asset_status || "Available",
        icon: <FiInfo />,
      },
      {
        label: "Staff ID",
        val: asset.staff_id || "Unassigned",
        icon: <FiUser />,
      },
      {
        label: "Staff Name",
        val: currentStaffName || asset.staff_name || "N/A",
        icon: <FiUser />,
      },
      {
        label: "Purchase Date",
        val: formatDate(asset.purchase_date),
        icon: <FiCalendar />,
      },
      {
        label: "Last Maintenance",
        val: formatDate(asset.last_maintenance),
        icon: <FiClock />,
      },
    ];
  }, [asset, currentStatus, currentStaffName]);

  if (!asset) return null;

  return (
    <Drawer
      anchor="right"
      open={!!asset}
      onClose={onClose}
      PaperProps={{ className: "w-full max-w-[500px] border-none shadow-2xl" }}
    >
      <div className="h-full flex flex-col bg-white font-poppins text-[12px] font-regular">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[16px] font-regular text-gray-900 leading-tight">
              {asset.asset_name}
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">
              {asset.asset_type || "Asset"} • ID: {asset.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 pt-2 gap-8 border-b bg-gray-50/50">
          {[
            { id: "details", label: "Information", icon: <FiInfo /> },
            { id: "history", label: "History Log", icon: <FiClock /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`pb-3 text-[12px] flex items-center gap-2 transition-all relative ${
                activeSubTab === tab.id
                  ? "text-black font-regular after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeSubTab === "details" ? (
            <div className="space-y-8">
              {/* Asset Image */}
              <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden aspect-video bg-gray-50 flex items-center justify-center relative">
                <img
                  src={asset.image || getPlaceholderImage(asset.asset_name)}
                  className="w-full h-full object-cover"
                  alt={asset.asset_name}
                  onError={(e) =>
                    (e.target.src = getPlaceholderImage(asset.asset_name))
                  }
                />
                {asset.image && (
                  <a
                    href={asset.image}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm"
                  >
                    <FiExternalLink size={14} className="text-gray-600" />
                  </a>
                )}
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {infoGrid.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-[14px]">{item.icon}</span>
                      <label className="text-[10px] uppercase font-regular tracking-wide">
                        {item.label}
                      </label>
                    </div>
                    <p className="text-[12px] text-gray-800 font-regular">
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* History Timeline Tab */
            <div className="pt-2">
              {isLoading ? (
                <div className="py-20 text-center text-gray-400 text-[12px]">
                  Syncing history...
                </div>
              ) : allocations.length > 0 ? (
                <Timeline sx={{ p: 0 }}>
                  {[...allocations].reverse().map((item, idx) => (
                    <TimelineItem
                      key={idx}
                      sx={{ "&::before": { display: "none" } }}
                    >
                      <TimelineSeparator>
                        <TimelineDot
                          sx={{
                            bgcolor: "black",
                            width: "6px",
                            height: "6px",
                            boxShadow: "none",
                          }}
                        />
                        {idx !== allocations.length - 1 && (
                          <TimelineConnector sx={{ bgcolor: "#f3f4f6" }} />
                        )}
                      </TimelineSeparator>
                      <TimelineContent sx={{ pb: 4, pt: 0 }}>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center">
                            <p className="text-[12px] font-regular text-gray-900">
                              {item.staff_name}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                item.status === "Allocated"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 font-regular">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <div className="py-20 text-center text-gray-300 text-[12px] italic">
                  No records found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-white sticky bottom-0">
          {(currentStatus || asset.asset_status) === "Allocated" ? (
            <button
              onClick={() => handleAction("return")}
              className="w-full bg-white border border-black py-3 rounded-xl text-[12px] font-regular hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
            >
              Return to Inventory
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEmployeeDrawerOpen(true)}
                className="flex-[1.5] bg-gray-50 border border-gray-200 py-3 rounded-xl text-[12px] font-regular flex items-center justify-center gap-2 hover:border-black transition-all"
              >
                <FiUser />{" "}
                {selectedEmployee ? selectedEmployee.name : "Select Staff"}
              </button>
              <button
                disabled={!selectedEmployee}
                onClick={() => handleAction("allocate")}
                className="flex-1 bg-black text-white py-3 rounded-xl text-[12px] font-regular disabled:opacity-30 transition-all shadow-lg active:scale-95"
              >
                Allocate
              </button>
            </div>
          )}
        </div>

        {/* Staff Selector Drawer */}
        <Drawer
          anchor="right"
          open={isEmployeeDrawerOpen}
          onClose={() => setIsEmployeeDrawerOpen(false)}
          PaperProps={{ className: "w-full max-w-[480px] shadow-2xl" }}
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
