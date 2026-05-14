import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FiSearch, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi"; // Added FiEdit3
import toast from "react-hot-toast";

import {
  fetchDigitalDashboard,
  fetchDigitalAssets,
  removeDigitalAsset,
} from "../../service/assetservice";

import AssetTable from "./assettable";
import DigitalAssetDetailDrawer from "./digitalaseestdetails";
import CreateDigitalAssetDrawer from "./createdigitalasset";
import UpdateDigitalAssetDrawer from "./updatedigitalassetdrawer";
import UniversalActionMenu from "./universalmenu";
import DeleteConfirmationModal from "../../ui/deletemodal";

// --- GLOW BUTTON COMPONENT ---
function GlowButton({ children, onClick }) {
  return (
    <>
      <button className="chat-btn" onClick={onClick}>
        <span className="label">{children}</span>
        <span className="glow" />
      </button>

      <style>{`
        .chat-btn {
          position: relative; padding: 10px 20px; border: none; border-radius: 8px;
          font-family: "Poppins", sans-serif; font-size: 12px;
          background: linear-gradient(180deg, #14161c, #0d0f14); color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .chat-btn::before {
          content: ""; position: absolute; inset: 0; padding: 0px 0px 3px 0px; border-radius: inherit;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%; animation: slide 3s linear infinite;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
        }
        .chat-btn:hover .glow { opacity: 0.8; filter: blur(18px); }
        .glow {
          position: absolute; left: 12%; right: 12%; bottom: -8px; height: 10px; border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%; animation: slide 3s linear infinite; filter: blur(16px);
          opacity: 0.55; transition: opacity 180ms ease, filter 180ms ease;
        }
        @keyframes slide { from { background-position: 0% 0; } to { background-position: 300% 0; } }
        .label { position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; }
      `}</style>
    </>
  );
}

// --- MAIN TAB COMPONENT ---
function DigitalAssetTab() {
  const [assets, setAssets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Drawer visibility states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // Data states
  const [selectedAsset, setSelectedAsset] = useState(null); // For Details
  const [editingAsset, setEditingAsset] = useState(null); // For Update

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, data: null });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const assetRes = await fetchDigitalAssets();
      const statsRes = await fetchDigitalDashboard();
      const assetsArray = Array.isArray(assetRes)
        ? assetRes
        : assetRes?.data || [];
      setAssets(assetsArray);
      setDashboardData(statsRes?.data || statsRes);
    } catch (err) {
      toast.error("Failed to fetch digital assets");
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
    const loadingToast = toast.loading("Removing asset...");
    try {
      const targetId = row.id || row._id;
      await removeDigitalAsset(targetId);
      toast.success("Asset deleted successfully", { id: loadingToast });
      loadData();
    } catch (err) {
      toast.error("Deletion failed", { id: loadingToast });
    }
  };

  const processedAssets = useMemo(() => {
    return assets.filter((asset) => {
      const isAllocated =
        (asset.account_status || "").toLowerCase() === "allocated";
      const statusMatch =
        activeStatus === "all" ||
        (activeStatus === "Allocated" && isAllocated) ||
        (activeStatus === "available" && !isAllocated);
      if (!statusMatch) return false;
      const term = searchQuery.toLowerCase().trim();
      return (
        !term ||
        Object.values(asset).some((v) =>
          v?.toString().toLowerCase().includes(term),
        )
      );
    });
  }, [assets, activeStatus, searchQuery]);

  const columns = useMemo(
    () => [
      {
        key: "created_date",
        label: "Created Date",
        align: "center",
        render: (val) => (val ? new Date(val).toLocaleDateString() : "—"),
      },
      {
        key: "account_name",
        label: "Account Name",
        align: "center",
        render: (val) => val || "Unnamed",
      },
      {
        key: "account_type",
        label: "Type",
        align: "center",
        render: (val) => val || "—",
      },
      {
        key: "username",
        label: "Login User",
        align: "center",
        render: (val) => val || "—",
      },
      {
        key: "staff_name",
        label: "Staff Name",
        align: "center",
        render: (val) => val || "Unassigned",
      },
      {
        key: "account_status",
        label: "Status",
        align: "center",
        render: (val) => {
          const isAllocated = (val || "").toLowerCase() === "allocated";
          return (
            <span
              className={`px-3 py-1 rounded-full text-[12px] border ${isAllocated ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-sky-50 text-sky-700 border-sky-100"}`}
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
    [loadData],
  );

  return (
    <>
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, data: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.data?.account_name || "this asset"}
      />

      <div className="bg-white flex justify-between items-center p-4 mb-4 shadow-sm rounded-lg">
        <h1 className="text-lg text-gray-800 font-medium">
          Digital Asset Inventory
        </h1>
        <GlowButton onClick={() => setIsCreateOpen(true)}>
          <FiPlus /> Add Digital Asset
        </GlowButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total",
            val: dashboardData?.total_accounts,
            color: "text-blue-600",
          },
          {
            label: "Allocated",
            val: dashboardData?.allocated_accounts,
            color: "text-emerald-600",
          },
          {
            label: "Available",
            val: dashboardData?.available_accounts,
            color: "text-sky-600",
          },
          {
            label: "Unallocated",
            val: dashboardData?.unallocated_accounts,
            color: "text-red-600",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>
              {isLoading ? "..." : s.val || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <div className="flex gap-6 text-sm">
            {["all", "Allocated", "available"].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`pb-2 capitalize relative ${activeStatus === s ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black" : "text-gray-400"}`}
              >
                {s === "available" ? "Unallocated" : s}
              </button>
            ))}
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none w-64 focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
        <AssetTable
          columns={columns}
          data={processedAssets}
          onRowClick={setSelectedAsset}
        />
      </div>

      <DigitalAssetDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onRefresh={loadData}
      />
      <CreateDigitalAssetDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAssetCreated={loadData}
      />

      {/* UPDATE DRAWER */}
      <UpdateDigitalAssetDrawer
        open={isUpdateOpen}
        asset={editingAsset}
        onClose={() => {
          setIsUpdateOpen(false);
          setEditingAsset(null);
        }}
        onAssetUpdated={loadData}
      />
    </>
  );
}

export default DigitalAssetTab;
