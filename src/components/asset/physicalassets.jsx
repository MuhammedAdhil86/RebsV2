import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FiBell, FiSearch, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi";
import {
  fetchDashboard,
  fetchAssets,
  removeAsset,
} from "../../service/assetservice";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";

import AssetTable from "./assettable";
import AssetDetailDrawer from "./assetdeatailsdrawer";
import CreateAssetDrawer from "./createasset";
import UpdateAssetDrawer from "./updateassetdrawer";
import UniversalActionMenu from "./universalmenu";
import DeleteConfirmationModal from "../../ui/deletemodal";

// --- GLOW BUTTON COMPONENT ---
function GlowButton({ children = "Edit in Chat", onClick }) {
  return (
    <>
      <button className="chat-btn" onClick={onClick}>
        <span className="label">{children}</span>
        <span className="glow" />
      </button>

      <style>{`
        .chat-btn {
          position: relative;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 400;
          font-family: "Poppins", sans-serif;
          font-size: 12px;
          letter-spacing: 0.02em;
          background: linear-gradient(180deg, #14161c, #0d0f14);
          color: white;
          overflow: visible;
          cursor: pointer;
          transition: transform 180ms cubic-bezier(.22, .61, .36, 1);
        }
        .chat-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 0px 0px 3px 0px;
          border-radius: inherit;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          transition: padding 180ms cubic-bezier(.22, .61, .36, 1);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .chat-btn:hover::before { padding: 1px 1px 5px 1px; }
        .chat-btn:hover .glow { opacity: 0.8; filter: blur(18px); }
        .glow {
          position: absolute; left: 12%; right: 12%; bottom: -8px; height: 10px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          filter: blur(16px); opacity: 0.55;
          transition: opacity 180ms ease, filter 180ms ease;
        }
        @keyframes slide { from { background-position: 0% 0; } to { background-position: 300% 0; } }
        .label { position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; }
      `}</style>
    </>
  );
}

