import { firestoreDB } from "./database";

// ==========================================
// Types
// ==========================================
export type PaymentMode = "Online" | "Offline";

export interface PaymentEntry {
  id: string;
  date: string; // ISO date or yyyy-mm-dd
  amount: string; // stored as string in enquiry history
  mode: PaymentMode;
  method?: "Cash" | "Cheque";
  reference?: string; // txn id or cash/cheque number
  note?: string;
  createdBy?: string; // e.g., admin email/name
}

/**
 * Flat payment record for the global "payments" collection
 * used by PaymentDetails page.
 */
export interface PaymentRecord {
  id: string;
  enquiryId: string; // may be "" for manual payments
  enquiryName: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  offlineType?: "Cash" | "Cheque";
  reference?: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface EnquiryData {
  id: string;

  fullName: string;
  mobile: string;
  alternateMobile?: string;
  email: string;
  address: string;

  // Location
  enquiryState?: string;       // legacy
  enquiryDistrict?: string;    // new (used by UI)

  // Documents
  aadharNumber?: string;

  // Enquiry meta
  sourceOfEnquiry?: string;
  interestedStatus: string;
  status: "Pending" | "In Process" | "Confirmed";
  education?: string;
  customEducation?: string;

  // Knowledge fields (support both legacy and new)
  knowledgeOfDevelopment?: string; // legacy
  knowledgeOfAndroid?: string;     // new (used by UI)

  howDidYouKnow?: string;
  customHowDidYouKnow?: string;
  callBackDate: string;

  // Payment summary (string for form compatibility)
  totalFees?: string;
  paidFees?: string;
  remainingFees?: string;

  // Legacy/aux fields (kept for compatibility)
  paymentDate?: string;
  paymentMode?: "Online" | "Offline" | "";
  transactionNumber?: string;
  cashChequeNumber?: string;
  paymentAmount?: string;
  transactionId?: string;

  // New UI-specific payment fields
  paidFessDate?: string; // from AddEnquiry (note spelling)
  offlinePaymentType?: "" | "Cash" | "Cheque";
  onlineTransactionId?: string;
  chequeNumber?: string;

  // Entry-wise payment history for this enquiry
  paymentHistory?: PaymentEntry[];

  createdAt: string;
  updatedAt: string;
}

// Statistics interface
export interface EnquiryStatistics {
  total: number;
  confirmed: number;
  pending: number;
  inProcess: number;
}

// Payment statistics interface
export interface PaymentStatistics {
  totalFees: number;
  totalPaid: number;
  totalRemaining: number;
  paidEnquiries: number;
  unpaidEnquiries: number;
}

// Duplicate check result interface
export interface DuplicateCheck {
  field: string;
  message: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Bulk import result interface
export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

// ==========================================
// Helpers (auth, permissions)
// ==========================================
const getCurrentUser = () => {
  try {
    const currentUserStr = sessionStorage.getItem("auth_current_user");
    if (!currentUserStr) return null;
    return JSON.parse(currentUserStr);
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

const checkDeletePermission = (): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error("No user logged in");
    return false;
  }
  if (currentUser.role !== "admin") {
    console.error("User does not have permission to delete");
    return false;
  }
  return true;
};

// Defaults/migration helpers
const safeStr = (v: any, def: string = "") =>
  v === undefined || v === null ? def : String(v);
const toNum = (s?: string) => Number(s || 0);
const sumPayments = (history: PaymentEntry[] = []) =>
  history.reduce((sum, p) => sum + Number(p.amount || 0), 0);

// Normalize/migrate an enquiry to ensure payment + field aliases are consistent
const migrateEnquiry = (e: any): EnquiryData => {
  const history: PaymentEntry[] = Array.isArray(e.paymentHistory)
    ? e.paymentHistory
    : [];

  const total = safeStr(e.totalFees);
  const paidFromHistory = sumPayments(history);

  // If there is any payment history, derive paid from history; otherwise respect stored paid
  const paid = history.length ? String(paidFromHistory) : safeStr(e.paidFees, "0");
  const remaining =
    total !== "" ? String(Math.max(toNum(total) - toNum(paid), 0)) : "";

  // Field aliases between old/new names
  const enquiryDistrict = safeStr(e.enquiryDistrict || e.enquiryState, "");
  const enquiryState = safeStr(e.enquiryState || e.enquiryDistrict, "");

  const knowledgeOfAndroid = safeStr(
    e.knowledgeOfAndroid || e.knowledgeOfDevelopment,
    ""
  );
  const knowledgeOfDevelopment = safeStr(
    e.knowledgeOfDevelopment || e.knowledgeOfAndroid,
    ""
  );

  return {
    ...e,
    enquiryDistrict,
    enquiryState,
    knowledgeOfAndroid,
    knowledgeOfDevelopment,
    totalFees: total,
    paidFees: paid,
    remainingFees: remaining,
    paymentHistory: history,
  } as EnquiryData;
};

// ==========================================
// Payments collection helpers
// ==========================================
async function getPayments(): Promise<PaymentRecord[]> {
  try {
    const payments = await firestoreDB.payments.getAll();
    return (payments as PaymentRecord[]) || [];
  } catch (error) {
    console.error("❌ Error fetching payments:", error);
    return [];
  }
}

async function savePayment(
  payment: Omit<PaymentRecord, "id" | "createdAt">
): Promise<PaymentRecord | null> {
  try {
    const newPayment: Omit<PaymentRecord, "id"> = {
      ...payment,
      createdAt: new Date().toISOString(),
    };
    const result = await firestoreDB.payments.add(newPayment);
    if (result.success && result.id) {
      return { ...newPayment, id: result.id };
    }
    throw new Error("Failed to save payment");
  } catch (error) {
    console.error("❌ Error saving payment:", error);
    return null;
  }
}

// ==========================================
// Main storage utils
// ==========================================
export const storageUtils = {
  // ===========================
  // Payment helpers (global)
  // ===========================
  getPayments,
  savePayment,

  // Get all enquiries + migrate defaults/aliases
  getAllEnquiries: async (): Promise<EnquiryData[]> => {
    try {
      const enquiries = await firestoreDB.enquiries.getAll();
      return (enquiries as any[]).map(migrateEnquiry);
    } catch (error) {
      console.error("Error reading enquiries:", error);
      return [];
    }
  },

  // Save new enquiry (initialize fees + paymentHistory + optional payments collection)
 saveEnquiry: async (
  enquiry: Omit<EnquiryData, "id" | "createdAt" | "updatedAt">
): Promise<EnquiryData> => {
  try {
    const initHistory: PaymentEntry[] = Array.isArray(
      (enquiry as any).paymentHistory
    )
      ? ((enquiry as any).paymentHistory as PaymentEntry[])
      : [];

    const total = safeStr((enquiry as any).totalFees);
    const paidFromHistory = sumPayments(initHistory);
    const paid = initHistory.length
      ? String(paidFromHistory)
      : safeStr((enquiry as any).paidFees, "0");
    const remaining =
      total !== "" ? String(Math.max(toNum(total) - toNum(paid), 0)) : "";

    const now = new Date().toISOString();

    const newEnquiry: any = {
      ...enquiry,
      totalFees: total,
      paidFees: paid,
      remainingFees: remaining,
      paymentHistory: initHistory,
      createdAt: now,     // ✅ just use now
      updatedAt: now,     // ✅ just use now
    };

    const result = await firestoreDB.enquiries.add(newEnquiry);
    if (result.success && result.id) {
      const enquiryId = result.id;
      const savedEnquiry = migrateEnquiry({ ...newEnquiry, id: enquiryId });

      // ... rest of your logic

      return savedEnquiry;
    } else {
      throw new Error("Failed to save enquiry");
    }
  } catch (error) {
    console.error("❌ Error saving enquiry:", error);
    throw error;
  }
},

  // Update existing enquiry (deep-merge + recalc paid/remaining from history if present)
  updateEnquiry: async (
    id: string,
    updatedData: Partial<EnquiryData>
  ): Promise<EnquiryData | null> => {
    try {
      const all = await firestoreDB.enquiries.getAll();
      const prev = (all as any[]).find((enq) => enq.id === id);
      if (!prev) return null;

      const mergedHistory: PaymentEntry[] =
        (updatedData as any).paymentHistory !== undefined
          ? ((updatedData as any).paymentHistory as PaymentEntry[]) || []
          : (prev.paymentHistory || []);

      const total =
        updatedData.totalFees !== undefined
          ? safeStr(updatedData.totalFees)
          : safeStr(prev.totalFees);

      const paidFromHistory = sumPayments(mergedHistory);

      // If history exists, paid from history; otherwise respect provided/stored paid
      const paid = mergedHistory.length
        ? String(paidFromHistory)
        : updatedData.paidFees !== undefined
        ? safeStr(updatedData.paidFees)
        : safeStr(prev.paidFees, "0");

      const remaining =
        total !== "" ? String(Math.max(toNum(total) - toNum(paid), 0)) : "";

      const merged: any = {
        ...prev,
        ...updatedData,
        paymentHistory: mergedHistory,
        totalFees: total,
        paidFees: paid,
        remainingFees: remaining,
        updatedAt: new Date().toISOString(),
      };

      const result = await firestoreDB.enquiries.update(id, merged);
      if (result.success) {
        return migrateEnquiry(merged);
      }
      return null;
    } catch (error) {
      console.error("❌ Error updating enquiry:", error);
      throw error;
    }
  },

  // Add a payment entry to an enquiry (append + recalc from full history + mirror to payments collection)
  addPayment: async (
    id: string,
    entry: Omit<PaymentEntry, "id" | "createdBy"> & { createdBy?: string }
  ): Promise<EnquiryData | null> => {
    try {
      const all = await storageUtils.getAllEnquiries(); // returns migrated data
      const prev = all.find((e) => e.id === id);
      if (!prev) return null;

      const total = toNum(prev.totalFees);
      if (!total || total <= 0) {
        throw new Error("Total fees must be set before adding a payment");
      }

      const newEntry: PaymentEntry = {
        id: `PMT-${Date.now()
          .toString(36)
          .toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        date: entry.date,
        amount: entry.amount,
        mode: entry.mode,
        method: entry.method,
        reference: entry.reference,
        note: entry.note,
        createdBy: entry.createdBy || getCurrentUser()?.email || "admin",
      };

      const newHistory = [...(prev.paymentHistory || []), newEntry];
      const newPaidNum = sumPayments(newHistory);

      if (newPaidNum > total) {
        throw new Error("Payment exceeds total fees");
      }

      const updatedFields = {
        paymentHistory: newHistory,
        paidFees: String(newPaidNum),
        remainingFees: String(Math.max(total - newPaidNum, 0)),
        updatedAt: new Date().toISOString(),
      };

      const saved = await firestoreDB.enquiries.update(id, updatedFields);
      if (saved.success) {
        const merged = { ...prev, ...updatedFields };

        // Mirror this payment to global payments collection
        const amountNum = Number(newEntry.amount || "0");
        if (amountNum > 0) {
          await savePayment({
            enquiryId: id,
            enquiryName: prev.fullName,
            date: newEntry.date,
            amount: amountNum,
            mode: newEntry.mode,
            offlineType: newEntry.method,
            reference: newEntry.reference,
            note: newEntry.note,
            createdBy: newEntry.createdBy,
          });
        }

        return migrateEnquiry(merged);
      }
      return null;
    } catch (error) {
      console.error("❌ Error adding payment:", error);
      throw error;
    }
  },

  // Delete enquiry (with permission check)
  deleteEnquiry: async (id: string): Promise<boolean> => {
    try {
      if (!checkDeletePermission()) {
        alert(
          "You don't have permission to delete enquiries. Only administrators can delete records."
        );
        return false;
      }
      const result = await firestoreDB.enquiries.delete(id);
      return !!result.success;
    } catch (error) {
      console.error("❌ Error deleting enquiry:", error);
      return false;
    }
  },

  // Get enquiry by ID
  getEnquiryById: async (id: string): Promise<EnquiryData | null> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      return enquiries.find((enq) => enq.id === id) || null;
    } catch (error) {
      console.error("❌ Error getting enquiry by ID:", error);
      return null;
    }
  },

  // Search enquiries
  searchEnquiries: async (searchTerm: string): Promise<EnquiryData[]> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const lowerSearchTerm = searchTerm.toLowerCase();
      return enquiries.filter(
        (enq) =>
          enq.fullName.toLowerCase().includes(lowerSearchTerm) ||
          enq.mobile.includes(searchTerm) ||
          enq.email.toLowerCase().includes(lowerSearchTerm) ||
          enq.id.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error("❌ Error searching enquiries:", error);
      return [];
    }
  },

  // Stats
  getStatistics: async (): Promise<EnquiryStatistics> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      return {
        total: enquiries.length,
        confirmed: enquiries.filter((e) => e.status === "Confirmed").length,
        pending: enquiries.filter((e) => e.status === "Pending").length,
        inProcess: enquiries.filter((e) => e.status === "In Process").length,
      };
    } catch (error) {
      console.error("❌ Error getting statistics:", error);
      return { total: 0, confirmed: 0, pending: 0, inProcess: 0 };
    }
  },

  // Export data as JSON
  exportData: async (): Promise<string> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      return JSON.stringify(enquiries, null, 2);
    } catch (error) {
      console.error("❌ Error exporting data:", error);
      return "[]";
    }
  },

  // Download CSV backup (enquiries)
  downloadCSVBackup: async (): Promise<void> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      if (enquiries.length === 0) {
        alert("No enquiries to export");
        return;
      }

      const headers: string[] = [
        "ID",
        "Full Name",
        "Mobile",
        "Alternate Mobile",
        "Email",
        "Address",
        "District",
        "Aadhar Number",
        "Source",
        "Interest Level",
        "Status",
        "Education",
        "Custom Education",
        "Development / Domain Knowledge",
        "How Did You Know",
        "Custom Source",
        "Call Back Date",
        "Total Fees",
        "Paid Fees",
        "Remaining Fees",
        "Payment Date",
        "Payment Mode",
        "Transaction Number",
        "Cash/Cheque Number",
        "Created At",
        "Updated At",
      ];

      const rows: string[][] = enquiries.map((e: EnquiryData): string[] => [
        e.id || "",
        e.fullName || "",
        e.mobile || "",
        e.alternateMobile || "",
        e.email || "",
        e.address || "",
        e.enquiryDistrict || e.enquiryState || "",
        e.aadharNumber || "",
        e.sourceOfEnquiry || "",
        e.interestedStatus || "",
        e.status || "",
        e.education || "",
        e.customEducation || "",
        e.knowledgeOfAndroid || e.knowledgeOfDevelopment || "",
        e.howDidYouKnow || "",
        e.customHowDidYouKnow || "",
        e.callBackDate || "",
        e.totalFees || "",
        e.paidFees || "",
        e.remainingFees || "",
        e.paymentDate || e.paidFessDate || "",
        e.paymentMode || "",
        e.transactionNumber || e.transactionId || "",
        e.cashChequeNumber || e.chequeNumber || "",
        e.createdAt || "",
        e.updatedAt || "",
      ]);

      const csvContent: string = [
        headers.join(","),
        ...rows.map((row: string[]) =>
          row
            .map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `enquiries_backup_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✅ CSV exported successfully");
    } catch (error) {
      console.error("❌ Error downloading CSV:", error);
      alert("Failed to export CSV. Please try again.");
    }
  },

  // Import data from JSON
  importData: async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        for (const enquiry of data) {
          await firestoreDB.enquiries.add(enquiry);
        }
        console.log("✅ Data imported successfully:", data.length, "records");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Error importing data:", error);
      return false;
    }
  },

