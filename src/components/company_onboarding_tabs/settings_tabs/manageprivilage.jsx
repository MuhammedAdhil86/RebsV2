import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ChevronDown, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchShifts,
  fetchUserShiftDetails,
  fetchUserLocationDevice,
  allocateShift,
} from "../../../service/policiesService";
import { fetchShiftMappedPolicies } from "../../../service/companyService";
import { fetchDeviceHistoryByUser } from "../../../service/deviceService";

/* --------------------------
   Helpers
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

const formatDate = (value) => {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const [saving, setSaving] = useState(false);

  // Shift change chosen in the modal, waiting for the header "Save"
  const [currentShiftId, setCurrentShiftId] = useState("");
  const [pendingChange, setPendingChange] = useState(null);
  const pendingRef = useRef(null);
  pendingRef.current = pendingChange;

  // Mapped policies for the shift chosen in the modal
  const [mappedPolicies, setMappedPolicies] = useState([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState(false);
  const [policyReloadKey, setPolicyReloadKey] = useState(0);

  // Policy cache: shift_id -> policies, plus in-flight requests
  const policyCache = useRef({});
  const policyInflight = useRef({});

  // All mapped policies selected by default, unless a pending change exists
  const defaultPolicyIds = (policies) => {
    const pend = pendingRef.current;
    if (pend && String(pend.shiftId) === String(selectedShiftId)) {
      return pend.policyIds;
    }
    return policies.map((p) => p.id);
  };

  const getPolicies = (shiftId) => {
    if (policyCache.current[shiftId]) {
      return Promise.resolve(policyCache.current[shiftId]);
    }
    if (!policyInflight.current[shiftId]) {
      policyInflight.current[shiftId] = fetchShiftMappedPolicies(shiftId)
        .then((list) => {
          policyCache.current[shiftId] = list;
          return list;
        })
        .finally(() => {
          delete policyInflight.current[shiftId];
        });
    }
    return policyInflight.current[shiftId];
  };

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
        setCurrentShiftId(shiftData.shift_id || "");
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

  /* ---------- Prefetch every shift's policies when the modal opens ---------- */
  useEffect(() => {
    if (!showShiftModal) return;
    shifts.forEach((s) => {
      getPolicies(s.id).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShiftModal, shifts]);

  /* ---------- Show mapped policies instantly when the shift changes ---------- */
  useEffect(() => {
    setPoliciesError(false);

    if (!showShiftModal || !selectedShiftId) {
      setMappedPolicies([]);
      setSelectedPolicyIds([]);
      return;
    }

    // Already cached (prefetched or opened before): show with no delay
    const cached = policyCache.current[selectedShiftId];
    if (cached) {
      setMappedPolicies(cached);
      setSelectedPolicyIds(defaultPolicyIds(cached));
      setPoliciesLoading(false);
      return;
    }

    let cancelled = false;
    setSelectedPolicyIds([]);
    setPoliciesLoading(true);

    getPolicies(selectedShiftId)
      .then((policies) => {
        if (cancelled) return;
        setMappedPolicies(policies);
        setSelectedPolicyIds(defaultPolicyIds(policies));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Mapped policies request failed:", err);
        setMappedPolicies([]);
        setPoliciesError(true);
      })
      .finally(() => {
        if (!cancelled) setPoliciesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShiftId, showShiftModal, policyReloadKey]);

  const togglePolicy = (id) => {
    setSelectedPolicyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const openShiftModal = () => {
    if (pendingChange) {
      setShiftFrom(pendingChange.from);
      setShiftTo(pendingChange.to);
    } else {
      setShiftFrom(new Date().toISOString().split("T")[0]);
      setShiftTo("");
    }
    setShowShiftModal(true);
  };

  // Close without applying: restore the last applied / current shift
  const closeShiftModal = () => {
    setSelectedShiftId(pendingChange?.shiftId ?? currentShiftId);
    setShowShiftModal(false);
  };

  // Handle open history logic
  const handleViewDeviceHistory = async () => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
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

  // Modal "Apply": validate and hold the change; nothing is sent yet
  const applyShiftChange = () => {
    if (!selectedShiftId || !shiftFrom) {
      toast.error("Please select shift and Effective From date.");
      return;
    }
    if (shiftTo && shiftTo < shiftFrom) {
      toast.error("Effective To cannot be before Effective From.");
      return;
    }
    if (mappedPolicies.length > 0 && selectedPolicyIds.length === 0) {
      toast.error("Select at least one policy.");
      return;
    }

    const shiftObj = shifts.find(
      (s) => String(s.id) === String(selectedShiftId),
    );
    setPendingChange({
      shiftId: Number(selectedShiftId),
      shiftName: shiftObj?.shift_name || "-",
      from: shiftFrom,
      to: shiftTo,
      policyIds: selectedPolicyIds,
    });
    setShowShiftModal(false);
  };

  // Header "Save": send the pending allocation
  const saveChanges = async () => {
    if (!pendingChange) {
      toast.error("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shift_id: pendingChange.shiftId,
        staff_id: uuid,
        from_date: `${pendingChange.from}T00:00:00Z`,
        to_date: pendingChange.to ? `${pendingChange.to}T00:00:00Z` : null,
        policy_ids: pendingChange.policyIds,
      };

      await allocateShift(payload);

      setShift(pendingChange.shiftName);
      setCurrentShiftId(pendingChange.shiftId);
      setPendingChange(null);
      setIsEditing(false);
      toast.success("Shift updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update shift");
    } finally {
      setSaving(false);
    }
  };

  // Header "Cancel": discard the pending change and leave edit mode
  const cancelEditing = () => {
    setPendingChange(null);
    setSelectedShiftId(currentShiftId);
    setShowShiftModal(false);
    setIsEditing(false);
  };

  if (loading)
    return <div className="text-gray-500 p-4">Loading privileges...</div>;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full space-y-4">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Manage Privileges
        </h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving || !pendingChange}
              className={`text-sm text-blue-600 font-medium hover:underline ${
                saving || !pendingChange ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => (isEditing ? cancelEditing() : setIsEditing(true))}
            title={isEditing ? "Cancel edit" : "Edit"}
          />
        </div>
      </div>

      <div className="text-sm space-y-2">
        <Row label="User Type" value={userType} />

        {/* Shift Management */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Work Shift</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-[13px]">
              {pendingChange ? pendingChange.shiftName : shift || "-"}
            </span>
            {pendingChange && (
              <span className="text-[10px] text-gray-600 bg-slate-100 border border-gray-200 rounded-full px-2 py-0.5">
                Unsaved
              </span>
            )}
            {isEditing && (
              <button
                className={
                  pendingChange
                    ? "text-blue-600 text-[12px] font-medium underline"
                    : "text-blue-600 text-[12px] hover:underline"
                }
                onClick={openShiftModal}
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

      {/* ================= UPDATE SHIFT MODAL ================= */}
      {showShiftModal && (
        <Modal
          title="Update Shift"
          subtitle="Choose the shift and policies, then press Save above."
          icon="solar:clock-circle-outline"
          width="460px"
          onClose={closeShiftModal}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeShiftModal}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-normal text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyShiftChange}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-normal hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
              >
                <Icon icon="solar:check-circle-outline" className="w-4 h-4" />
                Apply
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Current shift */}
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
              <span className="text-[11px] text-gray-500">Current shift</span>
              <span className="text-xs text-gray-900 bg-white border border-gray-200 rounded-full px-2.5 py-0.5">
                {shift || "Not assigned"}
              </span>
            </div>

            {/* Shift (same as Bulk Allocation) */}
            <div>
              <label className="text-[11px] text-gray-500 block mb-1.5">
                Select target Shift
              </label>
              <div className="relative">
                <select
                  value={selectedShiftId}
                  onChange={(e) =>
                    setSelectedShiftId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs appearance-none text-gray-700 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                >
                  <option value="">Choose Shift Definition</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shift_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            {/* Mapped policies (same as Bulk Allocation) */}
            {selectedShiftId && (
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1">
                  <Icon
                    icon="solar:shield-check-outline"
                    className="w-3.5 h-3.5"
                  />
                  Apply Policies
                </label>

                {policiesLoading ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <RefreshCw size={11} className="animate-spin" />
                    Loading policies...
                  </div>
                ) : policiesError ? (
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    Could not load policies
                    <button
                      type="button"
                      onClick={() => {
                        delete policyCache.current[selectedShiftId];
                        setPolicyReloadKey((k) => k + 1);
                      }}
                      className="underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : mappedPolicies.length === 0 ? (
                  <span className="text-[11px] text-gray-400 italic">
                    No policies mapped to this shift
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {mappedPolicies.map((p) => {
                      const active = selectedPolicyIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePolicy(p.id)}
                          aria-pressed={active}
                          title={p.code}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-colors ${
                            active
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {active && (
                            <Icon
                              icon="material-symbols:check"
                              className="w-3 h-3"
                            />
                          )}
                          {p.name}
                          <span
                            className={
                              active ? "text-gray-300" : "text-gray-400"
                            }
                          >
                            ({p.code})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="From Date"
                value={shiftFrom}
                onChange={setShiftFrom}
              />
              <DateField
                label="To Date (optional)"
                value={shiftTo}
                min={shiftFrom || undefined}
                onChange={setShiftTo}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* --- Device History Modal --- */}
      {showHistoryModal && (
        <Modal
          title="Device Log History"
          icon="solar:smartphone-outline"
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

/* ================= Sub-components ================= */
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

function DateField({ label, value, onChange, min }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  return (
    <div>
      <label className="text-[11px] text-gray-500 block mb-1.5">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs text-gray-700 cursor-pointer focus:bg-white focus:border-gray-900 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <button
          type="button"
          onClick={openPicker}
          tabIndex={-1}
          aria-label={`Open ${label} calendar`}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
        >
          <Icon icon="solar:calendar-outline" className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  icon,
  onClose,
  width = "340px",
  footer,
  children,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="p-2 bg-slate-100 rounded-lg">
                <Icon icon={icon} className="w-5 h-5 text-black" />
              </span>
            )}
            <div>
              <h3 className="text-[16px] text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="text-gray-400 hover:text-black transition-colors"
            onClick={onClose}
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