// --- MAIN TAB COMPONENT ---
function PhysicalAssetTab() {
  const [assets, setAssets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, data: null });

  const handleRequestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetData, stats] = await Promise.all([
        fetchAssets(),
        fetchDashboard(),
      ]);

      // LOGIC: If this is the PHYSICAL tab, we exclude "DIGITAL ASSET"
      // If you want to show ALL 5 assets, remove the .filter() and just use setAssets(assetData)
      const physicalOnly = Array.isArray(assetData)
        ? assetData.filter((a) => a.asset_type !== "DIGITAL ASSET")
        : [];

      setAssets(physicalOnly);
      setDashboardData(stats);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load inventory data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmDelete = async () => {
    const row = deleteModal.data;
    if (!row) return;

    setDeleteModal({ isOpen: false, data: null });
    const loadingToast = toast.loading("Deleting asset...");

    try {
      await removeAsset(row.id);
      toast.success("Asset deleted successfully", { id: loadingToast });
      loadData();
    } catch (err) {
      toast.error("Deletion failed", { id: loadingToast });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "asset_name",
        label: "Asset Name",
        align: "center",
        sortable: true,
        onSort: () => handleRequestSort("asset_name"),
      },
      {
        key: "asset_type",
        label: "Type",
        align: "center",
        sortable: true,
        onSort: () => handleRequestSort("asset_type"),
      },
      { key: "condition", label: "Condition", align: "center" },
      {
        key: "purchase_date",
        label: "Purchase Date",
        align: "center",
        sortable: true,
        onSort: () => handleRequestSort("purchase_date"),
        render: (val) =>
          val ? (
            <span className="inline-flex items-center gap-1.5 text-gray-600 font-normal">
              <Icon
                icon="solar:calendar-outline"
                className="w-4 h-4 text-gray-400"
              />
              {new Date(val).toLocaleDateString()}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "staff_name",
        label: "Staff Name",
        align: "center",
        render: (val) => val || "—",
      },
      {
        key: "asset_status",
        label: "Status",
        align: "center",
        render: (val) => {
          // Normalize to lowercase to catch both 'allocated' and 'Allocated'
          const isAllocated = val?.toLowerCase() === "allocated";
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-normal border ${
                isAllocated
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-sky-50 text-sky-700 border-sky-100"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAllocated ? "bg-emerald-500" : "bg-sky-500"
                }`}
              />
              {isAllocated ? "Allocated" : "Unallocated"}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: "Action",
        align: "center",
        render: (_, row) => (
          <UniversalActionMenu
            row={row}
            actions={[
              {
                label: "Edit Asset",
                icon: <FiEdit3 size={16} />,
                onClick: (rowData) => {
                  setEditingAsset(rowData);
                  setIsUpdateOpen(true);
                },
              },
              {
                label: "Delete Asset",
                icon: <FiTrash2 size={16} />,
                onClick: (rowData) =>
                  setDeleteModal({ isOpen: true, data: rowData }),
                isDelete: true,
              },
            ]}
          />
        ),
      },
    ],
    [sortConfig],
  );

  const processedAssets = useMemo(() => {
    let filtered = assets.filter((asset) => {
      const status = asset.asset_status?.toLowerCase();
      const isAllocated = status === "allocated";

      const statusMatch =
        activeStatus === "all" ||
        (activeStatus === "Allocated" && isAllocated) ||
        (activeStatus === "available" && !isAllocated);
      if (!statusMatch) return false;

      const term = searchQuery.toLowerCase().trim();
      if (!term) return true;

      return Object.values(asset).some(
        (val) => val && val.toString().toLowerCase().includes(term),
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [assets, activeStatus, searchQuery, sortConfig]);

  return (
    <div className="font-['Poppins',sans-serif] font-normal">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, data: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.data?.asset_name || "this asset"}
      />

      {/* Page title bar */}
      <div className="bg-white flex justify-between items-center px-5 py-4 mb-4 shadow-sm rounded-xl border border-gray-100">
        <h1 className="text-[17px] text-gray-800 font-normal tracking-wide">
          Physical Asset Inventory
        </h1>
        <div className="flex items-center gap-3">
          <GlowButton onClick={() => setIsCreateOpen(true)}>
            <FiPlus /> Add Physical Asset
          </GlowButton>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: dashboardData?.total_assets,
            color: "text-blue-600",
            bar: "bg-blue-500",
            tint: "bg-blue-50/60",
          },
          {
            label: "Allocated",
            value: dashboardData?.allocated_assets,
            color: "text-emerald-600",
            bar: "bg-emerald-500",
            tint: "bg-emerald-50/60",
          },
          {
            label: "Available",
            value: dashboardData?.unallocated_assets,
            color: "text-sky-600",
            bar: "bg-sky-500",
            tint: "bg-sky-50/60",
          },
          {
            label: "Maintenance",
            value: dashboardData?.assets_under_maintanance,
            color: "text-red-600",
            bar: "bg-red-500",
            tint: "bg-red-50/60",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <span
              className={`absolute left-0 top-0 h-full w-[3px] ${stat.bar}`}
            />
            <div
              className={`absolute -right-6 -top-6 w-20 h-20 rounded-full ${stat.tint}`}
            />
            <p className="relative text-[13px] text-gray-400 mb-1 font-normal tracking-wide">
              {stat.label}
            </p>
            <p
              className={`relative text-[28px] leading-tight font-normal ${stat.color}`}
            >
              {isLoading ? "..." : stat.value || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
          <div className="flex gap-2 text-[13px]">
            {["all", "Allocated", "available"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`relative px-4 py-2 capitalize font-normal tracking-wide rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
                  activeStatus === status
                    ? "text-indigo-600 bg-indigo-50/70 after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-indigo-600"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {status === "available" ? "Unallocated" : status}
              </button>
            ))}
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-normal outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 w-64"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <AssetTable
          columns={columns}
          data={processedAssets}
          onRowClick={(row) => setSelectedAsset(row)}
          sortConfig={sortConfig}
        />
      </div>

      <CreateAssetDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAssetCreated={loadData}
      />
      <UpdateAssetDrawer
        open={isUpdateOpen}
        asset={editingAsset}
        onClose={() => {
          setIsUpdateOpen(false);
          setEditingAsset(null);
        }}
        onAssetUpdated={loadData}
      />
      <AssetDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onRefresh={loadData}
      />
    </div>
  );
}

export default PhysicalAssetTab;
