import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import GlowButton from "../components/helpers/glowbutton";
import { startProgressToast } from "../components/helpers/progressbar"; // adjust path
import { getActiveUsersLight } from "../service/employeeService";
import payrollService from "../service/payrollService";

export default function PayslipDownloadModal({
  open,
  onClose,
  month, // month name, e.g. "October"
  monthNumber, // 1-12
  year,
}) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUuid, setSelectedUuid] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load employees each time the modal opens
  useEffect(() => {
    if (!open) return;

    setSearch("");
    setSelectedUuid("");

    (async () => {
      try {
        setLoadingUsers(true);
        const data = await getActiveUsersLight();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setUsers([]);
        toast.error("Failed to load employees", { toastId: "payslip-users" });
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        String(u.uuid || "")
          .toLowerCase()
          .includes(q),
    );
  }, [users, search]);

  const handleClose = () => {
    setSearch("");
    setSelectedUuid("");
    onClose();
  };

  const handleDownload = (e) => {
    if (e) e.preventDefault();

    if (!selectedUuid) {
      return toast.error("Please select an employee", {
        toastId: "payslip-employee",
      });
    }

    // Progress toast (top-right) keeps running after the modal closes
    const task = startProgressToast({
      label: "Generating payslip",
      storageKey: "payslip_duration_ms",
      defaultMs: 8000,
    });

    const payload = {
      month: monthNumber,
      year: Number(year),
      user_id: selectedUuid, // uuid from active users API
    };

    handleClose();

    payrollService
      .downloadPayslip(payload, task.setReal)
      .then(() => task.finish("Payslip downloaded successfully!"))
      .catch((err) => task.fail(err?.message || "Failed to download payslip"));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[480px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              Download Payslip
            </h2>
            <p className="text-gray-400 text-[10px]">
              Payslip for {month} {year}
            </p>
          </div>
          <button type="button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleDownload} className="p-8 overflow-y-auto">
          <div className="space-y-5 min-w-0">
            {/* Employee search + list */}
            <div className="space-y-2">
              <label className="block mb-1 font-medium text-gray-700">
                Employee
              </label>

              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 border p-2.5 rounded-2xl"
                />
              </div>

              <div className="max-h-[240px] overflow-y-auto border rounded-2xl p-2 space-y-1">
                {loadingUsers ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-gray-400" size={18} />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-gray-400">
                    No employees found
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.uuid}
                      className={`flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
                        selectedUuid === u.uuid ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-800 truncate">
                          {u.name}
                        </span>
                        <span className="text-gray-400 text-[10px] truncate">
                          {u.uuid}
                          {u.designation_name ? ` · ${u.designation_name}` : ""}
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="payslip-employee"
                        checked={selectedUuid === u.uuid}
                        onChange={() => setSelectedUuid(u.uuid)}
                        className="accent-black w-4 h-4"
                      />
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <GlowButton
                onClick={handleDownload}
                disabled={!selectedUuid || loadingUsers}
              >
                Download Payslip
              </GlowButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
