import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Loader2,
  MapPin,
  LocateFixed,
} from "lucide-react";

import UniversalTable from "../../../ui/universal_table";
import GlowButton from "../../../components/helpers/glowbutton";
import DeleteConfirmationModal from "../../../ui/deletemodal";
import {
  getBranchData,
  editBranch,
  deleteBranch,
} from "../../../service/companyService";
import MapModal from "../../../utils/mapmodel";

/* ---------- UNIVERSAL MODAL COMPONENT ---------- */
function UniversalModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-[540px]",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px] p-4">
      <div
        className={`bg-white w-[95%] ${maxWidth} rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20`}
      >
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-400 text-[10px] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------- REVERSE GEO LOCATION ---------- */
const getPlaceName = async (latitude, longitude) => {
  if (!latitude || !longitude) return "-";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      { headers: { "User-Agent": "BranchViewApp" } },
    );
    const data = await response.json();
    return data.display_name || "-";
  } catch (error) {
    console.error("Error fetching location:", error);
    return "-";
  }
};

/* ---------- PORTAL ACTION MENU ---------- */
function ActionMenuPortal({ row, onEdit, onDeleteClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right + window.scrollX - 128,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleDismissOnScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", handleDismissOnScrollOrResize, true);
      window.addEventListener("resize", handleDismissOnScrollOrResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleDismissOnScrollOrResize, true);
      window.removeEventListener("resize", handleDismissOnScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="flex justify-center items-center w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        aria-label="Actions"
        className="p-1.5 rounded-md hover:bg-gray-200/70 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              zIndex: 9999,
            }}
            className="w-32 bg-white border border-gray-100 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-75 select-none"
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit(row);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-500" />
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDeleteClick(row);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */
const BranchView = () => {
  const [branchData, setBranchData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [locations, setLocations] = useState({});
  const [revealed, setRevealed] = useState({});
  const [loadingLocations, setLoadingLocations] = useState({});
  const [mapModal, setMapModal] = useState(null);

  // Edit State
  const [editModalData, setEditModalData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------- FETCH BRANCH DATA ---------- */
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await getBranchData();
      setBranchData(data || []);
    } catch (error) {
      console.error("Error fetching branch data:", error);
      toast.error(error?.message || error?.error || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  /* ---------- DELETE HANDLERS ---------- */
  const handleOpenDelete = (branch) => {
    setDeleteTarget(branch);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      const res = await deleteBranch(deleteTarget.id);
      toast.success(res?.message || "Branch deleted successfully");
      setBranchData((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || err?.error || err?.detail || "Delete failed");
    }
  };

  /* ---------- EDIT MODAL OPEN ---------- */
  const handleOpenEdit = (branch) => {
    setEditModalData({
      id: branch.id,
      name: branch.name || "",
      code: branch.code || "",
      description: branch.description || "",
      time_zone: branch.time_zone || "Asia/Kolkata",
      longitude: String(branch.longitude || ""),
      latitude: String(branch.latitude || ""),
      address: branch.address || "",
      location: branch.location || "",
    });
  };

  /* ---------- GEOLOCATION AUTO-FETCH ---------- */
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        setEditModalData((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
        }));

        setFetchingGps(false);
        toast.success("Location coordinates fetched!");
      },
      (error) => {
        setFetchingGps(false);
        toast.error(error.message || "Failed to fetch GPS coordinates");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  /* ---------- UPDATE HANDLER ---------- */
  const handleUpdateSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsUpdating(true);

    const { id, ...payload } = editModalData;

    try {
      const res = await editBranch(id, payload);
      toast.success(res?.message || "Branch updated successfully");
      setBranchData((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...payload } : b)),
      );
      setEditModalData(null);
    } catch (err) {
      toast.error(err?.message || err?.error || err?.detail || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ---------- LOCATION HANDLERS ---------- */
  const handleSeeLocation = async (branchId, latitude, longitude) => {
    if (!locations[branchId]) {
      setLoadingLocations((p) => ({ ...p, [branchId]: true }));
      const place = await getPlaceName(latitude, longitude);
      setLocations((p) => ({ ...p, [branchId]: place }));
      setLoadingLocations((p) => ({ ...p, [branchId]: false }));
    }
    setRevealed((p) => ({ ...p, [branchId]: true }));
  };

  const handleViewMap = (latitude, longitude, name) => {
    setMapModal({
      latitude,
      longitude,
      branchName: name,
    });
  };

  /* ---------- TABLE DATA ---------- */
  const tableData = branchData.map((branch) => ({
    ...branch,
    locationData: {
      latitude: branch.latitude,
      longitude: branch.longitude,
      revealed: revealed[branch.id],
      loading: loadingLocations[branch.id],
      text: locations[branch.id],
      id: branch.id,
      name: branch.name,
    },
  }));

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      key: "name",
      label: "Branch Name",
      align: "left",
      headerAlign: "left",
      render: (value) => (
        <div title={value} className="text-gray-800 font-normal">
          {value?.length > 19 ? value.slice(0, 19) + "..." : value}
        </div>
      ),
    },
    {
      key: "locationData",
      label: "Location",
      align: "left",
      headerAlign: "left",
      render: (val) => {
        if (!val.latitude || !val.longitude) return "-";

        if (val.revealed) {
          if (val.loading)
            return (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            );

          return (
            <div className="flex flex-col">
              <div className="overflow-hidden max-w-[200px]">
                <div className="whitespace-nowrap hover:animate-marquee text-gray-700">
                  {val.text || "-"}
                </div>
              </div>

              <button
                type="button"
                className="text-blue-600 underline mt-1 text-left cursor-pointer"
                onClick={() =>
                  handleViewMap(val.latitude, val.longitude, val.name)
                }
              >
                View Map
              </button>
            </div>
          );
        }

        return (
          <button
            type="button"
            className="text-blue-600 underline cursor-pointer"
            onClick={() =>
              handleSeeLocation(val.id, val.latitude, val.longitude)
            }
          >
            See Location
          </button>
        );
      },
    },
    {
      key: "code",
      label: "Branch Code",
      align: "center",
      headerAlign: "center",
      render: (val) => <div className="text-center w-full">{val ?? "—"}</div>,
    },
    {
      key: "address",
      label: "Address",
      align: "left",
      headerAlign: "left",
      render: (value = "") => (
        <div className="relative group max-w-[150px]">
          <span className="text-gray-600">
            {value.length > 10 ? value.slice(0, 10) + "..." : value || "—"}
          </span>
          {value.length > 10 && (
            <div
              className="absolute left-0 bottom-full mb-1 hidden group-hover:block 
                          bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg 
                          max-w-xs break-words z-10"
            >
              {value}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: 80,
      align: "center",
      headerAlign: "center",
      render: (_, row) => (
        <ActionMenuPortal
          row={row}
          onEdit={handleOpenEdit}
          onDeleteClick={handleOpenDelete}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto mt-5 font-poppins">
        <div className="flex justify-between items-center py-2">
          <h3 className="text-base font-medium text-gray-800">Branches</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : (
          <UniversalTable columns={columns} data={tableData} rowsPerPage={6} />
        )}
      </div>

      {/* ---------- EDIT VIA UNIVERSAL MODAL ---------- */}
      <UniversalModal
        isOpen={Boolean(editModalData)}
        onClose={() => setEditModalData(null)}
        title="Edit Branch"
        subtitle="Update branch details and location coordinates"
        maxWidth="max-w-[540px]"
      >
        {editModalData && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {/* Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Branch"
                  value={editModalData.name}
                  onChange={(e) =>
                    setEditModalData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MB001"
                  value={editModalData.code}
                  onChange={(e) =>
                    setEditModalData((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Location & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kozhikode"
                  value={editModalData.location}
                  onChange={(e) =>
                    setEditModalData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Time Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asia/Kolkata"
                  value={editModalData.time_zone}
                  onChange={(e) =>
                    setEditModalData((prev) => ({
                      ...prev,
                      time_zone: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* GPS Fetch Button Banner */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-[11px] text-gray-600 font-medium">
                  Fetch current GPS coordinates
                </span>
              </div>
              <button
                type="button"
                onClick={handleFetchCurrentLocation}
                disabled={fetchingGps}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {fetchingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{fetchingGps ? "Fetching..." : "Fetch GPS"}</span>
              </button>
            </div>

            {/* Latitude & Longitude Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11.2588"
                  value={editModalData.latitude}
                  onChange={(e) =>
                    setEditModalData((prev) => ({
                      ...prev,
                      latitude: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  placeholder="e.g. 75.7804"
                  value={editModalData.longitude}
                  onChange={(e) =>
                    setEditModalData((prev) => ({
                      ...prev,
                      longitude: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Main office branch"
                value={editModalData.description}
                onChange={(e) =>
                  setEditModalData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Address
              </label>
              <textarea
                rows={3}
                placeholder="e.g. 123 Main Road, Kozhikode, Kerala"
                value={editModalData.address}
                onChange={(e) =>
                  setEditModalData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <GlowButton type="submit" onClick={handleUpdateSubmit}>
                {isUpdating ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Save Changes"
                )}
              </GlowButton>
            </div>
          </form>
        )}
      </UniversalModal>

      {/* ---------- DELETE CONFIRMATION MODAL ---------- */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name || "Branch"}
      />

      {/* ---------- MAP MODAL ---------- */}
      {mapModal && (
        <MapModal
          latitude={mapModal.latitude}
          longitude={mapModal.longitude}
          employeeName={mapModal.branchName}
          onClose={() => setMapModal(null)}
        />
      )}

      {/* ---------- MARQUEE ANIMATION ---------- */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .hover\\:animate-marquee:hover {
          animation: marquee 5s linear infinite;
        }
      `}</style>
    </>
  );
};

export default BranchView;
