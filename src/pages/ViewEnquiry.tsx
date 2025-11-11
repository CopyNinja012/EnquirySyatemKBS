import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  RefreshCw,
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User,
  Briefcase,
  BookOpen,
  Save,
  Pencil,
  Trash2,
  Clock,
  FileText,
  Info,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { storageUtils, type EnquiryData } from "../utils/localStorage";
import { useAuth } from "../contexts/AuthContext";

// ========== Validation Functions ==========
const ValidationHelpers = {
  // Validate Full Name
  validateFullName: (name: string): string => {
    if (!name.trim()) {
      return "Full name is required";
    }
    if (name.trim().length < 3) {
      return "Name must be at least 3 characters";
    }
    if (!/^[a-zA-Z\s.]+$/.test(name)) {
      return "Name can only contain letters, spaces, and dots";
    }
    if (name.trim().length > 100) {
      return "Name must not exceed 100 characters";
    }
    return "";
  },

  // Validate Mobile Number
  validateMobile: (mobile: string, fieldName: string = "Mobile"): string => {
    if (!mobile.trim()) {
      return `${fieldName} number is required`;
    }
    if (!/^\d{10}$/.test(mobile)) {
      return `${fieldName} number must be exactly 10 digits`;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return `${fieldName} number must start with 6, 7, 8, or 9`;
    }
    return "";
  },

  // Validate Email
  validateEmail: (email: string): string => {
    if (!email.trim()) {
      return "Email address is required";
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    if (email.length > 100) {
      return "Email must not exceed 100 characters";
    }
    return "";
  },

  // Validate Aadhar Number
  validateAadhar: (aadhar: string): string => {
    if (!aadhar.trim()) {
      return "Aadhar number is required";
    }
    const cleanAadhar = aadhar.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhar)) {
      return "Aadhar number must be exactly 12 digits";
    }
    if (cleanAadhar === "000000000000" || cleanAadhar === "111111111111") {
      return "Invalid Aadhar number format";
    }
    return "";
  },

  // Validate PAN Number
  validatePAN: (pan: string): string => {
    if (!pan.trim()) {
      return "PAN number is required";
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      return "Invalid PAN format (e.g., ABCDE1234F)";
    }
    const fourthChar = pan.charAt(3).toUpperCase();
    const validFourthChars = ["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"];
    if (!validFourthChars.includes(fourthChar)) {
      return "Invalid PAN number - 4th character must be P, C, H, F, A, T, B, L, J, or G";
    }
    return "";
  },

  // Validate Address
  validateAddress: (address: string): string => {
    if (!address.trim()) {
      return "Address is required";
    }
    if (address.trim().length < 10) {
      return "Address must be at least 10 characters";
    }
    if (address.trim().length > 500) {
      return "Address must not exceed 500 characters";
    }
    return "";
  },

  // Validate Demat Account
  validateDematAccount: (
    account: string,
    isRequired: boolean = true
  ): string => {
    if (!account.trim()) {
      return isRequired ? "Demat account ID is required" : "";
    }
    if (account.trim().length < 8) {
      return "Demat account ID must be at least 8 characters";
    }
    if (account.trim().length > 16) {
      return "Demat account ID must not exceed 16 characters";
    }
    if (!/^[A-Z0-9]+$/.test(account.toUpperCase())) {
      return "Demat account ID can only contain letters and numbers";
    }
    return "";
  },

  // Validate Date
  validateDate: (
    date: string,
    fieldName: string,
    allowPast: boolean = false
  ): string => {
    if (!date) {
      return `${fieldName} is required`;
    }
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      return `Invalid ${fieldName.toLowerCase()}`;
    }

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

  // Get interest level percentage
  getInterestPercentage: (interestedStatus: string): number => {
    if (interestedStatus?.includes("100%")) return 100;
    if (interestedStatus?.includes("75%")) return 75;
    if (interestedStatus?.includes("50%")) return 50;
    if (interestedStatus?.includes("25%")) return 25;
    return 0;
  },

  // Validate status and interest compatibility
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

