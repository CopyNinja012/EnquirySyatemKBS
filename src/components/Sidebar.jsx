import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaSearch,
  FaPlusCircle,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaUsersCog,
  FaSignOutAlt,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";
import {
  Upload,
  FileSpreadsheet,
  Shield,
} from "lucide-react";
import { storageUtils } from "../utils/localStorage";
import { advertisementStorage } from "../utils/advertisementStorage";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, hasPermission, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    todayFollowUps: 0,
    allFollowUps: 0,
    advertisementTotal: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const all = await storageUtils.getAllEnquiries();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayFollowUps = all.filter(
          (e) => e.callBackDate && isToday(e.callBackDate)
        ).length;
        const allFollowUps = all.filter((e) => {
          if (!e.callBackDate) return false;
          const d = new Date(e.callBackDate);
          d.setHours(0, 0, 0, 0);
          return d >= today;
        }).length;
        const advStats = await advertisementStorage.getStatistics();

        setStats({
          totalEnquiries: all.length,
          todayFollowUps,
          allFollowUps,
          advertisementTotal: advStats.total,
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadStats();
  }, [location.pathname]);

  const isToday = (dStr: string) => {
    const d = new Date(dStr);
    const t = new Date();
    return (
      d.getDate() === t.getDate() &&
      d.getMonth() === t.getMonth() &&
      d.getFullYear() === t.getFullYear()
    );
  };

  const linkStyle = (path: string) =>
    `flex items-center justify-between p-3 rounded-lg transition-all ${
      location.pathname === path
        ? "bg-gradient-to-r from-sky-50 to-sky-100 border-l-4 border-sky-500 text-sky-700 font-semibold shadow-sm"
        : "hover:bg-gradient-to-r hover:from-sky-50 hover:to-sky-100 hover:border-l-4 hover:border-sky-400 hover:text-sky-600 text-gray-700"
    }`;

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  // ---------------------------------------
  // MENU ITEMS
  // ---------------------------------------
  const allItems = [
    {
      path: "/",
      label: "Dashboard",
      permission: null,
      icon: <FaTachometerAlt />,
      group: "main",
    },
    {
      path: "/add-enquiry",
      label: "Add Enquiry",
      permission: "Add Enquiry",
      icon: <FaPlusCircle />,
      group: "main",
    },
    {
      path: "/search-enquiry",
      label: "Search Enquiry",
      permission: "Search Enquiry",
      icon: <FaSearch />,
      group: "main",
    },
    {
      path: "/view-enquiry",
      label: "View Enquiry",
      permission: "View Enquiry",
      icon: <FaEye />,
      group: "main",
      badge: stats.totalEnquiries,
    },

    // ➕ NEW Payment Details entry
    {
      path: "/payment-details",
      label: "Payment Details",
      permission: "View Payment Details",
      icon: <FaCheckCircle />,
      group: "main",
    },

    {
      path: "/today-followups",
      label: "Today's Follow-ups",
      permission: "Today's Follow-ups",
      icon: <FaCalendarCheck />,
      group: "followups",
      badge: stats.todayFollowUps,
      urgent: stats.todayFollowUps > 0,
    },
    {
      path: "/all-followups",
      label: "All Follow-ups",
      permission: "All Follow-ups",
      icon: <FaCheckCircle />,
      group: "followups",
      badge: stats.allFollowUps,
    },
    {
      path: "/import-advertisement",
      label: "Import Advertisement",
      permission: "Import Advertisement",
      icon: <Upload />,
      group: "advertisement",
    },
    {
      path: "/advertisement-enquiries",
      label: "Advertisement Data",
      permission: "View Advertisement Data",
      icon: <FileSpreadsheet />,
      group: "advertisement",
      badge: stats.advertisementTotal,
    },
    {
      path: "/search-advertisement",
      label: "Search Advertisement",
      permission: "Search Advertisement",
      icon: <FaSearch />,
      group: "advertisement",
    },
    {
      path: "/admin-profile",
      label: "Profile",
      adminOnly: true,
      icon: <FaUserCircle />,
      group: "admin",
    },
    {
      path: "/user-management",
      label: "User Management",
      adminOnly: true,
      icon: <FaUsersCog />,
      group: "admin",
    },
  ];

  // visible items according to permissions
  const visible = allItems.filter((i) => {
    if (i.adminOnly) return isAdmin();
    if (!i.permission) return true;
    return hasPermission(i.permission);
  });

  const menuMain = visible.filter((i) => i.group === "main");
  const menuFollow = visible.filter((i) => i.group === "followups");
  const menuAdv = visible.filter((i) => i.group === "advertisement");
  const menuAdmin = visible.filter((i) => i.group === "admin");

  const initials =
    currentUser?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  // ---------------------------------------
  // RENDER
  // ---------------------------------------
  return (
    <>
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 shadow-lg fixed h-screen left-0 top-0 flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-gray-800">EMS</h2>
              <p className="text-xs text-gray-500">Enquiry Management</p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <FaChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <FaChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Role Box - Conditional based on user role */}
        {!isCollapsed && (
          <div className="flex flex-col items-center px-4 my-4">
            {isAdmin() ? (
              // Admin view - Full box with Shield and Administrator text
              <div className="bg-purple-50 border border-purple-200 rounded-xl w-full flex flex-col items-center py-5">
                <div className="flex items-center gap-2">
                  <Shield size={22} className="text-purple-600" />
                  <span className="text-base font-bold text-purple-700">
                    Administrator
                  </span>
                </div>
                <p className="text-base font-bold text-black mt-1">
                  Kali Byte Solutions
                </p>
              </div>
            ) : (
              // User view - Compact box with only company name
              <div className="bg-purple-50 border border-purple-200 rounded-lg w-full flex items-center justify-center py-3 px-4">
                <p className="text-base font-bold text-black">
                  Kali Byte Solutions
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* MAIN */}
          {menuMain.length > 0 && (
            <ul className="mb-2">
              {!isCollapsed && (
                <li className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
                  Main Menu
                </li>
              )}
              {menuMain.map((m) => (
                <li key={m.path}>
                  <Link
                    to={m.path}
                    className={linkStyle(m.path)}
                    title={isCollapsed ? m.label : ""}
                  >
                    <div className="flex items-center flex-1">
                      <span className={`${isCollapsed ? "mx-auto" : "mr-3"}`}>
                        {m.icon}
                      </span>
                      {!isCollapsed && <span className="truncate">{m.label}</span>}
                    </div>
                    {!isCollapsed && m.badge && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500 text-white">
                        {m.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* FOLLOW UPS */}
          {menuFollow.length > 0 && (
            <>
              {!isCollapsed && <div className="my-3 border-t border-gray-200" />}
              <ul>
                {!isCollapsed && (
                  <li className="px-2 py-1 text-xs font-semibold text-sky-400 uppercase flex items-center gap-2">
                    <FaBell size={12} />
                    Follow‑ups
                  </li>
                )}
                {menuFollow.map((m) => (
                  <li key={m.path}>
                    <Link
                      to={m.path}
                      className={linkStyle(m.path)}
                      title={isCollapsed ? m.label : ""}
                    >
                      <div className="flex items-center flex-1">
                        <span className={`${isCollapsed ? "mx-auto" : "mr-3"}`}>
                          {m.icon}
                        </span>
                        {!isCollapsed && <span>{m.label}</span>}
                      </div>
                      {!isCollapsed && m.badge && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            m.urgent
                              ? "bg-orange-500 text-white animate-pulse"
                              : "bg-sky-500 text-white"
                          }`}
                        >
                          {m.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ADVERTISEMENT */}
          {menuAdv.length > 0 && (
            <>
              {!isCollapsed && <div className="my-3 border-t border-gray-200" />}
              <ul>
                {!isCollapsed && (
                  <li className="px-2 py-1 text-xs font-semibold text-sky-400 uppercase flex items-center gap-2">
                    <FileSpreadsheet size={12} />
                    Advertisement
                  </li>
                )}
                {menuAdv.map((m) => (
                  <li key={m.path}>
                    <Link
                      to={m.path}
                      className={linkStyle(m.path)}
                      title={isCollapsed ? m.label : ""}
                    >
                      <div className="flex items-center">
                        <span className={`${isCollapsed ? "mx-auto" : "mr-3"}`}>
                          {m.icon}
                        </span>
                        {!isCollapsed && <span>{m.label}</span>}
                      </div>
                      {!isCollapsed && m.badge && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500 text-white">
                          {m.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ADMIN AREA */}
          {menuAdmin.length > 0 && (
            <>
              {!isCollapsed && <div className="my-3 border-t border-gray-200" />}
              <ul>
                {!isCollapsed && (
                  <li className="px-2 py-1 text-xs font-semibold text-sky-400 uppercase flex items-center gap-2">
                    <Shield size={12} />
                    Administrator
                  </li>
                )}
                {menuAdmin.map((m) => (
                  <li key={m.path}>
                    <Link
                      to={m.path}
                      className={linkStyle(m.path)}
                      title={isCollapsed ? m.label : ""}
                    >
                      <div className="flex items-center">
                        <span
                          className={`${isCollapsed ? "mx-auto" : "mr-3"} text-sky-600`}
                        >
                          {m.icon}
                        </span>
                        {!isCollapsed && <span>{m.label}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Bottom user box */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {currentUser?.fullName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{currentUser?.username}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 text-sm font-medium"
            >
              <FaSignOutAlt className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <FaSignOutAlt className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Logout</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to logout?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;