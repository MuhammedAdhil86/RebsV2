import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../ui/pagelayout";
import avatar from "../assets/img/avatar.svg";
import {
  FiBell,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiAlertCircle,
} from "react-icons/fi";
import { MoreHorizontal } from "lucide-react";
import UniversalTable from "../ui/universal_table";
import { fetchJobEnquiries, moveToReview } from "../service/hiringService";
import ApplicationDetail from "../ui/viewapplication";
import toast, { Toaster } from "react-hot-toast";

const JobEnquiry = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [enquiryData, setEnquiryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedApplication, setSelectedApplication] = useState(null);

  const menuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchJobEnquiries();
      setEnquiryData(data || []);
    } catch (err) {
      setError(true);
      toast.error("Server connection issue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewApplication = async (app) => {
    setOpenMenuId(null);
    if (
      app.status === "under_review" ||
      app.status === "completion_mail_sent"
    ) {
      setSelectedApplication(app);
      return;
    }

    const loadingToast = toast.loading("Opening and updating status...");
    try {
      const result = await moveToReview(app.id);
      if (result.status_code === 200) {
        toast.success("Status updated to Under Review", { id: loadingToast });
        const updatedApp = { ...app, status: "under_review" };
        setSelectedApplication(updatedApp);
        loadData();
      } else {
        toast.error("Status update failed, opening anyway...", {
          id: loadingToast,
        });
        setSelectedApplication(app);
      }
    } catch (err) {
      toast.error("Network error.", { id: loadingToast });
      setSelectedApplication(app);
    }
  };

  const handleOpenMenu = (e, id) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX - 150,
    });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const columns = [
    {
      label: "Date",
      key: "applied_date",
      width: 130,
      render: (val) => (val ? new Date(val).toLocaleDateString() : "N/A"),
    },
    {
      label: "Candidate",
      key: "first_name",
      width: 220,
      render: (_, row) => (
        <div className="flex flex-col items-center">
          <span className="font-medium text-gray-800">{`${row.first_name} ${row.last_name}`}</span>
          <span className="text-[10px] text-gray-400">{row.email}</span>
        </div>
      ),
    },
    {
      label: "Area of Work",
      key: "area_of_work",
      width: 150,
      render: (val) => (
        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-[10px] uppercase font-bold border border-gray-100">
          {val || "General"}
        </span>
      ),
    },
    { label: "Position", key: "position_applied", width: 150 },
    {
      label: "Source",
      key: "source",
      width: 100,
      render: (val) => (
        <span className="capitalize text-gray-500">{val || "Direct"}</span>
      ),
    },
    {
      label: "Action",
      key: "action",
      width: 80,
      render: (_, row) => (
        <div className="flex justify-center">
          <button
            onClick={(e) => handleOpenMenu(e, row.id)}
            className={`p-2 rounded-full transition-colors ${openMenuId === row.id ? "bg-gray-100" : "hover:bg-gray-50"}`}
          >
            <MoreHorizontal size={18} className="text-gray-600" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = enquiryData.filter((item) =>
    Object.values(item).some((val) =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  return (
    <DashboardLayout userName="Admin">
      <Toaster position="top-right" />
      <div className="bg-white flex justify-between items-center p-3 mb-2 rounded-xl">
        <h1 className="text-[15px] font-medium text-gray-800">Job Enquiries</h1>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 cursor-pointer">
            <FiBell className="text-gray-600 text-lg" />
          </div>
          <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden">
            <img
              src={avatar}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {!selectedApplication ? (
        <>
          <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#f9fafb] border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all"
              />
            </div>
            <span className="text-[11px] text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              Total: {filteredData.length}
            </span>
          </div>
          <div className="bg-white rounded-b-2xl shadow-sm min-h-[450px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <FiAlertCircle className="text-red-400 text-4xl" />
                <button
                  onClick={loadData}
                  className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase"
                >
                  Retry
                </button>
              </div>
            ) : (
              <UniversalTable
                columns={columns}
                data={filteredData}
                rowsPerPage={8}
                rowClickHandler={() => setOpenMenuId(null)}
              />
            )}
          </div>
        </>
      ) : (
        /* ✅ Logic switched to the separate file component */
        <ApplicationDetail
          application={selectedApplication}
          onBack={() => setSelectedApplication(null)}
        />
      )}

      {openMenuId && (
        <div
          ref={menuRef}
          className="fixed w-44 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] py-1 animate-in fade-in zoom-in duration-100"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
              Manage
            </p>
          </div>
          <button
            onClick={() =>
              handleViewApplication(
                enquiryData.find((i) => i.id === openMenuId),
              )
            }
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiEye className="text-gray-400" /> View Application
          </button>
          <button
            onClick={() => {
              setOpenMenuId(null);
              toast("Updating status manually...");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="text-gray-400" /> Update Status
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JobEnquiry;
