import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { Icon } from "@iconify/react";
import rebsLogo from "../assets/img/Picture1.png";
import { useAuthStore } from "../store/authStore"; // Zustand store

const LAST_PATH_KEY = "sidebar:lastPath";

// Module-level: survives SideBar remounts, resets only on a real browser reload.
let restoreChecked = false;

function SideBar({ isCollapsed, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const skipSaveRef = useRef(false);
  const navRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // true only below the md breakpoint (768px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // On mobile the sidebar is never "collapsed" (always shows labels)
  const collapsed = isCollapsed && !isMobile;

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  // 1) On a browser refresh, go back to the saved page instead of the first tab.
  //    (Declared BEFORE the save effect so it reads the old value first.)
  useEffect(() => {
    if (restoreChecked) return;
    restoreChecked = true;

    const navType = performance.getEntriesByType("navigation")[0]?.type;
    const saved = localStorage.getItem(LAST_PATH_KEY);
    const current = location.pathname + location.search;

    if (navType === "reload" && saved && saved !== current) {
      skipSaveRef.current = true; // don't overwrite saved path with the redirected one
      navigate(saved, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2) Save every page visited (ignore login/root)
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (location.pathname !== "/" && location.pathname !== "#") {
      localStorage.setItem(LAST_PATH_KEY, location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  // 2b) Keep the selected menu in view: after reload / route change / opening
  //     the mobile drawer, scroll the sidebar so the active item is centered.
  useEffect(() => {
    const scrollToActive = () => {
      const nav = navRef.current;
      if (!nav) return;
      const active = nav.querySelector('[aria-current="page"]');
      if (!active) return;
      const target =
        active.offsetTop - nav.clientHeight / 2 + active.clientHeight / 2;
      nav.scrollTo({ top: Math.max(target, 0), behavior: "auto" });
    };
    // wait a frame so the active link and layout are ready
    const id = requestAnimationFrame(scrollToActive);
    return () => cancelAnimationFrame(id);
  }, [location.pathname, isMobileOpen, isMobile, collapsed]);

  // 3) Close the mobile drawer after navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout); // Async logout (calls POST /staff/logout)
  const isProcessing = useAuthStore((state) => state.isProcessing); // Loading state for the logout button

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const displayName =
    `${firstName} ${lastName}`.trim() || user?.name || "Admin";

  const avatarUrl =
    user?.image && user.image.trim() !== ""
      ? user.image
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  const userId = user?.id || "";
  const userNameSlug = user
    ? `${user.first_name}-${user.last_name}`.toLowerCase().replace(/\s+/g, "-")
    : "user";

  const icons = {
    hr: <Icon icon="si:dashboard-line" width="20" />,
    muster: <Icon icon="mynaui:table" width="20" />,
    events: <Icon icon="carbon:event" width="20" />,
    email: <Icon icon="ic:outline-email" width="20" />,
    announcement: <Icon icon="lucide:megaphone" width="20" />,
    payroll: <Icon icon="fluent:payment-20-regular" width="20" />,
    reports: <Icon icon="iconoir:reports" width="20" />,
    asset: <Icon icon="fluent:web-asset-16-regular" width="20" />,
    manageEmployees: <Icon icon="clarity:employee-group-line" width="20" />,
    workfromhome: (
      <Icon
        icon="material-symbols-light:home-work-outline-rounded"
        width="20"
      />
    ),
    insurance: <Icon icon="solar:shield-user-outline" width="20" />,
    timesheet: <Icon icon="lucide:calendar-clock" width="20" />,
    organisationonboard: <Icon icon="octicon:organization-24" width="20" />,
    employeeOnboard: <Icon icon="clarity:employee-line" width="20" />,
    Hiring: <Icon icon="hugeicons:job-link" width="20" />,
    enquiry: <Icon icon="hugeicons:quill-write-02" width="20" />,
    interview: <Icon icon="mage:message-conversation" width="20" />,
    manageShift: <Icon icon="ic:twotone-manage-history" width="20" />,
    kpi: <Icon icon="lucide:target" width="20" />,
  };

  const menuItems = [
    {
      section: "HUMAN RESOURCES",
      items: [
        { title: "HR Dashboard", path: `/dashboard`, icon: icons.hr },
        { title: "Letter", path: "/letter", icon: icons.muster },
        { title: "Email", path: "/email", icon: icons.email },
        { title: "Events", path: "/events", icon: icons.events },
        {
          title: "Announcements",
          path: "/announcements",
          icon: icons.announcement,
        },
        {
          title: "Payroll",
          path: userId ? `/payroll` : "#",
          icon: icons.payroll,
        },
        { title: "Manage Shift", path: `/shift`, icon: icons.manageShift },
        { title: "Reports", path: "/reports", icon: icons.reports },
        { title: "Asset Manager", path: "/asset", icon: icons.asset },
        {
          title: "Manage Employees",
          path: `/manageemployee`,
          icon: icons.manageEmployees,
        },

        {
          title: "KPI",
          path: `/kpi`,
          icon: icons.kpi,
        },
        { title: "Requests", path: `/requests`, icon: icons.workfromhome },
        { title: "Insurance", path: `/insurance`, icon: icons.insurance },
        { title: "Timesheet", path: `/timesheet`, icon: icons.timesheet },
      ],
    },
    {
      section: "ONBOARDING",
      items: [
        {
          title: "Organization",
          path: "/onboarding",
          icon: icons.organisationonboard,
        },
        {
          title: "Employee",
          path: `/employeeonboarding`,
          icon: icons.employeeOnboard,
        },
      ],
    },
    {
      section: "HIRING PROCESS",
      items: [
        { title: "Job Creation", path: "/job", icon: icons.Hiring },
        { title: "Job Enquiry", path: "/jobenquiry", icon: icons.enquiry },
        // {
        //   title: "Interview Process",
        //   path: userId ? `/u/${userId}/${userNameSlug}/interviewprocess` : "#",
        //   icon: icons.interview,
        // },
      ],
    },
  ];

  // Logout via API: waits for POST /staff/logout, then clears the session
  // and redirects. The store clears local state even if the API call fails.
  const handleLogoutClick = async () => {
    if (isProcessing) return; // prevent double clicks
    await logout(); // 1. Calls the logout API + purges auth credentials via Zustand
    localStorage.removeItem(LAST_PATH_KEY); // 2. Forget the saved page
    navigate("/", { replace: true }); // 3. Go to root & drop the previous history entry
  };

  return (
    <>
      {/* Mobile Hamburger (hidden while the drawer is open) */}
      {!isMobileOpen && (
        <button
          className="md:hidden p-2 fixed top-4 left-4 z-40 bg-gray-800 rounded"
          onClick={toggleMobileSidebar}
        >
          <Icon icon="flowbite:bars-from-left-outline" width="24" height="24" />
        </button>
      )}

      {/* Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar: full width + full height on mobile, original widths from md up */}
      <div
        className={`bg-black fixed top-0 left-0 z-50 h-[100dvh] w-full flex flex-col text-white shadow-lg
        transition-transform duration-300
        ${isCollapsed ? "md:w-[6%]" : "md:w-[20%]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo + Toggle */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <img
              src={rebsLogo}
              alt="Logo"
              className={`${collapsed ? "hidden" : "block"} h-8 w-8`}
            />
            {!collapsed && (
              <span className="text-white text-lg font-normal">REBS HR</span>
            )}
          </div>
          <button
            onClick={isMobile ? toggleMobileSidebar : toggleSidebar}
            className="p-1 rounded transition-colors"
          >
            <Icon
              icon={isMobile ? "mdi:close" : "flowbite:bars-from-left-outline"}
              width="24"
              height="24"
              className="text-white"
            />
          </button>
        </div>

        {/* Profile Section */}
        <div className="mt-1 flex flex-col items-center">
          <div
            onClick={toggleProfile}
            className={`flex items-center justify-center rounded-lg transition-colors duration-300 cursor-pointer
              ${collapsed ? "w-12 h-12" : "w-[90%] px-4 h-14"}
              ${
                !collapsed &&
                (isProfileOpen
                  ? "bg-gray-600"
                  : "bg-gray-800 hover:bg-gray-600")
              }`}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            {!collapsed && (
              <div className="flex-1 text-left ml-3">
                <span className="block text-sm">{displayName}</span>
                <span className="block text-xs text-gray-400">
                  {user?.user_type || "Admin"}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="ml-2 transition-transform duration-300">
                <Icon
                  icon="mdi:chevron-down"
                  className={`w-5 h-5 text-gray-400 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          {!collapsed && isProfileOpen && (
            <div className="mt-2 w-[90%] bg-[#1C2526] rounded-lg flex flex-col space-y-1 px-2 py-1">
              <Link
                to="/settings"
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors"
              >
                <Settings size={20} />
                <span className="text-sm flex-1 text-left">Settings</span>
              </Link>

              <button
                onClick={handleLogoutClick}
                disabled={isProcessing}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Icon
                  icon={
                    isProcessing
                      ? "line-md:loading-loop"
                      : "material-symbols:logout"
                  }
                  width="20"
                  height="20"
                />
                <span className="text-sm flex-1 text-left">
                  {isProcessing ? "Logging out..." : "Logout"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <nav
          ref={navRef}
          className="relative flex-1 flex flex-col justify-start mt-7 overflow-y-auto scrollbar-hide"
        >
          {menuItems.map((menu, index) => (
            <div key={index} className="px-4 mb-2 space-y-2">
              {!collapsed && (
                <p className="text-gray-400 text-xs mb-1 px-2 tracking-wider">
                  {menu.section}
                </p>
              )}
              {menu.items.map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.path}
                  className={({ isActive }) =>
                    `h-[40px] flex items-center space-x-3 px-3 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? "bg-[#1C2526] text-white font-light"
                        : "text-neutral-600 hover:text-white hover:bg-gray-800"
                    }`
                  }
                  style={{ width: collapsed ? "100%" : "90%" }}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="flex-1 text-left">{item.title}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Hide Scrollbar */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </>
  );
}

export default SideBar;