  // Clear all data
  clearAllData: async (): Promise<void> => {
    try {
      if (
        window.confirm(
          "Are you sure you want to delete all enquiries? This action cannot be undone."
        )
      ) {
        const enquiries = await storageUtils.getAllEnquiries();
        for (const enq of enquiries) {
          await firestoreDB.enquiries.delete(enq.id);
        }
        console.log("✅ All data cleared");
      }
    } catch (error) {
      console.error("❌ Error clearing data:", error);
    }
  },

  // Get enquiries by date range
  getEnquiriesByDateRange: async (
    startDate: string,
    endDate: string
  ): Promise<EnquiryData[]> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      return enquiries.filter((enq) => {
        const createdDate = new Date(enq.createdAt);
        return (
          createdDate >= new Date(startDate) &&
          createdDate <= new Date(endDate)
        );
      });
    } catch (error) {
      console.error("❌ Error getting enquiries by date range:", error);
      return [];
    }
  },

  // Get enquiries by status
  getEnquiriesByStatus: async (
    status: string
  ): Promise<EnquiryData[]> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      return enquiries.filter((enq) => enq.status === status);
    } catch (error) {
      console.error("❌ Error getting enquiries by status:", error);
      return [];
    }
  },

  // Enhanced unique checks
  isAadharExists: async (
    aadhar: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const cleanAadhar = aadhar.replace(/\s/g, "");
      return enquiries.some(
        (enq) =>
          enq.id !== excludeId &&
          enq.aadharNumber?.replace(/\s/g, "") === cleanAadhar
      );
    } catch (error) {
      console.error("❌ Error checking Aadhar existence:", error);
      return false;
    }
  },

  isMobileExists: async (
    mobile: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      return enquiries.some(
        (enq) => enq.id !== excludeId && enq.mobile === mobile
      );
    } catch (error) {
      console.error("❌ Error checking mobile existence:", error);
      return false;
    }
  },

  isEmailExists: async (
    email: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const cleanEmail = email.toLowerCase().trim();
      return enquiries.some(
        (enq) =>
          enq.id !== excludeId &&
          enq.email.toLowerCase().trim() === cleanEmail
      );
    } catch (error) {
      console.error("❌ Error checking email existence:", error);
      return false;
    }
  },

  // Duplicates
  checkDuplicates: async (
    formData: Partial<EnquiryData>,
    excludeId?: string
  ): Promise<DuplicateCheck[]> => {
    try {
      const duplicates: DuplicateCheck[] = [];

      if (formData.aadharNumber) {
        const exists = await storageUtils.isAadharExists(
          formData.aadharNumber,
          excludeId
        );
        if (exists)
          duplicates.push({
            field: "aadharNumber",
            message: "This Aadhar number is already registered",
          });
      }
      if (formData.mobile) {
        const exists = await storageUtils.isMobileExists(
          formData.mobile,
          excludeId
        );
        if (exists)
          duplicates.push({
            field: "mobile",
            message: "This mobile number is already registered",
          });
      }
      if (formData.email) {
        const exists = await storageUtils.isEmailExists(
          formData.email,
          excludeId
        );
        if (exists)
          duplicates.push({
            field: "email",
            message: "This email address is already registered",
          });
      }

      return duplicates;
    } catch (error) {
      console.error("❌ Error checking duplicates:", error);
      return [];
    }
  },

  // Get existing enquiry by aadhar/mobile/email
  getExistingEnquiry: async (
    aadhar?: string,
    mobile?: string,
    email?: string
  ): Promise<EnquiryData | null> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();

      if (aadhar) {
        const cleanAadhar = aadhar.replace(/\s/g, "");
        const found = enquiries.find(
          (enq) =>
            enq.aadharNumber?.replace(/\s/g, "") === cleanAadhar
        );
        if (found) return found;
      }
      if (mobile) {
        const found = enquiries.find((enq) => enq.mobile === mobile);
        if (found) return found;
      }
      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        const found = enquiries.find(
          (enq) =>
            enq.email.toLowerCase().trim() === cleanEmail
        );
        if (found) return found;
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting existing enquiry:", error);
      return null;
    }
  },

  // Follow-ups
  getTodayFollowUps: async (): Promise<EnquiryData[]> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return enquiries.filter((enq) => {
        if (!enq.callBackDate) return false;
        const callBackDate = new Date(enq.callBackDate);
        callBackDate.setHours(0, 0, 0, 0);
        return callBackDate.getTime() === today.getTime();
      });
    } catch (error) {
      console.error("❌ Error getting today's follow-ups:", error);
      return [];
    }
  },

  getAllFollowUps: async (): Promise<EnquiryData[]> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return enquiries.filter((enq) => {
        if (!enq.callBackDate) return false;
        const callBackDate = new Date(enq.callBackDate);
        callBackDate.setHours(0, 0, 0, 0);
        return callBackDate >= today;
      });
    } catch (error) {
      console.error("❌ Error getting upcoming follow-ups:", error);
      return [];
    }
  },

  getOverdueFollowUps: async (): Promise<EnquiryData[]> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return enquiries.filter((enq) => {
        if (!enq.callBackDate) return false;
        const callBackDate = new Date(enq.callBackDate);
        callBackDate.setHours(0, 0, 0, 0);
        return callBackDate < today;
      });
    } catch (error) {
      console.error("❌ Error getting overdue follow-ups:", error);
      return [];
    }
  },

  // Unique validation
  validateUniqueFields: async (
    formData: Partial<EnquiryData>,
    excludeId?: string
  ): Promise<ValidationResult> => {
    try {
      const errors: string[] = [];

      if (formData.aadharNumber) {
        const exists = await storageUtils.isAadharExists(
          formData.aadharNumber,
          excludeId
        );
        if (exists) errors.push("Aadhar number already exists");
      }
      if (formData.mobile) {
        const exists = await storageUtils.isMobileExists(
          formData.mobile,
          excludeId
        );
        if (exists) errors.push("Mobile number already exists");
      }
      if (formData.email) {
        const exists = await storageUtils.isEmailExists(
          formData.email,
          excludeId
        );
        if (exists) errors.push("Email address already exists");
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      console.error("❌ Error validating unique fields:", error);
      return { isValid: false, errors: ["Error validating fields"] };
    }
  },

  // Bulk import with duplicate checks
  bulkImportEnquiries: async (
    enquiries: Omit<EnquiryData, "id" | "createdAt" | "updatedAt">[]
  ): Promise<BulkImportResult> => {
    const result: BulkImportResult = { success: 0, failed: 0, errors: [] };
    try {
      for (let index = 0; index < enquiries.length; index++) {
        const enquiry = enquiries[index];
        try {
          const validation = await storageUtils.validateUniqueFields(
            enquiry
          );
          if (!validation.isValid) {
            result.failed++;
            result.errors.push({
              index,
              error: validation.errors.join(", "),
            });
            continue;
          }
          await storageUtils.saveEnquiry(enquiry);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            index,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error in bulk import:", error);
    }
    return result;
  },

  // Aggregations
  getEnquiriesByState: async (): Promise<Record<string, number>> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const stateCount: Record<string, number> = {};
      enquiries.forEach((enq) => {
        const key = enq.enquiryDistrict || enq.enquiryState;
        if (key)
          stateCount[key] = (stateCount[key] || 0) + 1;
      });
      return stateCount;
    } catch (error) {
      console.error("❌ Error getting enquiries by state:", error);
      return {};
    }
  },

  getEnquiriesByEducation: async (): Promise<Record<string, number>> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const educationCount: Record<string, number> = {};
      enquiries.forEach((enq) => {
        const education =
          enq.education === "Other" && enq.customEducation
            ? enq.customEducation
            : enq.education;
        if (education)
          educationCount[education] =
            (educationCount[education] || 0) + 1;
      });
      return educationCount;
    } catch (error) {
      console.error("❌ Error getting enquiries by education:", error);
      return {};
    }
  },

  // Advanced search
  advancedSearch: async (filters: {
    searchTerm?: string;
    status?: string;
    district?: string;
    education?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<EnquiryData[]> => {
    try {
      let enquiries = await storageUtils.getAllEnquiries();

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        enquiries = enquiries.filter(
          (enq) =>
            enq.fullName.toLowerCase().includes(term) ||
            enq.mobile.includes(filters.searchTerm!) ||
            enq.email.toLowerCase().includes(term) ||
            enq.id.toLowerCase().includes(term)
        );
      }
      if (filters.status)
        enquiries = enquiries.filter(
          (enq) => enq.status === filters.status
        );
      if (filters.district)
        enquiries = enquiries.filter(
          (enq) =>
            (enq.enquiryDistrict || enq.enquiryState) ===
            filters.district
        );
      if (filters.education)
        enquiries = enquiries.filter(
          (enq) => enq.education === filters.education
        );
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        enquiries = enquiries.filter(
          (enq) => new Date(enq.createdAt) >= fromDate
        );
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        enquiries = enquiries.filter(
          (enq) =>
            new Date(enq.createdAt) <= toDate
        );
      }

      return enquiries;
    } catch (error) {
      console.error("❌ Error in advanced search:", error);
      return [];
    }
  },

  // Payment statistics
  getPaymentStatistics: async (): Promise<PaymentStatistics> => {
    try {
      const enquiries = await storageUtils.getAllEnquiries();
      const stats: PaymentStatistics = {
        totalFees: 0,
        totalPaid: 0,
        totalRemaining: 0,
        paidEnquiries: 0,
        unpaidEnquiries: 0,
      };

      enquiries.forEach((enq) => {
        const total = parseFloat(enq.totalFees || "0");
        const paid = parseFloat(enq.paidFees || "0");
        const remaining = parseFloat(enq.remainingFees || "0");

        stats.totalFees += total;
        stats.totalPaid += paid;
        stats.totalRemaining += remaining;

        if (paid > 0) stats.paidEnquiries++;
        else if (total > 0) stats.unpaidEnquiries++;
      });

      return stats;
    } catch (error) {
      console.error("❌ Error getting payment statistics:", error);
      return {
        totalFees: 0,
        totalPaid: 0,
        totalRemaining: 0,
        paidEnquiries: 0,
        unpaidEnquiries: 0,
      };
    }
  },
};

// Helpers
export const generateUniqueId = (): string =>
  `ENQ-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;

export const canDeleteEnquiry = (): boolean => checkDeletePermission();
export const getCurrentUserInfo = () => getCurrentUser();

export default storageUtils;