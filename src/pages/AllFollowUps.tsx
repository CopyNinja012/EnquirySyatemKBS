import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Briefcase,
  Save,
  AlertCircle,
  Pencil,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  CreditCard,
} from "lucide-react";
import { storageUtils, type EnquiryData } from "../utils/localStorage";

// ========== Validation Functions ==========
const ValidationHelpers = {
  validateFullName: (name: string): string => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 3) return "Name must be at least 3 characters";
    if (!/^[a-zA-Z\s.]+$/.test(name))
      return "Name can only contain letters, spaces, and dots";
    if (name.trim().length > 100) return "Name must not exceed 100 characters";
    return "";
  },

  validateMobile: (mobile: string, fieldName: string = "Mobile"): string => {
    if (!mobile.trim()) return `${fieldName} number is required`;
    if (!/^\d{10}$/.test(mobile))
      return `${fieldName} number must be exactly 10 digits`;
    if (!/^[6-9]\d{9}$/.test(mobile))
      return `${fieldName} number must start with 6, 7, 8, or 9`;
    return "";
  },

  validateEmail: (email: string): string => {
    if (!email.trim()) return "Email address is required";
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 100) return "Email must not exceed 100 characters";
    return "";
  },

  validateAadhar: (aadhar: string): string => {
    if (!aadhar.trim()) return "Aadhar number is required";
    const cleanAadhar = aadhar.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhar))
      return "Aadhar number must be exactly 12 digits";
    if (cleanAadhar === "000000000000" || cleanAadhar === "111111111111") {
      return "Invalid Aadhar number format";
    }
    return "";
  },

  validatePAN: (pan: string): string => {
    if (!pan.trim()) return "PAN number is required";
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase()))
      return "Invalid PAN format (e.g., ABCDE1234F)";
    const fourthChar = pan.charAt(3).toUpperCase();
    const validFourthChars = ["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"];
    if (!validFourthChars.includes(fourthChar)) {
      return "Invalid PAN number - 4th character must be P, C, H, F, A, T, B, L, J, or G";
    }
    return "";
  },

  validateAddress: (address: string): string => {
    if (!address.trim()) return "Address is required";
    if (address.trim().length < 10)
      return "Address must be at least 10 characters";
    if (address.trim().length > 500)
      return "Address must not exceed 500 characters";
    return "";
  },

  validateDematAccount: (
    account: string,
    isRequired: boolean = true
  ): string => {
    if (!account.trim())
      return isRequired ? "Demat account ID is required" : "";
    if (account.trim().length < 8)
      return "Demat account ID must be at least 8 characters";
    if (account.trim().length > 16)
      return "Demat account ID must not exceed 16 characters";
    if (!/^[A-Z0-9]+$/.test(account.toUpperCase())) {
      return "Demat account ID can only contain letters and numbers";
    }
    return "";
  },

  validateDate: (
    date: string,
    fieldName: string,
    allowPast: boolean = false
  ): string => {
    if (!date) return `${fieldName} is required`;
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime()))
      return `Invalid ${fieldName.toLowerCase()}`;

    if (!allowPast && selectedDate < today) {
      return `${fieldName} cannot be in the past`;
    }

    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    if (selectedDate > twoYearsFromNow) {
      return `${fieldName} cannot be more than 2 years in the future`;
    }
    return "";
  },

  getInterestPercentage: (interestedStatus: string): number => {
    if (interestedStatus?.includes("100%")) return 100;
    if (interestedStatus?.includes("75%")) return 75;
    if (interestedStatus?.includes("50%")) return 50;
    if (interestedStatus?.includes("25%")) return 25;
    return 0;
  },

  validateStatusInterestCompatibility: (
    status: string,
    interestedStatus: string
  ): string => {
    const interestLevel =
      ValidationHelpers.getInterestPercentage(interestedStatus);
    if (status === "Pending" && interestLevel > 25) {
      return "Pending status can only have 25% interest or below";
    }
    return "";
  },
};

