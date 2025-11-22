import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  Activity,
  Shield,
  UserCog,
  Award,
  BarChart3,
} from "lucide-react";
import { storageUtils, type EnquiryData } from "../utils/localStorage";
import { authUtils, useAuth } from "../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { currentUser, isAdmin, hasPermission } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [statistics, setStatistics] = useState({
    totalEnquiries: 0,
    todayFollowUps: 0,
    allFollowUps: 0,
    confirmed: 0,
    pending: 0,
    inProcess: 0,
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState<EnquiryData[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<EnquiryData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const loadDashboardData = async () => {
    try {
      const allEnquiries = await storageUtils.getAllEnquiries();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        totalEnquiries: allEnquiries.length,
        todayFollowUps: allEnquiries.filter((e: EnquiryData) =>
          isToday(e.callBackDate)
        ).length,
        allFollowUps: allEnquiries.filter((e: EnquiryData) => {
          if (!e.callBackDate) return false;
          const callBackDate = new Date(e.callBackDate);
          callBackDate.setHours(0, 0, 0, 0);
          return callBackDate >= today;
        }).length,
        confirmed: allEnquiries.filter(
          (e: EnquiryData) => e.status === "Confirmed"
        ).length,
        pending: allEnquiries.filter((e: EnquiryData) => e.status === "Pending")
          .length,
        inProcess: allEnquiries.filter(
          (e: EnquiryData) => e.status === "In Process"
        ).length,
      };

      setStatistics(stats);

      if (isAdmin()) {
        const allUsers = await authUtils.getAllUsers();
        const activeUsers = allUsers.filter((u: { isActive: any }) => u.isActive);

        setUserStats({
          totalUsers: activeUsers.length,
          adminUsers: activeUsers.filter((u: { role: string }) => u.role === "admin").length,
          regularUsers: activeUsers.filter((u: { role: string }) => u.role === "user").length,
        });
      }

      const recent = [...allEnquiries]
        .sort(
          (a: EnquiryData, b: EnquiryData) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);
      setRecentEnquiries(recent);

      const todayFollows = allEnquiries
        .filter((e: EnquiryData) => isToday(e.callBackDate))
        .slice(0, 5);
      setTodayFollowUps(todayFollows);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadDashboardData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCardClick = (action: string) => {
    const routes: Record<string, string> = {
      total: "/view-enquiry",
      add: "/add-enquiry",
      // search: "/search-enquiry",
      userManagement: "/user-management",
      todayFollowUps: "/today-followups",
      allFollowUps: "/all-followups",
      confirmed: "/view-enquiry",
      pending: "/view-enquiry",
      inProcess: "/view-enquiry",
    };
    navigate(routes[action] || "/");
  };

  const handleViewEnquiry = () => {
    navigate("/view-enquiry");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Process":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statCards = [
    {
      title: "Total Enquiries",
      value: statistics.totalEnquiries,
      icon: <Users size={20} className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      action: "total",
      trend: "+12% from last month",
      show: hasPermission("View Enquiry"),
    },
    {
      title: "Add Enquiry",
      value: "New",
      icon: <UserPlus size={20} className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600",
      action: "add",
      trend: "Click to add new",
      show: hasPermission("Add Enquiry"),
    },
    // {
    //   title: "Search Enquiries",
    //   value: "Find",
    //   icon: <Search size={20} className="w-4 h-4 sm:w-5 sm:h-5" />,
    //   iconBgColor: "bg-purple-100",
    //   iconColor: "text-purple-600",
    //   action: "search",
    //   trend: "Advanced search",
    //   show: hasPermission("Search Enquiry"),
    // },
    {
      title: "User Management",
      value: userStats.totalUsers,
      icon: <UserCog size={20} className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconBgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      action: "userManagement",
      trend: `${userStats.adminUsers} admins, ${userStats.regularUsers} users`,
      show: isAdmin(),
    },
    {
      title: "Today's Follow Ups",
      value: statistics.todayFollowUps,
      icon: <AlertCircle size={20} className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconBgColor: "bg-red-100",
      iconColor: "text-red-600",
      action: "todayFollowUps",
      trend: "Due today",
      show: hasPermission("Today's Follow-ups"),
    },
    {
      title: "All Follow Ups",
      value: statistics.allFollowUps,
      icon: <Calendar size={20} className="w-4 h-4 sm:w-5 sm:h-5" />,
      iconBgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
      action: "allFollowUps",
      trend: "Upcoming",
      show: hasPermission("All Follow-ups"),
    },
  ].filter((card) => card.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-t-xl shadow-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {currentUser?.fullName}! 👋
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                  {isAdmin() ? (
                    <>
                      <Shield size={12} className="sm:w-3.5 sm:h-3.5 text-purple-600 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-purple-600">
                        Administrator
                      </span>
                    </>
                  ) : (
                    <>
                      <Award size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-blue-600">
                        User
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[200px] sm:max-w-none">
                  {currentUser?.email || "No email set"}
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 shadow-sm"
            >
              <RefreshCw
                size={14}
                className={`sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap mt-3 sm:mt-4">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-200 rounded-lg flex-1 sm:flex-none">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
              <span className="font-medium text-green-700 text-[10px] sm:text-xs md:text-sm truncate">
                {currentDate || "Loading..."}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock size={14} className="sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-blue-700 text-[10px] sm:text-xs md:text-sm">
                {currentTime || "Loading..."}
              </span>
            </div>
          </div>
        </div>

        {/* Stat Cards Section */}
        <div className="bg-white border-x border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {statCards.map((stat) => (
              <motion.div
                key={stat.title}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
                onMouseEnter={() => setHoveredCard(stat.title)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <button
                  onClick={() => handleCardClick(stat.action)}
                  className="w-full text-left"
                >
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-3 sm:p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div
                        className={`${stat.iconBgColor} ${stat.iconColor} p-2 sm:p-2.5 rounded-lg`}
                      >
                        {stat.icon}
                      </div>
                      <TrendingUp size={14} className="sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    </div>

                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs font-medium mb-1">
                        {stat.title}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                        {typeof stat.value === "number"
                          ? stat.value.toLocaleString()
                          : stat.value}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 truncate">{stat.trend}</p>
                    </div>
                  </div>
                </button>

                {hoveredCard === stat.title && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:block absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white shadow-lg rounded-lg px-3 py-2 text-xs z-50 whitespace-nowrap"
                  >
                    <div className="font-semibold">Click to view details</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Two Column Layout - Recent Enquiries & Today's Follow Ups */}
        <div className="bg-white border-x border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Enquiries */}
            {hasPermission("View Enquiry") && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2">
                      <Activity size={14} className="sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                      <span>Recent Enquiries</span>
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                      Latest 5 submissions
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/view-enquiry")}
                    className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                  >
                    View All →
                  </button>
                </div>

                <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto bg-white">
                  {recentEnquiries.length === 0 ? (
                    <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500">
                      <Users
                        size={28}
                        className="sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300"
                      />
                      <p className="text-xs sm:text-sm">No enquiries yet</p>
                      <button
                        onClick={() => navigate("/add-enquiry")}
                        className="mt-3 text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add your first enquiry
                      </button>
                    </div>
                  ) : (
                    recentEnquiries.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleViewEnquiry()}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                              <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">
                                {enquiry.fullName}
                              </p>
                              <span
                                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${getStatusColor(
                                  enquiry.status
                                )}`}
                              >
                                {enquiry.status}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] sm:text-xs text-gray-500 mb-1">
                              <span className="flex items-center gap-1">
                                <Phone size={10} className="sm:w-[11px] sm:h-[11px] flex-shrink-0" />
                                <span>{enquiry.mobile}</span>
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <Mail size={10} className="sm:w-[11px] sm:h-[11px] flex-shrink-0" />
                                <span className="truncate">
                                  {enquiry.email.length > 20
                                    ? enquiry.email.substring(0, 20) + "..."
                                    : enquiry.email}
                                </span>
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-400">
                              {new Date(enquiry.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <Eye
                            size={14}
                            className="sm:w-4 sm:h-4 text-gray-400 hover:text-blue-600 flex-shrink-0 ml-2"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Today's Follow Ups */}
            {hasPermission("Today's Follow-ups") && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2">
                      <AlertCircle size={14} className="sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                      <span>Today's Follow Ups</span>
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                      Scheduled for today
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/today-followups")}
                    className="text-[10px] sm:text-xs text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                  >
                    View All →
                  </button>
                </div>

                <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto bg-white">
                  {todayFollowUps.length === 0 ? (
                    <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500">
                      <Calendar
                        size={28}
                        className="sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300"
                      />
                      <p className="text-xs sm:text-sm">No follow-ups for today</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                        Great! You're all caught up
                      </p>
                    </div>
                  ) : (
                    todayFollowUps.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-orange-50 transition-colors cursor-pointer"
                        onClick={() => handleViewEnquiry()}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                              <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">
                                {enquiry.fullName}
                              </p>
                              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-orange-100 text-orange-700 animate-pulse flex-shrink-0">
                                Today
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500 mb-1">
                              <span className="flex items-center gap-1">
                                <Phone size={10} className="sm:w-[11px] sm:h-[11px] flex-shrink-0" />
                                <span>{enquiry.mobile}</span>
                              </span>
                              <span
                                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(
                                  enquiry.status
                                )}`}
                              >
                                {enquiry.status}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                              Interest: {enquiry.interestedStatus}
                            </p>
                          </div>
                          <Phone
                            size={14}
                            className="sm:w-4 sm:h-4 text-orange-500 flex-shrink-0 ml-2"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Overview Section */}
        {hasPermission("View Enquiry") && (
          <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
              <BarChart3 size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 flex-shrink-0" />
              <span>Status Overview</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle
                  size={28}
                  className="sm:w-8 sm:h-8 mx-auto mb-2 text-green-600"
                />
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {statistics.confirmed}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Confirmed</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {statistics.totalEnquiries > 0
                    ? `${(
                        (statistics.confirmed / statistics.totalEnquiries) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>

              <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <AlertCircle
                  size={28}
                  className="sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-600"
                />
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {statistics.pending}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {statistics.totalEnquiries > 0
                    ? `${(
                        (statistics.pending / statistics.totalEnquiries) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>

              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                <Activity
                  size={28}
                  className="sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600"
                />
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {statistics.inProcess}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  In Process
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {statistics.totalEnquiries > 0
                    ? `${(
                        (statistics.inProcess / statistics.totalEnquiries) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>

            {/* User Info Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md flex-shrink-0">
                  {currentUser?.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                    {currentUser?.fullName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[200px]">
                    @{currentUser?.username} •{" "}
                    {isAdmin() ? "Administrator" : "User"}
                  </p>
                </div>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-right">
                <p>
                  Member since{" "}
                  {currentUser?.createdAt &&
                    new Date(currentUser.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;