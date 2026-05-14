import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FiBell, FiSearch, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi";
import {
  fetchDashboard,
  fetchAssets,
  removeAsset,
} from "../../service/assetservice";
import toast from "react-hot-toast";

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
          font-weight: 100;
          font-family: "Poppins", sans-serif;
          font-size: 12px;
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
        render: (val) => (val ? new Date(val).toLocaleDateString() : "—"),
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
              className={`px-3 py-1 rounded-full text-[12px] border ${
                isAllocated
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-sky-50 text-sky-700 border-sky-100"
              }`}
            >
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
    <>
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, data: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.data?.asset_name || "this asset"}
      />

      <div className="bg-white flex justify-between items-center p-4 mb-4 shadow-sm rounded-lg">
        <h1 className="text-lg text-gray-800 font-medium">
          Physical Asset Inventory
        </h1>
        <div className="flex items-center gap-3">
          <GlowButton onClick={() => setIsCreateOpen(true)}>
            <FiPlus /> Add Physical Asset
          </GlowButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: dashboardData?.total_assets,
            color: "text-blue-600",
          },
          {
            label: "Allocated",
            value: dashboardData?.allocated_assets,
            color: "text-emerald-600",
          },
          {
            label: "Available",
            value: dashboardData?.unallocated_assets,
            color: "text-sky-600",
          },
          {
            label: "Maintenance",
            value: dashboardData?.assets_under_maintanance,
            color: "text-red-600",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>
              {isLoading ? "..." : stat.value || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <div className="flex gap-6 text-sm">
            {["all", "Allocated", "available"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`pb-2 capitalize transition-all relative ${
                  activeStatus === status
                    ? "text-black font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black "
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {status === "available" ? "Unallocated" : status}
              </button>
            ))}
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black w-64"
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
    </>
  );
}

export default PhysicalAssetTab;
