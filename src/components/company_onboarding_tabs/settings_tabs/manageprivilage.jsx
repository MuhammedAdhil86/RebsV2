import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import CustomSelect from "../../../ui/customselect";
import {
  fetchShifts,
  fetchUserShiftDetails,
  fetchUserLocationDevice,
  allocateShift,
} from "../../../service/policiesService";
import { fetchDeviceHistoryByUser } from "../../../service/deviceService";

/* --------------------------
   Reverse Geocode Helper
-------------------------- */
const getPlaceName = async (latitude, longitude) => {
  if (!latitude || !longitude) return "-";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      { headers: { "User-Agent": "PrivilegesApp" } },
    );
    const data = await response.json();
    return data.display_name || "-";
  } catch (error) {
    console.error("Error fetching location name:", error);
    return "-";
  }
};

export default function ManagePrivilegesSection({ uuid }) {
  const [userType, setUserType] = useState("-");
  const [shift, setShift] = useState("");
  const [device, setDevice] = useState("-");
  const [location, setLocation] = useState("-");
  const [shifts, setShifts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [shiftFrom, setShiftFrom] = useState("");
  const [shiftTo, setShiftTo] = useState("");

  // States for Device History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const getShifts = async () => {
      try {
        const data = await fetchShifts();
        setShifts(data);
      } catch (error) {
        toast.error("Failed to fetch shifts");
      }
    };
    getShifts();
  }, []);

  useEffect(() => {
    if (!uuid) return;

    const fetchPrivileges = async () => {
      setLoading(true);
      try {
        const [shiftData, locData] = await Promise.all([
          fetchUserShiftDetails(uuid),
          fetchUserLocationDevice(uuid),
        ]);

        setUserType(shiftData.user_type || "-");
        setShift(shiftData.shift_name || "");
        setSelectedShiftId(shiftData.shift_id || "");
        setDevice(locData?.device || "-");

        if (locData?.latitude && locData?.longitude) {
          const place = await getPlaceName(
            Number(locData.latitude),
            Number(locData.longitude),
          );
          setLocation(place);
        } else {
          setLocation("-");
        }
      } catch (error) {
        toast.error("Failed to fetch user privileges");
      } finally {
        setLoading(false);
      }
    };

    fetchPrivileges();
  }, [uuid]);

  // Handle open history logic
  const handleViewDeviceHistory = async () => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      // Executes the clean dataset returned by the high-scale service transformer
      const history = await fetchDeviceHistoryByUser(uuid);
      setDeviceHistory(history);
    } catch (error) {
      console.error("Error loading high-scale device collection:", error);
      toast.error("Failed to fetch device history");
      setShowHistoryModal(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveShift = async () => {
    if (!selectedShiftId || !shiftFrom) {
      toast.error("Please select shift and Effective From date.");
      return;
    }

    try {
      const payload = {
        shift_id: selectedShiftId,
        staff_id: uuid,
        from_date: new Date(shiftFrom).toISOString(),
        to_date: shiftTo ? new Date(shiftTo).toISOString() : null,
      };

      await allocateShift(payload);

      const shiftObj = shifts.find((s) => s.id === selectedShiftId);
      setShift(shiftObj?.shift_name || "-");
      setShowShiftModal(false);
      setIsEditing(false);
      toast.success("Shift updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update shift");
    }
  };

  const shiftOptions = shifts.map((s) => ({
    label: s.shift_name,
    value: s.id,
  }));

  if (loading)
    return <div className="text-gray-500 p-4">Loading privileges...</div>;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full space-y-4">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Manage Privileges
        </h3>
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            className="text-red-500 text-[12px] font-medium hover:underline"
          >
            Cancel
          </button>
        ) : (
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>

      <div className="text-sm space-y-2">
        <Row label="User Type" value={userType} />

        {/* Shift Management */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Work Shift</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-[13px]">
              {shift || "-"}
            </span>
            {isEditing && (
              <button
                className="text-blue-600 text-[12px] hover:underline"
                onClick={() => {
                  setShiftFrom(new Date().toISOString().split("T")[0]);
                  setShowShiftModal(true);
                }}
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Device Row with History Trigger */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Registered Device</span>
          <div className="flex items-center gap-2 max-w-[220px]">
            <span className="font-medium text-gray-800 text-[13px] truncate">
              {device}
            </span>
            {isEditing && (
              <button
                className="text-blue-600 text-[12px] hover:underline shrink-0"
                onClick={handleViewDeviceHistory}
              >
                History
              </button>
            )}
          </div>
        </div>

        <Row label="Location" value={location} />
      </div>

      {/* --- Shift Modal --- */}
      {showShiftModal && (
        <Modal
          title="Update Shift"
          width="340px"
          onClose={() => setShowShiftModal(false)}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Select Shift
              </label>
              <CustomSelect
                value={selectedShiftId}
                options={shiftOptions}
                onChange={(val) => setSelectedShiftId(Number(val))}
                minWidth={290}
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Effective From
              </label>
              <input
                type="date"
                value={shiftFrom}
                onChange={(e) => setShiftFrom(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm outline-none bg-gray-50"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Effective To (Optional)
              </label>
              <input
                type="date"
                value={shiftTo}
                onChange={(e) => setShiftTo(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm outline-none bg-gray-50"
              />
            </div>

            <button
              className="bg-black text-white w-full py-2.5 rounded-lg mt-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              onClick={saveShift}
            >
              Update Shift
            </button>
          </div>
        </Modal>
      )}

      {/* --- Device History Modal --- */}
      {showHistoryModal && (
        <Modal
          title="Device Log History"
          width="450px"
          onClose={() => setShowHistoryModal(false)}
        >
          {loadingHistory ? (
            <div className="text-gray-500 text-sm text-center py-6">
              Loading history logs...
            </div>
          ) : deviceHistory.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-6">
              No historical data available.
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
              {deviceHistory.map((log, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-[12px] space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800 text-[13px]">
                      {log.device}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${log.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                    >
                      {log.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    ID:{" "}
                    <span className="text-gray-700 font-mono">
                      {log.device_id || "N/A"}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Approved By:{" "}
                    <span className="text-gray-700">
                      {log.approved_by_name} ({log.approved_by || "N/A"})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200 text-gray-400 text-[11px]">
                    <div>
                      First Use:
                      <br />
                      <span className="text-gray-600 font-medium">
                        {log.first_used_at
                          ? new Date(log.first_used_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <div>
                      Last Use:
                      <br />
                      <span className="text-gray-600 font-medium">
                        {log.last_used_at
                          ? new Date(log.last_used_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* --- Sub-components --- */
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 py-2">
      <span className="text-gray-500 text-[12px]">{label}</span>
      <span className="font-medium text-gray-800 text-[13px] max-w-[220px] truncate">
        {value || "-"}
      </span>
    </div>
  );
}

function Modal({ title, onClose, width = "340px", children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-[2px]">
      <div
        style={{ width: width }}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-[95vw] animate-in fade-in zoom-in duration-200"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[16px]">{title}</h3>
          <button
            className="text-gray-400 hover:text-black transition-colors"
            onClick={onClose}
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