const FollowUps: React.FC = () => {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [followUps, setFollowUps] = useState<EnquiryData[]>([]);
  const [filteredFollowUps, setFilteredFollowUps] = useState<EnquiryData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryData | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EnquiryData | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("en-US", dateOptions));

      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      setCurrentTime(now.toLocaleTimeString("en-US", timeOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadFollowUps();
  }, []);

  useEffect(() => {
    filterFollowUps();
  }, [searchTerm, followUps]);

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

  const isTomorrow = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  };

  const loadFollowUps = async () => {
    setIsLoading(true);
    try {
      const allEnquiries = await storageUtils.getAllEnquiries();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingFollowUps = allEnquiries.filter((enquiry: EnquiryData) => {
        if (!enquiry.callBackDate) return false;

        const callBackDate = new Date(enquiry.callBackDate);
        callBackDate.setHours(0, 0, 0, 0);

        return callBackDate >= today;
      });

      const sortedFollowUps = upcomingFollowUps.sort(
        (a: EnquiryData, b: EnquiryData) => {
          const dateA = new Date(a.callBackDate).getTime();
          const dateB = new Date(b.callBackDate).getTime();
          return dateA - dateB;
        }
      );

      setFollowUps(sortedFollowUps);
      setFilteredFollowUps(sortedFollowUps);
    } catch (error) {
      console.error("Error loading follow-ups:", error);
      showToast("Failed to load follow-ups", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadFollowUps();
      showToast("Follow-ups refreshed successfully", "success");
    } catch (error) {
      showToast("Failed to refresh follow-ups", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filterFollowUps = () => {
    if (!searchTerm.trim()) {
      setFilteredFollowUps(followUps);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = followUps.filter(
      (enquiry) =>
        enquiry.fullName.toLowerCase().includes(term) ||
        enquiry.mobile.includes(term) ||
        enquiry.email.toLowerCase().includes(term) ||
        enquiry.id.toLowerCase().includes(term)
    );
    setFilteredFollowUps(filtered);
  };

  const handleRowClick = (enquiry: EnquiryData) => {
    setSelectedEnquiry(enquiry);
    setEditFormData({ ...enquiry });
    setIsEditing(false);
    setEditErrors({});
    setShowDetailsModal(true);
  };

  const handleEditChange = (field: keyof EnquiryData, value: string) => {
    if (!editFormData) return;

    let formattedValue = value;
    let updatedData = { ...editFormData };

    // Format mobile numbers
    if (field === "mobile" || field === "alternateMobile") {
      formattedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    // Format Aadhar
    else if (field === "aadharNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 12);
      formattedValue = digits
        .replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
        .trim();
    }
    // Format PAN
    else if (field === "panNumber") {
      formattedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
    }
    // Format Demat accounts
    else if (field === "demateAccount1" || field === "demateAccount2") {
      formattedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 16);
    }

    updatedData[field] = formattedValue;

    // ✅ Handle Status and Interest Status dependency logic
    if (field === "status") {
      if (formattedValue === "Pending") {
        const currentInterestLevel = ValidationHelpers.getInterestPercentage(
          updatedData.interestedStatus
        );

        if (currentInterestLevel > 25) {
          updatedData.interestedStatus = "25% Interested";
          showToast(
            "Interest level automatically adjusted to 25% for Pending status",
            "warning"
          );
        }
      }
    }

    if (field === "interestedStatus") {
      const interestLevel =
        ValidationHelpers.getInterestPercentage(formattedValue);

      if (interestLevel >= 50 && updatedData.status === "Pending") {
        updatedData.status = "In Process";
        showToast(
          "Status automatically changed to 'In Process' for higher interest level",
          "warning"
        );
      }
    }

    setEditFormData(updatedData);

    const newErrors = { ...editErrors };
    delete newErrors[field];
    if (field === "status" || field === "interestedStatus") {
      delete newErrors.status;
      delete newErrors.interestedStatus;
    }
    setEditErrors(newErrors);
  };

  const validateEditForm = async (): Promise<boolean> => {
    if (!editFormData) return false;

    const errors: Record<string, string> = {};
    const isConfirmed = editFormData.status === "Confirmed";

    // Always required fields
    const alwaysRequiredFields: (keyof EnquiryData)[] = [
      "fullName",
      "mobile",
      "email",
      "address",
      "enquiryState",
      "interestedStatus",
      "status",
      "callBackDate",
    ];

    // Fields required only when status is "Confirmed"
    const confirmedRequiredFields: (keyof EnquiryData)[] = [
      "aadharNumber",
      "panNumber",
      "demateAccount1",
      "sourceOfEnquiry",
      "profession",
      "knowledgeOfShareMarket",
      "howDidYouKnow",
      "depositInwardDate",
      "depositOutwardDate",
    ];

    // Validate always required fields
    for (const field of alwaysRequiredFields) {
      let error = "";
      const value = editFormData[field] as string;

      switch (field) {
        case "fullName":
          error = ValidationHelpers.validateFullName(value);
          break;
        case "mobile":
          error = ValidationHelpers.validateMobile(value);
          break;
        case "email":
          error = ValidationHelpers.validateEmail(value);
          break;
        case "address":
          error = ValidationHelpers.validateAddress(value);
          break;
        case "enquiryState":
          if (!value) error = "Please select a state";
          break;
        case "interestedStatus":
          if (!value) error = "Please select interested status";
          break;
        case "status":
          if (!value) error = "Please select status";
          break;
        case "callBackDate":
          error = ValidationHelpers.validateDate(value, "Call back date", true);
          break;
      }

      if (error) errors[field] = error;
    }

    // Validate confirmed-only fields if status is "Confirmed"
    if (isConfirmed) {
      for (const field of confirmedRequiredFields) {
        let error = "";
        const value = editFormData[field] as string;

        switch (field) {
          case "aadharNumber":
            error = ValidationHelpers.validateAadhar(value);
            break;
          case "panNumber":
            error = ValidationHelpers.validatePAN(value);
            break;
          case "demateAccount1":
            error = ValidationHelpers.validateDematAccount(value, true);
            break;
          case "sourceOfEnquiry":
            if (!value) error = "Please select source of enquiry";
            break;
          case "profession":
            if (!value) error = "Please select profession";
            break;
          case "knowledgeOfShareMarket":
            if (!value) error = "Please select knowledge level";
            break;
          case "howDidYouKnow":
            if (!value) error = "Please select an option";
            break;
          case "depositInwardDate":
            error = ValidationHelpers.validateDate(
              value,
              "Deposit inward date",
              false
            );
            break;
          case "depositOutwardDate":
            error = ValidationHelpers.validateDate(
              value,
              "Deposit outward date",
              false
            );
            if (!error && editFormData.depositInwardDate) {
              const inward = new Date(editFormData.depositInwardDate);
              const outward = new Date(value);
              if (outward < inward) {
                error = "Deposit outward date cannot be before inward date";
              }
            }
            break;
        }

        if (error) errors[field] = error;
      }

      // Validate conditional fields
      if (
        editFormData.howDidYouKnow === "Other" &&
        !editFormData.customHowDidYouKnow?.trim()
      ) {
        errors.customHowDidYouKnow = "Please specify how you knew about us";
      }

      if (
        editFormData.profession === "Other" &&
        !editFormData.customProfession?.trim()
      ) {
        errors.customProfession = "Please specify your profession";
      }

      if (editFormData.demateAccount2) {
        const error = ValidationHelpers.validateDematAccount(
          editFormData.demateAccount2,
          false
        );
        if (error) errors.demateAccount2 = error;
        if (editFormData.demateAccount2 === editFormData.demateAccount1) {
          errors.demateAccount2 =
            "Demat Account 2 cannot be same as Demat Account 1";
        }
      }
    }

    // Validate optional fields if they have values
    if (editFormData.alternateMobile) {
      const error = ValidationHelpers.validateMobile(
        editFormData.alternateMobile,
        "Alternate mobile"
      );
      if (error) errors.alternateMobile = error;
      if (editFormData.alternateMobile === editFormData.mobile) {
        errors.alternateMobile =
          "Alternate mobile cannot be same as primary mobile";
      }
    }

    // Validate status-interest compatibility
    const compatibilityError =
      ValidationHelpers.validateStatusInterestCompatibility(
        editFormData.status,
        editFormData.interestedStatus
      );
    if (compatibilityError) {
      errors.status = compatibilityError;
      errors.interestedStatus = compatibilityError;
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;

    const isValid = await validateEditForm();

    if (!isValid) {
      showToast("Please fix all validation errors before saving", "error");
      return;
    }

    try {
      const updated = await storageUtils.updateEnquiry(editFormData.id, {
        ...editFormData,
        updatedAt: new Date().toISOString(),
      });

      if (updated) {
        showToast("Follow-up updated successfully", "success");
        await loadFollowUps();
        setShowDetailsModal(false);
        setEditFormData(null);
        setIsEditing(false);
        setEditErrors({});
      } else {
        showToast("Failed to update follow-up", "error");
      }
    } catch (error) {
      console.error("Error updating follow-up:", error);
      showToast("Error updating follow-up", "error");
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setToast({ message, type });
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

  const getInterestedColor = (interested: string) => {
    if (interested?.includes("100%")) return "bg-green-100 text-green-700";
    if (interested?.includes("75%")) return "bg-blue-100 text-blue-700";
    if (interested?.includes("50%")) return "bg-yellow-100 text-yellow-700";
    if (interested?.includes("25%")) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const formatCallbackDate = (dateString: string) => {
    if (isToday(dateString)) return "Today";
    if (isTomorrow(dateString)) return "Tomorrow";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const todayFollowUps = followUps.filter((f) => isToday(f.callBackDate));
  const tomorrowFollowUps = followUps.filter((f) => isTomorrow(f.callBackDate));
  const upcomingFollowUps = followUps.filter(
    (f) => !isToday(f.callBackDate) && !isTomorrow(f.callBackDate)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                All Follow Ups
              </h1>
              <time
                className="flex items-center gap-4 text-xs sm:text-sm flex-wrap"
                dateTime={new Date().toISOString()}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <Calendar
                    size={14}
                    className="sm:w-4 sm:h-4 text-green-600"
                  />
                  <span className="font-medium text-green-700">
                    {currentDate || "Loading..."}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock size={14} className="sm:w-4 sm:h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {currentTime || "Loading..."}
                  </span>
                </div>
              </time>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw
                size={14}
                className={`sm:w-4 sm:h-4 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Follow Ups</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {followUps.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <Calendar size={20} className="sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Today</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {todayFollowUps.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                <AlertCircle
                  size={20}
                  className="sm:w-6 sm:h-6 text-orange-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tomorrow</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {tomorrowFollowUps.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <Clock size={20} className="sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {upcomingFollowUps.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <Calendar size={20} className="sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search
              size={16}
              className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by Name, Mobile, Email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 sm:h-11 border border-gray-300 rounded-lg pl-9 sm:pl-10 pr-10 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
          </div>
        </section>

        {/* Table Section */}
        <section className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Calendar size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No follow-ups found
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? "Try adjusting your search"
                  : "No upcoming follow-ups scheduled"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-sm font-semibold py-3 px-4 border-b border-gray-200 grid grid-cols-12 gap-4">
                  <span className="col-span-2">Full Name</span>
                  <span className="col-span-2">Mobile</span>
                  <span className="col-span-2">Callback Date</span>
                  <span className="col-span-2">Status</span>
                  <span className="col-span-2">Interest Level</span>
                  <span className="col-span-2">Profession</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredFollowUps.map((item, i) => (
                    <div
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-green-50 transition-colors cursor-pointer`}
                    >
                      <span className="col-span-2 font-medium text-gray-800 truncate">
                        {item.fullName}
                      </span>
                      <span className="col-span-2 text-gray-600">
                        {item.mobile}
                      </span>
                      <span className="col-span-2">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                            isToday(item.callBackDate)
                              ? "bg-orange-100 text-orange-700 animate-pulse"
                              : isTomorrow(item.callBackDate)
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {formatCallbackDate(item.callBackDate)}
                        </span>
                      </span>
                      <span className="col-span-2">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </span>
                      <span className="col-span-2">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getInterestedColor(
                            item.interestedStatus
                          )}`}
                        >
                          {item.interestedStatus}
                        </span>
                      </span>
                      <span
                        className="col-span-2 text-gray-700 truncate"
                        title={
                          item.profession === "Other"
                            ? item.customProfession
                            : item.profession
                        }
                      >
                        {item.profession === "Other"
                          ? item.customProfession
                          : item.profession}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredFollowUps.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="p-4 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {item.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{item.id}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isToday(item.callBackDate)
                            ? "bg-orange-100 text-orange-700"
                            : isTomorrow(item.callBackDate)
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {formatCallbackDate(item.callBackDate)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <span className="text-xs">{item.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} />
                        <span className="text-xs truncate">{item.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getInterestedColor(
                            item.interestedStatus
                          )}`}
                        >
                          {item.interestedStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Details/Edit Modal */}
      {showDetailsModal && editFormData && (
        <EditableDetailsModal
          enquiry={editFormData}
          errors={editErrors}
          isEditing={isEditing}
          onClose={() => {
            setShowDetailsModal(false);
            setEditFormData(null);
            setIsEditing(false);
            setEditErrors({});
          }}
          onEdit={() => setIsEditing(true)}
          onChange={handleEditChange}
          onSave={handleSaveEdit}
          onCancel={() => {
            setEditFormData(selectedEnquiry ? { ...selectedEnquiry } : null);
            setIsEditing(false);
            setEditErrors({});
          }}
          getStatusColor={getStatusColor}
          getInterestedColor={getInterestedColor}
          formatCallbackDate={formatCallbackDate}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Editable Details Modal Component
const EditableDetailsModal: React.FC<any> = ({
  enquiry,
  errors,
  isEditing,
  onClose,
  onEdit,
  onChange,
  onSave,
  onCancel,
  getStatusColor,
  getInterestedColor,
  formatCallbackDate,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const isConfirmed = enquiry.status === "Confirmed";
  const isPending = enquiry.status === "Pending";

  const getInterestedOptions = () => {
    const allOptions = [
      "100% Interested",
      "75% Interested",
      "50% Interested",
      "25% Interested",
      "0% Interested",
    ];

    if (isPending && isEditing) {
      return ["25% Interested", "0% Interested"];
    }

    return allOptions;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              {isEditing ? "Edit Follow Up" : "Follow Up Details"}
            </h2>
            <p className="text-xs sm:text-sm text-green-100 mt-1">
              ID: {enquiry.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Status Info Banner */}
        {isEditing && (
          <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 space-y-1">
                {isConfirmed ? (
                  <p>
                    <strong>Confirmed Status:</strong> All fields are editable.
                    Make sure to fill in all required information.
                  </p>
                ) : (
                  <>
                    <p>
                      <strong>Basic Information Only:</strong> Additional fields
                      like Aadhar, PAN, and Demat accounts are only available
                      when status is set to "Confirmed".
                    </p>
                    {isPending && (
                      <p className="flex items-center gap-1 mt-2">
                        <AlertTriangle size={14} className="flex-shrink-0" />
                        <strong>Pending Status Rule:</strong> Interest level
                        must be 25% or below. Selecting 50% or higher will
                        automatically change status to "In Process".
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Personal Information - Always Visible */}
            <EditableSection
              title="Personal Information"
              icon={<User size={18} />}
            >
              <EditableField
                icon={<User size={14} />}
                label="Full Name"
                value={enquiry.fullName}
                isEditing={isEditing}
                onChange={(val: any) => onChange("fullName", val)}
                error={errors.fullName}
                required
                maxLength={100}
              />
              <EditableField
                icon={<Phone size={14} />}
                label="Mobile Number"
                value={enquiry.mobile}
                isEditing={isEditing}
                onChange={(val: any) => onChange("mobile", val)}
                error={errors.mobile}
                maxLength={10}
                required
              />
              <EditableField
                icon={<Phone size={14} />}
                label="Alternate Mobile"
                value={enquiry.alternateMobile || ""}
                isEditing={isEditing}
                onChange={(val: any) => onChange("alternateMobile", val)}
                error={errors.alternateMobile}
                maxLength={10}
              />
              <EditableField
                icon={<Mail size={14} />}
                label="Email Address"
                value={enquiry.email}
                isEditing={isEditing}
                onChange={(val: any) => onChange("email", val)}
                error={errors.email}
                type="email"
                required
                maxLength={100}
              />
              <EditableTextArea
                icon={<MapPin size={14} />}
                label="Address"
                value={enquiry.address || ""}
                isEditing={isEditing}
                onChange={(val: any) => onChange("address", val)}
                error={errors.address}
                rows={3}
                required
              />
            </EditableSection>

            {/* Document Information - Only for Confirmed Status */}
            {(isConfirmed || !isEditing) && (
              <EditableSection
                title="Document Information"
                icon={<CreditCard size={18} />}
              >
                <EditableField
                  icon={<CreditCard size={14} />}
                  label="Aadhar Number"
                  value={enquiry.aadharNumber || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("aadharNumber", val)}
                  error={errors.aadharNumber}
                  maxLength={14}
                  required={isConfirmed}
                />
                <EditableField
                  icon={<CreditCard size={14} />}
                  label="PAN Number"
                  value={enquiry.panNumber || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("panNumber", val)}
                  error={errors.panNumber}
                  maxLength={10}
                  required={isConfirmed}
                />
                <EditableField
                  icon={<CreditCard size={14} />}
                  label="Demat Account ID 1"
                  value={enquiry.demateAccount1 || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("demateAccount1", val)}
                  error={errors.demateAccount1}
                  maxLength={16}
                  required={isConfirmed}
                />
                <EditableField
                  icon={<CreditCard size={14} />}
                  label="Demat Account ID 2"
                  value={enquiry.demateAccount2 || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("demateAccount2", val)}
                  error={errors.demateAccount2}
                  maxLength={16}
                />
              </EditableSection>
            )}

            {/* Follow Up Details - Always Visible */}
            <EditableSection
              title="Follow Up Details"
              icon={<Calendar size={18} />}
            >
              <EditableSelect
                icon={<MapPin size={14} />}
                label="Enquiry State"
                value={enquiry.enquiryState || ""}
                isEditing={isEditing}
                onChange={(val: any) => onChange("enquiryState", val)}
                options={[
                  "Andhra Pradesh",
                  "Arunachal Pradesh",
                  "Assam",
                  "Bihar",
                  "Chhattisgarh",
                  "Goa",
                  "Gujarat",
                  "Haryana",
                  "Himachal Pradesh",
                  "Jharkhand",
                  "Karnataka",
                  "Kerala",
                  "Madhya Pradesh",
                  "Maharashtra",
                  "Manipur",
                  "Meghalaya",
                  "Mizoram",
                  "Nagaland",
                  "Odisha",
                  "Punjab",
                  "Rajasthan",
                  "Sikkim",
                  "Tamil Nadu",
                  "Telangana",
                  "Tripura",
                  "Uttar Pradesh",
                  "Uttarakhand",
                  "West Bengal",
                  "Delhi",
                ]}
                required
                error={errors.enquiryState}
              />

              <EditableField
                icon={<Calendar size={14} />}
                label="Callback Date"
                value={
                  isEditing
                    ? formatDateForInput(enquiry.callBackDate || "")
                    : enquiry.callBackDate
                    ? `${formatCallbackDate(
                        enquiry.callBackDate
                      )} - ${formatDate(enquiry.callBackDate)}`
                    : ""
                }
                isEditing={isEditing}
                onChange={(val: any) => onChange("callBackDate", val)}
                error={errors.callBackDate}
                type={isEditing ? "date" : "text"}
                required
              />

              {(isConfirmed || !isEditing) && (
                <EditableSelect
                  label="Source of Enquiry"
                  value={enquiry.sourceOfEnquiry || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("sourceOfEnquiry", val)}
                  error={errors.sourceOfEnquiry}
                  options={[
                    "Phone Call",
                    "Walk-in",
                    "Referral",
                    "Social Media",
                    "Email",
                    "Advertisement",
                  ]}
                  required={isConfirmed}
                />
              )}

              <EditableSelect
                label="Interest Level"
                value={enquiry.interestedStatus || ""}
                isEditing={isEditing}
                onChange={(val: any) => onChange("interestedStatus", val)}
                error={errors.interestedStatus}
                options={getInterestedOptions()}
                colorClass={
                  !isEditing
                    ? getInterestedColor(enquiry.interestedStatus)
                    : undefined
                }
                required
              />

              <EditableSelect
                label="Status"
                value={enquiry.status}
                isEditing={isEditing}
                onChange={(val: any) => onChange("status", val)}
                error={errors.status}
                options={["Pending", "In Process", "Confirmed"]}
                colorClass={
                  !isEditing ? getStatusColor(enquiry.status) : undefined
                }
                required
              />
            </EditableSection>

            {/* Professional Information - Only for Confirmed Status */}
            {(isConfirmed || !isEditing) && (
              <EditableSection
                title="Professional Information"
                icon={<BookOpen size={18} />}
              >
                <EditableSelect
                  icon={<Briefcase size={14} />}
                  label="Profession"
                  value={enquiry.profession || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("profession", val)}
                  error={errors.profession}
                  options={[
                    "Farmer",
                    "Business",
                    "Traider",
                    "Self-Employed",
                    "Student",
                    "Retired",
                    "Other",
                  ]}
                  required={isConfirmed}
                />

                {enquiry.profession === "Other" && (
                  <EditableField
                    label="Custom Profession"
                    value={enquiry.customProfession || ""}
                    isEditing={isEditing && isConfirmed}
                    onChange={(val: any) => onChange("customProfession", val)}
                    error={errors.customProfession}
                    required={isConfirmed}
                  />
                )}

                <EditableSelect
                  icon={<BookOpen size={14} />}
                  label="Share Market Knowledge"
                  value={enquiry.knowledgeOfShareMarket || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) =>
                    onChange("knowledgeOfShareMarket", val)
                  }
                  error={errors.knowledgeOfShareMarket}
                  options={[
                    "Fresher",
                    "Intermediate",
                    "Advanced",
                    "Professional",
                  ]}
                  required={isConfirmed}
                />

                <EditableSelect
                  label="How did you know about us?"
                  value={enquiry.howDidYouKnow || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("howDidYouKnow", val)}
                  error={errors.howDidYouKnow}
                  options={[
                    "Google Search",
                    "Facebook",
                    "Instagram",
                    "LinkedIn",
                    "Friend/Family",
                    "Advertisement",
                    "Other",
                  ]}
                  required={isConfirmed}
                />

                {enquiry.howDidYouKnow === "Other" && (
                  <EditableField
                    label="Custom Source"
                    value={enquiry.customHowDidYouKnow || ""}
                    isEditing={isEditing && isConfirmed}
                    onChange={(val: any) =>
                      onChange("customHowDidYouKnow", val)
                    }
                    error={errors.customHowDidYouKnow}
                    required={isConfirmed}
                  />
                )}
              </EditableSection>
            )}

            {/* Important Dates */}
            {(isConfirmed || !isEditing) && (
              <EditableSection
                title="Important Dates"
                icon={<Calendar size={18} />}
              >
                <EditableField
                  icon={<Calendar size={14} />}
                  label="Deposit Inward Date"
                  value={
                    isEditing
                      ? formatDateForInput(enquiry.depositInwardDate || "")
                      : enquiry.depositInwardDate
                      ? formatDate(enquiry.depositInwardDate)
                      : ""
                  }
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("depositInwardDate", val)}
                  error={errors.depositInwardDate}
                  type={isEditing ? "date" : "text"}
                  required={isConfirmed}
                />

                <EditableField
                  icon={<Calendar size={14} />}
                  label="Deposit Outward Date"
                  value={
                    isEditing
                      ? formatDateForInput(enquiry.depositOutwardDate || "")
                      : enquiry.depositOutwardDate
                      ? formatDate(enquiry.depositOutwardDate)
                      : ""
                  }
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("depositOutwardDate", val)}
                  error={errors.depositOutwardDate}
                  type={isEditing ? "date" : "text"}
                  required={isConfirmed}
                />
              </EditableSection>
            )}

            {/* Additional Information */}
            <EditableSection
              title="Additional Information"
              icon={<Info size={18} />}
            >
              <div className="py-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                  <Clock size={12} />
                  Enquiry Created
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-800">
                  {formatDate(enquiry.createdAt)}
                </p>
              </div>
              {enquiry.updatedAt && enquiry.updatedAt !== enquiry.createdAt && (
                <div className="py-2">
                  <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    Last Updated
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    {formatDate(enquiry.updatedAt)}
                  </p>
                </div>
              )}
            </EditableSection>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors text-sm"
              >
                <Save size={16} />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={onEdit}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors text-sm"
              >
                <Pencil size={16} />
                Edit Follow Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EditableSection: React.FC<any> = ({ title, icon, children }) => (
  <div className="space-y-3 sm:space-y-4 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
    <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-300 pb-2">
      <span className="text-green-600">{icon}</span>
      {title}
    </h3>
    <div className="space-y-2 sm:space-y-3">{children}</div>
  </div>
);

const EditableField: React.FC<any> = ({
  icon,
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  error,
  required,
  maxLength,
}) => (
  <div className="flex items-start gap-2 sm:gap-3 py-2">
    {icon && <div className="text-gray-400 mt-2 sm:mt-2.5">{icon}</div>}
    <div className="flex-1 min-w-0">
      <label className="text-xs text-gray-500 mb-1 font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {isEditing ? (
        <div>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-green-200 focus:outline-none transition-all duration-200 ${
              error
                ? "border-red-400 focus:border-red-500"
                : "border-gray-300 focus:border-green-500"
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          {maxLength && (
            <p className="text-xs text-gray-400 mt-1">
              {value.length}/{maxLength} characters
            </p>
          )}
        </div>
      ) : (
        <div className="text-xs sm:text-sm font-medium text-gray-800 break-words">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
      )}
    </div>
  </div>
);

const EditableSelect: React.FC<any> = ({
  icon,
  label,
  value,
  isEditing,
  onChange,
  options,
  colorClass,
  required,
  error,
}) => (
  <div className="flex items-start gap-2 sm:gap-3 py-2">
    {icon && <div className="text-gray-400 mt-2 sm:mt-2.5">{icon}</div>}
    <div className="flex-1 min-w-0">
      <label className="text-xs text-gray-500 mb-1 font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {isEditing ? (
        <div>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-green-200 focus:border-green-500 focus:outline-none transition-all duration-200 ${
              error ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select {label}</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      ) : (
        <div className="text-xs sm:text-sm font-medium text-gray-800">
          {colorClass ? (
            <span
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs ${colorClass}`}
            >
              {value}
            </span>
          ) : (
            value || <span className="text-gray-400 italic">Not selected</span>
          )}
        </div>
      )}
    </div>
  </div>
);

const EditableTextArea: React.FC<any> = ({
  icon,
  label,
  value,
  isEditing,
  onChange,
  rows = 3,
  error,
  required,
}) => (
  <div className="flex items-start gap-2 sm:gap-3 py-2">
    {icon && <div className="text-gray-400 mt-2 sm:mt-2.5">{icon}</div>}
    <div className="flex-1 min-w-0">
      <label className="text-xs text-gray-500 mb-1 font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {isEditing ? (
        <div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className={`w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-green-200 focus:outline-none resize-none transition-all duration-200 ${
              error
                ? "border-red-400 focus:border-red-500"
                : "border-gray-300 focus:border-green-500"
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      ) : (
        <div className="text-xs sm:text-sm font-medium text-gray-800 whitespace-pre-wrap break-words">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
      )}
    </div>
  </div>
);

const Toast: React.FC<any> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "warning"
      ? "bg-yellow-600"
      : "bg-red-600";

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg animate-slide-in ${bgColor} text-white max-w-md`}
    >
      {type === "success" ? (
        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      ) : type === "warning" ? (
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={14} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

export default FollowUps;
