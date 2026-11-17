import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FiSearch, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi";
import {
  fetchDashboard,
  fetchAssets,
  removeAsset,
} from "../../service/assetservice";
import { toast } from "react-toastify";
import { showApiSuccess, showApiError } from "../../utils/apiToast";
import { Icon } from "@iconify/react";

import AssetTable from "./assettable";
import AssetDetailDrawer from "./assetdeatailsdrawer";
import CreateAssetDrawer from "./createasset";
import UpdateAssetDrawer from "./updateassetdrawer";
import UniversalActionMenu from "./universalmenu";
import DeleteConfirmationModal from "../../ui/deletemodal";

// --- GLOW BUTTON COMPONENT (same as dashboard) ---
function GlowButton({ children, onClick }) {
  return (
    <button
      type="button"
      className="chat-btn relative overflow-visible rounded-lg px-5 py-3 text-xs font-poppins font-normal bg-black text-white flex items-center gap-2"
      onClick={onClick}
    >
      {children}
      <span className="glow" />
      <style>{`
        .chat-btn { position: relative; overflow: visible; cursor: pointer; transition: transform 180ms cubic-bezier(.22, .61, .36, 1); }
        .chat-btn::before { content: ""; position: absolute; inset: 0; padding: 0px 0px 3px 0px; border-radius: 8px; background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff); background-size: 300% 100%; animation: slide 3s linear infinite; transition: padding 180ms cubic-bezier(.22, .61, .36, 1); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
        .chat-btn:hover::before { padding: 1px 1px 5px 1px; }
        .glow { position: absolute; left: 12%; right: 12%; bottom: -8px; height: 10px; border-radius: 9999px; background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff); background-size: 300% 100%; animation: slide 3s linear infinite; filter: blur(16px); opacity: 0.55; transition: opacity 180ms ease; }
        @keyframes slide { from { background-position: 0% 0; } to { background-position: 300% 0; } }
      `}</style>
    </button>
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
      showApiError(e, "Failed to load inventory data");
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
      const res = await removeAsset(row.id);
      toast.dismiss(loadingToast);
      showApiSuccess(res, "Asset deleted successfully");
      loadData();
    } catch (err) {
      toast.dismiss(loadingToast);
      showApiError(err, "Deletion failed");
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
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal border ${
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

  const damagedCount = assets.filter(
    (a) => a.condition?.toLowerCase() === "damaged",
  ).length;

  const statCards = [
    {
      label: "Total Assets",
      value: dashboardData?.total_assets,
      bg: "#EBFDEF",
      icon: "mdi:package-variant-closed",
    },
    {
      label: "Allocated",
      value: dashboardData?.allocated_assets,
      bg: "#E8EFF9",
      icon: "mdi:account-tick-outline",
    },
    {
      label: "Available",
      value: dashboardData?.unallocated_assets,
      bg: "#FFEFE7",
      icon: "mdi:cube-outline",
    },
    {
      label: "Maintenance",
      value: dashboardData?.assets_under_maintanance,
      bg: "#FFFBDB",
      icon: "mdi:wrench-outline",
    },
    {
      label: "Damaged",
      value: damagedCount,
      bg: "#FFDADA",
      icon: "mdi:alert-circle-outline",
    },
  ];

  return (
    <div className="font-['Poppins',sans-serif] font-normal">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, data: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.data?.asset_name || "this asset"}
      />

      {/* Page header (same as dashboard) */}
      <div className="w-full mt-4 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-lg sm:text-2xl font-medium">
            Physical Asset Inventory
          </p>
          <p className="text-xs text-gray-400 font-normal">
            Track and manage all physical assets here
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GlowButton onClick={() => setIsCreateOpen(true)}>
            <FiPlus className="w-4 h-4" /> Add Physical Asset
          </GlowButton>
        </div>
      </div>

      {/* KPI cards (same as dashboard) */}
      <section className="grid px-4 grid-cols-2 sm:grid-cols-5 gap-4 w-full mt-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="shadow-sm rounded-lg p-3 flex items-center gap-3 transition-all relative cursor-default"
            style={{ backgroundColor: stat.bg }}
          >
            <div className="flex items-center justify-center min-w-10 h-10 rounded-full bg-black text-white">
              <Icon icon={stat.icon} className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-gray-500 text-xs truncate uppercase font-medium">
                {stat.label}
              </p>
              <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                {isLoading ? "..." : (stat.value ?? 0)}
              </h2>
            </div>
          </div>
        ))}
      </section>

      {/* Table card */}
      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
          <div className="flex gap-2 text-sm">
            {["all", "Allocated", "available"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`relative px-4 py-2 capitalize font-normal tracking-wide rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 ${
                  activeStatus === status
                    ? "text-black bg-gray-50/70 after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-black"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {status === "available" ? "Unallocated" : status}
              </button>
            ))}
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-gray-700" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-normal outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-200 w-64"
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