const ViewEnquiry: React.FC = () => {
  const { canDelete } = useAuth();

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<EnquiryData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [interestFilter, setInterestFilter] = useState<string | null>(null);
  const [activeStatCard, setActiveStatCard] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryData | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editFormData, setEditFormData] = useState<EnquiryData | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

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
    loadEnquiries();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [searchTerm, statusFilter, stateFilter, interestFilter, enquiries]);

  const loadEnquiries = async () => {
    setIsLoading(true);
    try {
      const data = await storageUtils.getAllEnquiries();

      if (!data || !Array.isArray(data)) {
        console.warn("⚠️ No valid data returned from storage");
        setEnquiries([]);
        setFilteredEnquiries([]);
        return;
      }

      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setEnquiries(sortedData);
      setFilteredEnquiries(sortedData);
    } catch (error) {
      console.error("❌ Error loading enquiries:", error);
      showToast("Failed to load enquiries", "error");
      setEnquiries([]);
      setFilteredEnquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadEnquiries();
      showToast("Enquiries refreshed successfully", "success");
    } catch (error) {
      console.error("❌ Error refreshing:", error);
      showToast("Failed to refresh enquiries", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filterEnquiries = () => {
    let filtered = [...enquiries];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (enq) =>
          enq.fullName.toLowerCase().includes(term) ||
          enq.mobile.includes(term) ||
          enq.email.toLowerCase().includes(term) ||
          enq.id.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((enq) => enq.status === statusFilter);
    }

    if (stateFilter !== "All") {
      filtered = filtered.filter((enq) => enq.enquiryState === stateFilter);
    }

    // Filter by interest level (for low interest)
    if (interestFilter === "low") {
      filtered = filtered.filter((enq) => {
        const interest = enq.interestedStatus;
        return interest?.includes("25%") || interest?.includes("0%");
      });
    }

    setFilteredEnquiries(filtered);
  };

  // Handle stat card click
  const handleStatCardClick = (type: string) => {
    setSearchTerm("");
    setStateFilter("All");

    if (activeStatCard === type) {
      setActiveStatCard(null);
      setStatusFilter("All");
      setInterestFilter(null);
    } else {
      setActiveStatCard(type);

      switch (type) {
        case "total":
          setStatusFilter("All");
          setInterestFilter(null);
          break;
        case "confirmed":
          setStatusFilter("Confirmed");
          setInterestFilter(null);
          break;
        case "pending":
          setStatusFilter("Pending");
          setInterestFilter("low");
          break;
        case "inProcess":
          setStatusFilter("In Process");
          setInterestFilter(null);
          break;
      }
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setStateFilter("All");
    setInterestFilter(null);
    setActiveStatCard(null);
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
      // If status is set to "Pending", check interest level
      if (formattedValue === "Pending") {
        const currentInterestLevel = ValidationHelpers.getInterestPercentage(
          updatedData.interestedStatus
        );

        // If interest is more than 25%, reset it to 25%
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

      // If interest is 50% or more and status is Pending, change status to In Process
      if (interestLevel >= 50 && updatedData.status === "Pending") {
        updatedData.status = "In Process";
        showToast(
          "Status automatically changed to 'In Process' for higher interest level",
          "warning"
        );
      }
    }

    setEditFormData(updatedData);

    // Clear errors for changed fields
    const newErrors = { ...editErrors };
    delete newErrors[field];
    if (field === "status" || field === "interestedStatus") {
      delete newErrors.status;
      delete newErrors.interestedStatus;
    }
    setEditErrors(newErrors);
  };

  const validateField = async (
    field: keyof EnquiryData,
    value: string,
    currentEnquiry: EnquiryData
  ): Promise<string> => {
    let error = "";
    const isConfirmed = currentEnquiry.status === "Confirmed";

    switch (field) {
      case "fullName":
        error = ValidationHelpers.validateFullName(value);
        break;

      case "mobile":
        error = ValidationHelpers.validateMobile(value);
        if (!error) {
          const exists = await storageUtils.isMobileExists(value);
          if (exists && value !== selectedEnquiry?.mobile) {
            error = "⚠️ This mobile number is already registered";
          }
        }
        break;

      case "alternateMobile":
        if (value) {
          error = ValidationHelpers.validateMobile(value, "Alternate mobile");
          if (!error && value === currentEnquiry.mobile) {
            error = "Alternate mobile cannot be same as primary mobile";
          }
        }
        break;

      case "email":
        error = ValidationHelpers.validateEmail(value);
        if (!error) {
          const exists = await storageUtils.isEmailExists(value);
          if (exists && value !== selectedEnquiry?.email) {
            error = "⚠️ This email is already registered";
          }
        }
        break;

      case "address":
        error = ValidationHelpers.validateAddress(value);
        break;

      case "aadharNumber":
        if (isConfirmed) {
          error = ValidationHelpers.validateAadhar(value);
          if (!error) {
            const exists = await storageUtils.isAadharExists(value);
            if (exists && value !== selectedEnquiry?.aadharNumber) {
              error = "⚠️ This Aadhar number is already registered";
            }
          }
        }
        break;

      case "panNumber":
        if (isConfirmed) {
          error = ValidationHelpers.validatePAN(value);
          if (!error) {
            const exists = await storageUtils.isPANExists(value);
            if (exists && value !== selectedEnquiry?.panNumber) {
              error = "⚠️ This PAN number is already registered";
            }
          }
        }
        break;

      case "demateAccount1":
        if (isConfirmed) {
          error = ValidationHelpers.validateDematAccount(value, true);
        }
        break;

      case "demateAccount2":
        if (isConfirmed && value) {
          error = ValidationHelpers.validateDematAccount(value, false);
          if (!error && value === currentEnquiry.demateAccount1) {
            error = "Demat Account 2 cannot be same as Demat Account 1";
          }
        }
        break;

      case "callBackDate":
        error = ValidationHelpers.validateDate(value, "Call back date", true);
        break;

      case "depositInwardDate":
        if (isConfirmed) {
          error = ValidationHelpers.validateDate(
            value,
            "Deposit inward date",
            false
          );
        }
        break;

      case "depositOutwardDate":
        if (isConfirmed) {
          error = ValidationHelpers.validateDate(
            value,
            "Deposit outward date",
            false
          );
          if (!error && currentEnquiry.depositInwardDate) {
            const inward = new Date(currentEnquiry.depositInwardDate);
            const outward = new Date(value);
            if (outward < inward) {
              error = "Deposit outward date cannot be before inward date";
            }
          }
        }
        break;

      case "enquiryState":
        if (!value) error = "Please select a state";
        break;

      case "sourceOfEnquiry":
        if (isConfirmed && !value) error = "Please select source of enquiry";
        break;

      case "interestedStatus":
        if (!value) {
          error = "Please select interested status";
        } else {
          // Validate compatibility with status
          const compatibilityError =
            ValidationHelpers.validateStatusInterestCompatibility(
              currentEnquiry.status,
              value
            );
          if (compatibilityError) error = compatibilityError;
        }
        break;

      case "status":
        if (!value) {
          error = "Please select status";
        } else {
          // Validate compatibility with interest status
          const compatibilityError =
            ValidationHelpers.validateStatusInterestCompatibility(
              value,
              currentEnquiry.interestedStatus
            );
          if (compatibilityError) error = compatibilityError;
        }
        break;

      case "profession":
        if (isConfirmed && !value) error = "Please select profession";
        break;

      case "knowledgeOfShareMarket":
        if (isConfirmed && !value) error = "Please select knowledge level";
        break;

      case "howDidYouKnow":
        if (isConfirmed && !value) error = "Please select an option";
        break;

      case "customHowDidYouKnow":
        if (
          isConfirmed &&
          currentEnquiry.howDidYouKnow === "Other" &&
          !value.trim()
        ) {
          error = "Please specify how you knew about us";
        }
        break;

      case "customProfession":
        if (
          isConfirmed &&
          currentEnquiry.profession === "Other" &&
          !value.trim()
        ) {
          error = "Please specify your profession";
        }
        break;
    }

    return error;
  };

  const validateEditForm = async (): Promise<boolean> => {
    if (!editFormData) return false;

    const newErrors: Record<string, string> = {};
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
      const error = await validateField(
        field,
        editFormData[field] as string,
        editFormData
      );
      if (error) {
        newErrors[field] = error;
      }
    }

    // Validate confirmed-only fields if status is "Confirmed"
    if (isConfirmed) {
      for (const field of confirmedRequiredFields) {
        const error = await validateField(
          field,
          editFormData[field] as string,
          editFormData
        );
        if (error) {
          newErrors[field] = error;
        }
      }

      // Validate conditional fields
      if (editFormData.howDidYouKnow === "Other") {
        const error = await validateField(
          "customHowDidYouKnow",
          editFormData.customHowDidYouKnow || "",
          editFormData
        );
        if (error) newErrors.customHowDidYouKnow = error;
      }

      if (editFormData.profession === "Other") {
        const error = await validateField(
          "customProfession",
          editFormData.customProfession || "",
          editFormData
        );
        if (error) newErrors.customProfession = error;
      }

      if (editFormData.demateAccount2) {
        const error = await validateField(
          "demateAccount2",
          editFormData.demateAccount2,
          editFormData
        );
        if (error) newErrors.demateAccount2 = error;
      }
    }

    // Validate optional fields if they have values
    if (editFormData.alternateMobile) {
      const error = await validateField(
        "alternateMobile",
        editFormData.alternateMobile,
        editFormData
      );
      if (error) newErrors.alternateMobile = error;
    }

    // Final check for status-interest compatibility
    const compatibilityError =
      ValidationHelpers.validateStatusInterestCompatibility(
        editFormData.status,
        editFormData.interestedStatus
      );
    if (compatibilityError) {
      newErrors.status = compatibilityError;
      newErrors.interestedStatus = compatibilityError;
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        showToast("Enquiry updated successfully", "success");
        await loadEnquiries();
        setShowDetailsModal(false);
        setEditFormData(null);
        setIsEditing(false);
        setEditErrors({});
      } else {
        showToast("Failed to update enquiry", "error");
      }
    } catch (error) {
      console.error("❌ Error updating enquiry:", error);
      showToast("Error updating enquiry", "error");
    }
  };

  const handleDeleteClick = (enquiry: EnquiryData) => {
    if (!canDelete()) {
      showToast("You don't have permission to delete enquiries", "error");
      return;
    }

    setEnquiryToDelete(enquiry.id);
    setShowDeleteConfirm(true);
    setShowDetailsModal(false);
  };

  const confirmDelete = async () => {
    if (!enquiryToDelete) return;

    if (!canDelete()) {
      showToast("Only administrators can delete enquiries", "error");
      setShowDeleteConfirm(false);
      setEnquiryToDelete(null);
      return;
    }

    try {
      const success = await storageUtils.deleteEnquiry(enquiryToDelete);

      if (success) {
        showToast("Enquiry deleted successfully", "success");
        await loadEnquiries();
      } else {
        showToast("Failed to delete enquiry", "error");
      }
    } catch (error) {
      console.error("❌ Error deleting enquiry:", error);
      showToast("Error deleting enquiry", "error");
    } finally {
      setShowDeleteConfirm(false);
      setEnquiryToDelete(null);
    }
  };

  const handleExportCSV = () => {
    try {
      storageUtils.downloadCSVBackup();
      showToast("CSV exported successfully", "success");
    } catch (error) {
      showToast("Failed to export CSV", "error");
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

  const uniqueStates = Array.from(
    new Set(enquiries.map((e) => e.enquiryState))
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Permission Info Banner */}
        {!canDelete() && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  User Permissions
                </h4>
                <p className="text-xs text-blue-700">
                  You can view and edit enquiries, but deletion is restricted to
                  administrators only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-t-xl shadow-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                View Enquiries
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Manage and track all enquiries
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs sm:text-sm">
                <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="font-medium text-green-700 hidden sm:inline">
                  {currentDate || "Loading..."}
                </span>
                <span className="font-medium text-green-700 sm:hidden">
                  {currentDate
                    ? new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "..."}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm">
                <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="font-medium text-blue-700">
                  {currentTime || "Loading..."}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={`sm:w-4 sm:h-4 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <Download size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="bg-white border-x border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Enquiries"
              value={enquiries.length}
              color="blue"
              icon={<User size={20} className="sm:w-6 sm:h-6" />}
              onClick={() => handleStatCardClick("total")}
              isActive={activeStatCard === "total"}
            />
            <StatCard
              title="Confirmed"
              value={enquiries.filter((e) => e.status === "Confirmed").length}
              color="green"
              icon={<User size={20} className="sm:w-6 sm:h-6" />}
              onClick={() => handleStatCardClick("confirmed")}
              isActive={activeStatCard === "confirmed"}
            />
            <StatCard
              title="Pending"
              subtitle="(Low Interest)"
              value={
                enquiries.filter(
                  (e) =>
                    e.status === "Pending" &&
                    (e.interestedStatus?.includes("25%") ||
                      e.interestedStatus?.includes("0%"))
                ).length
              }
              color="yellow"
              icon={<User size={20} className="sm:w-6 sm:h-6" />}
              onClick={() => handleStatCardClick("pending")}
              isActive={activeStatCard === "pending"}
            />
            <StatCard
              title="In Process"
              value={enquiries.filter((e) => e.status === "In Process").length}
              color="purple"
              icon={<User size={20} className="sm:w-6 sm:h-6" />}
              onClick={() => handleStatCardClick("inProcess")}
              isActive={activeStatCard === "inProcess"}
            />
          </div>

          {/* Active Filter Indicator */}
          {activeStatCard && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Filter
                    size={16}
                    className="text-blue-600 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-xs sm:text-sm text-blue-700">
                    <strong>Active Filter:</strong>{" "}
                    {activeStatCard === "total" && "Showing all enquiries"}
                    {activeStatCard === "confirmed" &&
                      "Showing confirmed enquiries"}
                    {activeStatCard === "pending" &&
                      "Showing pending enquiries with 25% interest or below"}
                    {activeStatCard === "inProcess" &&
                      "Showing in-process enquiries"}
                  </p>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filters Section */}
        <div className="bg-white border-x border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Search size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Search & Filter
            </h2>
          </div>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Search by Name, Mobile, Email or ID
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 sm:h-11 border border-gray-300 rounded-lg pl-9 sm:pl-10 pr-10 text-xs sm:text-sm text-gray-900 placeholder-gray-400 
                  focus:ring-2 focus:ring-green-200 focus:border-green-500 hover:border-gray-400 focus:outline-none transition-all duration-200"
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
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-medium text-gray-700">
                  Filter by State
                </label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="h-10 sm:h-11 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white hover:border-gray-400 focus:outline-none transition-all duration-200"
                >
                  <option value="All">All States</option>
                  {uniqueStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-medium text-gray-700">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setActiveStatCard(null);
                  }}
                  className="h-10 sm:h-11 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white hover:border-gray-400 focus:outline-none transition-all duration-200"
                >
                  <option value="All">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="In Process">In Process</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredEnquiries.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {enquiries.length}
                </span>{" "}
                enquiries
              </p>
            </div>
          </div>
        </div>

        {/* Results Table Section */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
              All Enquiries
            </h3>
            <span className="text-xs text-gray-500">
              {filteredEnquiries.length} results
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No enquiries found
              </h3>
              <p className="text-gray-500 text-sm">
                {searchTerm || statusFilter !== "All" || stateFilter !== "All"
                  ? "Try adjusting your filters"
                  : "Start by adding your first enquiry"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Interest Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEnquiries.map((enquiry, i) => (
                      <tr
                        key={enquiry.id}
                        onClick={() => handleRowClick(enquiry)}
                        className={`cursor-pointer transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-green-50`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {enquiry.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {enquiry.mobile}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                          {enquiry.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {enquiry.enquiryState}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              enquiry.status
                            )}`}
                          >
                            {enquiry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getInterestedColor(
                              enquiry.interestedStatus
                            )}`}
                          >
                            {enquiry.interestedStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredEnquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    onClick={() => handleRowClick(enquiry)}
                    className="p-4 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {enquiry.fullName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {enquiry.id}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          enquiry.status
                        )}`}
                      >
                        {enquiry.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {enquiry.mobile}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} />
                        <span className="truncate">{enquiry.email}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getInterestedColor(
                            enquiry.interestedStatus
                          )}`}
                        >
                          {enquiry.interestedStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {enquiry.enquiryState}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
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
          onDelete={() => handleDeleteClick(editFormData)}
          getStatusColor={getStatusColor}
          getInterestedColor={getInterestedColor}
          canDelete={canDelete()}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

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

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  subtitle?: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}> = ({ title, subtitle, value, color, icon, onClick, isActive }) => {
  const colorClasses = {
    blue: {
      border: "border-blue-500",
      bg: "bg-blue-100",
      text: "text-blue-600",
      activeBg: "bg-blue-50",
      ring: "ring-blue-400",
      hoverBg: "hover:bg-blue-50",
    },
    green: {
      border: "border-green-500",
      bg: "bg-green-100",
      text: "text-green-600",
      activeBg: "bg-green-50",
      ring: "ring-green-400",
      hoverBg: "hover:bg-green-50",
    },
    yellow: {
      border: "border-yellow-500",
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      activeBg: "bg-yellow-50",
      ring: "ring-yellow-400",
      hoverBg: "hover:bg-yellow-50",
    },
    purple: {
      border: "border-purple-500",
      bg: "bg-purple-100",
      text: "text-purple-600",
      activeBg: "bg-purple-50",
      ring: "ring-purple-400",
      hoverBg: "hover:bg-purple-50",
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm p-3 sm:p-4 border-l-4 ${
        colors.border
      } 
        ${
          isActive ? `${colors.activeBg} ring-2 ${colors.ring}` : colors.hoverBg
        }
        transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 text-left w-full`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 truncate">{title}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              {subtitle}
            </p>
          )}
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
            {value}
          </p>
        </div>
        <div
          className={`p-2 sm:p-3 rounded-full ${colors.bg} ${colors.text} flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
      {isActive && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
            <Filter size={10} className="sm:w-3 sm:h-3" />
            Active Filter
          </p>
        </div>
      )}
    </button>
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
  onDelete,
  getStatusColor,
  getInterestedColor,
  canDelete = false,
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

  // Get filtered interest options based on status
  const getInterestedOptions = () => {
    const allOptions = [
      "100% Interested",
      "75% Interested",
      "50% Interested",
      "25% Interested",
      "0% Interested",
    ];

    // If status is Pending, only show 25% and 0%
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
              {isEditing ? "Edit Enquiry" : "Enquiry Details"}
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
            {/* Personal Information */}
            <EditableSection
              title="Personal Information"
              icon={<User size={18} className="sm:w-5 sm:h-5" />}
            >
              <EditableField
                icon={<User size={14} className="sm:w-4 sm:h-4" />}
                label="Full Name"
                value={enquiry.fullName}
                isEditing={isEditing}
                onChange={(val: any) => onChange("fullName", val)}
                error={errors.fullName}
                required
                maxLength={100}
              />
              <EditableField
                icon={<Phone size={14} className="sm:w-4 sm:h-4" />}
                label="Mobile Number"
                value={enquiry.mobile}
                isEditing={isEditing}
                onChange={(val: any) => onChange("mobile", val)}
                error={errors.mobile}
                maxLength={10}
                required
              />
              <EditableField
                icon={<Phone size={14} className="sm:w-4 sm:h-4" />}
                label="Alternate Mobile"
                value={enquiry.alternateMobile || ""}
                isEditing={isEditing}
                onChange={(val: any) => onChange("alternateMobile", val)}
                error={errors.alternateMobile}
                maxLength={10}
              />
              <EditableField
                icon={<Mail size={14} className="sm:w-4 sm:h-4" />}
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
                icon={<MapPin size={14} className="sm:w-4 sm:h-4" />}
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
                icon={<CreditCard size={18} className="sm:w-5 sm:h-5" />}
              >
                <EditableField
                  icon={<CreditCard size={14} className="sm:w-4 sm:h-4" />}
                  label="Aadhar Number"
                  value={enquiry.aadharNumber || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("aadharNumber", val)}
                  error={errors.aadharNumber}
                  maxLength={14}
                  required={isConfirmed}
                />
                <EditableField
                  icon={<CreditCard size={14} className="sm:w-4 sm:h-4" />}
                  label="PAN Number"
                  value={enquiry.panNumber || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("panNumber", val)}
                  error={errors.panNumber}
                  maxLength={10}
                  required={isConfirmed}
                />
                <EditableField
                  icon={<CreditCard size={14} className="sm:w-4 sm:h-4" />}
                  label="Demat Account ID 1"
                  value={enquiry.demateAccount1 || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("demateAccount1", val)}
                  error={errors.demateAccount1}
                  maxLength={16}
                  required={isConfirmed}
                />
                <EditableField
                  icon={<CreditCard size={14} className="sm:w-4 sm:h-4" />}
                  label="Demat Account ID 2"
                  value={enquiry.demateAccount2 || ""}
                  isEditing={isEditing && isConfirmed}
                  onChange={(val: any) => onChange("demateAccount2", val)}
                  error={errors.demateAccount2}
                  maxLength={16}
                />
              </EditableSection>
            )}

            {/* Enquiry Details */}
            <EditableSection
              title="Enquiry Details"
              icon={<Briefcase size={18} className="sm:w-5 sm:h-5" />}
            >
              <EditableSelect
                icon={<MapPin size={14} className="sm:w-4 sm:h-4" />}
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
                icon={<BookOpen size={18} className="sm:w-5 sm:h-5" />}
              >
                <EditableSelect
                  icon={<Briefcase size={14} className="sm:w-4 sm:h-4" />}
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
                  icon={<BookOpen size={14} className="sm:w-4 sm:h-4" />}
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
            <EditableSection
              title="Important Dates"
              icon={<Calendar size={18} className="sm:w-5 sm:h-5" />}
            >
              <EditableField
                icon={<Calendar size={14} className="sm:w-4 sm:h-4" />}
                label="Call Back Date"
                value={
                  isEditing
                    ? formatDateForInput(enquiry.callBackDate || "")
                    : enquiry.callBackDate
                    ? formatDate(enquiry.callBackDate)
                    : ""
                }
                isEditing={isEditing}
                onChange={(val: any) => onChange("callBackDate", val)}
                error={errors.callBackDate}
                type={isEditing ? "date" : "text"}
                required
              />

              {(isConfirmed || !isEditing) && (
                <>
                  <EditableField
                    icon={<Calendar size={14} className="sm:w-4 sm:h-4" />}
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
                    icon={<Calendar size={14} className="sm:w-4 sm:h-4" />}
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
                </>
              )}
            </EditableSection>

            {/* Additional Information */}
            <EditableSection
              title="Additional Information"
              icon={<FileText size={18} className="sm:w-5 sm:h-5" />}
            >
              <div className="py-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                  <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                  Enquiry Created
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-800">
                  {formatDate(enquiry.createdAt)}
                </p>
              </div>
              {enquiry.updatedAt && enquiry.updatedAt !== enquiry.createdAt && (
                <div className="py-2">
                  <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
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
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row justify-between gap-3">
          {canDelete ? (
            <button
              onClick={onDelete}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
            >
              <Trash2 size={16} />
              Delete Enquiry
            </button>
          ) : (
            <div className="flex-1"></div>
          )}

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={onCancel}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors text-sm"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-sm"
                >
                  Close
                </button>
                <button
                  onClick={onEdit}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors text-sm"
                >
                  <Pencil size={16} />
                  Edit
                </button>
              </>
            )}
          </div>
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

const DeleteConfirmModal: React.FC<any> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-4">
        <div className="p-2 sm:p-3 bg-red-100 rounded-full">
          <Trash2 size={20} className="text-red-600 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Delete Enquiry
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            This action cannot be undone
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-6">
        Are you sure you want to delete this enquiry? All associated data will
        be permanently removed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Delete
        </button>
      </div>
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
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg animate-slide-in-right ${bgColor} text-white max-w-md`}
    >
      {type === "success" ? (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : type === "warning" ? (
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      ) : (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className="text-xs sm:text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={14} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

export default ViewEnquiry;
