import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import { FiSearch, FiMoreHorizontal } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getActiveUsersLight } from "../service/employeeService";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

// Photo if available, otherwise first letter of the first name
const UserAvatar = ({ name, image, seed }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  const firstName = (name || "").trim().split(/\s+/)[0] || "";
  const initial = firstName.charAt(0).toUpperCase() || "?";
  const color = AVATAR_COLORS[(Number(seed) || 0) % AVATAR_COLORS.length];

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name}
        className="w-14 h-14 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-semibold ${color}`}
    >
      {initial}
    </div>
  );
};

function ManageInsurancePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;
  const navigate = useNavigate();

  // Fetch active users (light API)
  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const list = await getActiveUsersLight(); // already returns the array
        if (!cancelled) setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) toast.error("Failed to load employees");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    // API sends 0001-01-01 when the joining date is not set
    if (isNaN(date.getTime()) || date.getFullYear() <= 1) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      return (
        (user.name || "").toLowerCase().includes(term) ||
        String(user.uuid || "")
          .toLowerCase()
          .includes(term) ||
        (user.department_name || "").toLowerCase().includes(term) ||
        (user.designation_name || "").toLowerCase().includes(term) ||
        String(user.phone || "").includes(term) ||
        (user.email || "").toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentData = filteredData.slice(startIdx, endIdx);

  const openDetails = (user) => {
    const uniqueId = user.uuid || user.id;
    navigate(`/insurance-details/${uniqueId}`, {
      state: {
        employeeImage: user.image || "",
        employeeName: user.name,
        employee: user, // full light-API record for the info card
      },
    });
  };

  const renderEmployeeCard = (user) => (
    <div
      key={user.id}
      onClick={() => openDetails(user)}
      className="bg-white rounded-2xl flex flex-col justify-between h-full transition p-3.5 hover:shadow-md cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <UserAvatar name={user.name} image={user.image} seed={user.id} />
        </div>

        <div className="flex items-center space-x-2">
          {/* Light API returns active users only */}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Active
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDetails(user);
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiMoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-medium text-gray-800 capitalize">
          {user.name || "N/A"}
        </h3>
        <p className="text-[10px] text-gray-500">
          {user.designation_name || "N/A"}
        </p>
      </div>

      <div className="flex flex-col text-gray-600 bg-gray-50 p-2 rounded-lg mt-2">
        <div className="flex justify-between">
          <span className="text-[10px] text-gray-700">Department</span>
          <span className="text-[10px] text-gray-700">Date of Joining</span>
        </div>

        <div className="flex justify-between mt-0.5">
          <span className="text-[12px] text-black">
            {user.department_name || "N/A"}
          </span>
          <span className="text-[12px] text-black font-medium">
            {formatDate(user.date_of_join)}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[12px] text-gray-800 mt-1.5 border-t border-gray-100 pt-1">
          <Icon icon="solar:phone-linear" className="text-gray-500 w-4 h-4" />
          <span>{user.phone || "N/A"}</span>
        </div>

        <div className="flex items-center space-x-2 text-[12px] text-gray-800">
          <Icon icon="mage:email" className="text-gray-500 w-4 h-4" />
          <span className="truncate max-w-[22ch]">{user.email || "N/A"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-6 pb-6">
          <HeaderGlobal userName="Admin" />

          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h1 className="text-xl font-medium text-gray-800">Insurance</h1>
          </div>

          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <span className="text-gray-700 font-medium text-[14px]">
              {loading
                ? "Loading..."
                : `${filteredData.length} Total Employees`}
            </span>

            <div className="flex items-center space-x-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center text-gray-500 py-10">
                Loading records...
              </div>
            ) : currentData.length > 0 ? (
              currentData.map(renderEmployeeCard)
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No records to display.
              </div>
            )}
          </div>

          {filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-2 py-3 text-[12.5px] bg-white rounded-lg border border-gray-200 mt-4">
              <span className="text-gray-500">
                Showing {startIdx + 1}-{Math.min(endIdx, filteredData.length)}{" "}
                of {filteredData.length}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 border border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 border border-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ManageInsurancePage;
