import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FiSearch, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi"; // Added FiEdit3
import { Icon } from "@iconify/react";
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
          font-weight: 400; letter-spacing: 0.02em;
          font-family: "Poppins", sans-serif; font-size: 12px;
          background: linear-gradient(180deg, #14161c, #0d0f14); color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          overflow: visible;
          transition: transform 180ms cubic-bezier(.22, .61, .36, 1);
        }
        .chat-btn::before {
          content: ""; position: absolute; inset: 0; padding: 0px 0px 3px 0px; border-radius: inherit;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%; animation: slide 3s linear infinite;
          transition: padding 180ms cubic-bezier(.22, .61, .36, 1);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
        }
        .chat-btn:hover::before { padding: 1px 1px 5px 1px; }
        .chat-btn:hover .glow { opacity: 0.8; filter: blur(18px); }
        .glow {
          position: absolute; left: 12%; right: 12%; bottom: -8px; height: 10px; border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%; animation: slide 3s linear infinite; filter: blur(16px);
          opacity: 0.55; transition: opacity 180ms ease, filter 180ms ease;
        }
        @keyframes slide { from { background-position: 0% 0; } to { background-position: 300% 0; } }
        .label { position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; }
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
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-normal border ${isAllocated ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-sky-50 text-sky-700 border-sky-100"}`}
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
    [loadData],
  );

  return (
    <div className="font-['Poppins',sans-serif] font-normal">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, data: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.data?.account_name || "this asset"}
      />

      {/* Page title bar */}
      <div className="bg-white flex justify-between items-center px-5 py-4 mb-4 shadow-sm rounded-xl border border-gray-100">
        <h1 className="text-[17px] text-gray-800 font-normal tracking-wide">
          Digital Asset Inventory
        </h1>
        <GlowButton onClick={() => setIsCreateOpen(true)}>
          <FiPlus /> Add Digital Asset
        </GlowButton>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total",
            val: dashboardData?.total_accounts,
            color: "text-blue-600",
            bar: "bg-blue-500",
            tint: "bg-blue-50/60",
          },
          {
            label: "Allocated",
            val: dashboardData?.allocated_accounts,
            color: "text-emerald-600",
            bar: "bg-emerald-500",
            tint: "bg-emerald-50/60",
          },
          {
            label: "Available",
            val: dashboardData?.available_accounts,
            color: "text-sky-600",
            bar: "bg-sky-500",
            tint: "bg-sky-50/60",
          },
          {
            label: "Unallocated",
            val: dashboardData?.unallocated_accounts,
            color: "text-red-600",
            bar: "bg-red-500",
            tint: "bg-red-50/60",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <span className={`absolute left-0 top-0 h-full w-[3px] ${s.bar}`} />
            <div
              className={`absolute -right-6 -top-6 w-20 h-20 rounded-full ${s.tint}`}
            />
            <p className="relative text-[13px] text-gray-400 mb-1 font-normal tracking-wide">
              {s.label}
            </p>
            <p
              className={`relative text-[28px] leading-tight font-normal ${s.color}`}
            >
              {isLoading ? "..." : s.val || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
          <div className="flex gap-2 text-[13px]">
            {["all", "Allocated", "available"].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`relative px-4 py-2 capitalize font-normal tracking-wide rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
                  activeStatus === s
                    ? "text-indigo-600 bg-indigo-50/70 after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-indigo-600"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {s === "available" ? "Unallocated" : s}
              </button>
            ))}
          </div>
          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-normal outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 w-64"
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
    </div>
  );
}

export default DigitalAssetTab;
