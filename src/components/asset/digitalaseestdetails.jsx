import React, { useState, useEffect, useCallback } from "react";
import Drawer from "@mui/material/Drawer";
import {
  FiX,
  FiClock,
  FiInfo,
  FiUser,
  FiGlobe,
  FiLock,
  FiExternalLink,
  FiCopy,
  FiShield,
  FiCalendar,
  FiKey,
  FiHash,
  FiActivity,
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
  fetchDigitalTimelineById,
  returnDigitalAsset,
  allocateDigitalAsset,
} from "../../service/assetservice";

const DigitalAssetDetailDrawer = ({ asset, onRefresh, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState("details");
  const [history, setHistory] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const getPlaceholderImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Asset")}&background=f3f4f6&color=a1a1aa&size=512&bold=false`;

  // ✅ Fetch history and sync status from source of truth
  const fetchHistory = useCallback(async () => {
    if (!asset?.id) return;
    setIsLoading(true);
    try {
      const response = await fetchDigitalTimelineById(asset.id);
      const data = response?.data || response || [];
      setHistory(data);

      // Prioritize the latest log entry for status, fallback to asset prop
      const latestStatus =
        data.length > 0 ? data[0].status : asset.account_status;
      setCurrentStatus(latestStatus);
    } catch (e) {
      console.error("Timeline Fetch Error:", e);
      setCurrentStatus(asset?.account_status || "Available");
    } finally {
      setIsLoading(false);
    }
  }, [asset]);

  useEffect(() => {
    if (asset?.id) {
      fetchHistory();
      setSelectedEmployee(null);
      setActiveSubTab("details");
    }
  }, [asset?.id, fetchHistory]);

  const handleAction = async (type) => {
    const isReturn = type === "return";
    const toastId = toast.loading(
      isReturn ? "Revoking access..." : "Granting access...",
    );

    try {
      if (isReturn) {
        const activeStaffId =
          history.find((h) => h.status === "Allocated")?.staff_id ||
          asset.staff_id;
        if (!activeStaffId)
          throw new Error("Could not identify the assigned staff member.");

        await returnDigitalAsset({
          asset_id: asset.id,
          staff_id: activeStaffId,
        });
        toast.success("Access revoked successfully", { id: toastId });
      } else {
        if (!selectedEmployee) {
          toast.error("Please select a staff member first", { id: toastId });
          return;
        }
        await allocateDigitalAsset({
          asset_id: asset.id,
          staff_id: selectedEmployee.uuid,
        });
        toast.success(`Access granted to ${selectedEmployee.name}`, {
          id: toastId,
        });
      }
      onRefresh();
      setTimeout(() => onClose(), 500);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Action failed";
      toast.error(msg, { id: toastId });
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: { fontSize: "12px", borderRadius: "8px", fontFamily: "Poppins" },
      icon: "📋",
    });
  };

  if (!asset) return null;

  // Date Formatting Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Drawer
      anchor="right"
      open={!!asset}
      onClose={onClose}
      PaperProps={{ className: "w-full max-w-[500px] border-none shadow-2xl" }}
    >
      <div className="h-full flex flex-col bg-white font-poppins text-[12px] font-normal">
        {/* Header Section */}
        <div className="p-6 border-b flex justify-between items-start sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-[16px] text-gray-900 leading-tight uppercase tracking-tight font-normal">
              {asset.account_name}
            </h2>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-normal">
              {asset.account_type} Account • ID: #{asset.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 gap-8 border-b bg-gray-50/50">
          {[
            { id: "details", label: "Account Info", icon: <FiLock /> },
            { id: "history", label: "Access Log", icon: <FiClock /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-4 text-[12px] uppercase tracking-wider flex items-center gap-2 transition-all relative font-normal ${
                activeSubTab === tab.id
                  ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSubTab === "details" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Asset Main Image */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden aspect-video bg-gray-50 flex items-center justify-center relative">
                <img
                  src={asset.image || getPlaceholderImage(asset.account_name)}
                  className="w-full h-full object-cover"
                  alt=""
                  onError={(e) =>
                    (e.target.src = getPlaceholderImage(asset.account_name))
                  }
                />
                {asset.account_url && (
                  <a
                    href={
                      asset.account_url.startsWith("http")
                        ? asset.account_url
                        : `https://${asset.account_url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-sm hover:bg-black hover:text-white transition-all"
                  >
                    <FiExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Comprehensive Data List */}
              <div className="space-y-2">
                {[
                  {
                    label: "Account URL",
                    val: asset.account_url,
                    icon: <FiGlobe />,
                    copy: true,
                  },
                  {
                    label: "Login Username",
                    val: asset.username,
                    icon: <FiUser />,
                    copy: true,
                  },
                  {
                    label: "Password",
                    val: asset.password,
                    icon: <FiKey />,
                    copy: true,
                  },
                  {
                    label: "Security Passkey",
                    val: asset.passkey,
                    icon: <FiShield />,
                    copy: true,
                  },
                  {
                    label: "Auth Mode",
                    val: asset.authentication_mode,
                    icon: <FiActivity />,
                    copy: false,
                  },
                  {
                    label: "Staff Name",
                    val: asset.staff_name || "Unassigned",
                    icon: <FiUser />,
                    copy: false,
                  },
                  {
                    label: "Staff ID",
                    val: asset.staff_id,
                    icon: <FiHash />,
                    copy: false,
                  },
                  {
                    label: "Status",
                    val: currentStatus,
                    icon: <FiInfo />,
                    copy: false,
                  },
                  {
                    label: "Created Date",
                    val: formatDate(asset.created_date),
                    icon: <FiCalendar />,
                    copy: false,
                  },
                  {
                    label: "System Sync",
                    val: formatDate(asset.created_on),
                    icon: <FiClock />,
                    copy: false,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-all group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="text-gray-300 group-hover:text-black transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="overflow-hidden">
                        <label className="text-[10px] uppercase text-gray-400 tracking-tighter block font-normal">
                          {item.label}
                        </label>
                        <p className="text-[12px] text-gray-800 truncate font-normal">
                          {item.val || "—"}
                        </p>
                      </div>
                    </div>
                    {item.copy && item.val && (
                      <button
                        onClick={() => copyToClipboard(item.val, item.label)}
                        className="p-2 text-gray-300 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <FiCopy size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Timeline/History Log */
            <div className="animate-in slide-in-from-right duration-300">
              {isLoading ? (
                <div className="py-20 text-center text-gray-400 italic font-normal">
                  Fetching access records...
                </div>
              ) : history.length > 0 ? (
                <Timeline sx={{ p: 0 }}>
                  {history.map((item, idx) => (
                    <TimelineItem
                      key={idx}
                      sx={{ "&::before": { display: "none" } }}
                    >
                      <TimelineSeparator>
                        <TimelineDot
                          sx={{
                            bgcolor: "black",
                            boxShadow: "none",
                            width: 6,
                            height: 6,
                          }}
                        />
                        {idx !== history.length - 1 && (
                          <TimelineConnector sx={{ bgcolor: "#f3f4f6" }} />
                        )}
                      </TimelineSeparator>
                      <TimelineContent sx={{ pb: 4, pt: 0 }}>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-normal">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-900">
                              {item.staff_name || "System Record"}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-tighter ${
                                item.status === "Allocated"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                            <FiCalendar size={10} />
                            {new Date(item.date).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <div className="py-20 text-center text-gray-300 italic font-normal">
                  No history records available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions Area */}
        <div className="p-6 border-t bg-white">
          {currentStatus === "Allocated" ? (
            <button
              onClick={() => handleAction("return")}
              className="w-full bg-white border border-black py-3.5 rounded-xl text-[12px] uppercase tracking-widest hover:bg-black hover:text-white transition-all font-normal"
            >
              Revoke Account Access
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => setIsEmployeeDrawerOpen(true)}
                className="flex-[1.5] bg-gray-50 border border-gray-200 py-3.5 rounded-xl text-[12px] flex items-center justify-center gap-2 hover:border-black transition-all font-normal"
              >
                <FiUser />{" "}
                {selectedEmployee ? selectedEmployee.name : "Select Employee"}
              </button>
              <button
                disabled={!selectedEmployee}
                onClick={() => handleAction("allocate")}
                className="flex-1 bg-black text-white py-3.5 rounded-xl text-[12px] uppercase tracking-widest disabled:opacity-20 transition-all font-normal"
              >
                Grant Access
              </button>
            </div>
          )}
        </div>

        {/* Employee Search Sub-Drawer */}
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

export default DigitalAssetDetailDrawer;
