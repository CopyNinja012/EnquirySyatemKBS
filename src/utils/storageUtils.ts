import { firestoreDB } from "./database";

/* ─────────────────────────────────────────────
   Types
─────────────────────────────────────────────── */

export interface PaymentHistoryItem {
  id: string;
  date: string;                 // ISO string or yyyy-mm-dd
  amount: string;               // keep as string (form stores string)
  mode: "Online" | "Offline";
  method?: "Cash" | "Cheque";
  reference?: string;           // txn id or cheque/cash ref
  note?: string;
  createdBy?: string;
}

export interface EnquiryData {
  id: string;

  // Basic info
  fullName: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  address: string;

  // Document
  aadharNumber: string;

  // Enquiry & meta
  enquiryDistrict: string;
  sourceOfEnquiry: string;
  interestedStatus: string;
  howDidYouKnow: string;
  customHowDidYouKnow: string;
  callBackDate: string;    // yyyy-mm-dd
  paidFessDate: string;    // yyyy-mm-dd (note spelling as in your form)
  status: string;          // "In Process" | "Confirmed" | "Pending"
  education: string;
  customEducation: string;
  knowledgeOfAndroid: string;

  // Payment summary
  totalFees: string;
  paidFees: string;
  remainingFees: string;
  paymentMode: "" | "Online" | "Offline";
  offlinePaymentType: "" | "Cash" | "Cheque";
  onlineTransactionId: string;
  chequeNumber: string;

  // Per‑enquiry payment history
  paymentHistory?: PaymentHistoryItem[];

  // System fields
  createdAt: string;
  updatedAt: string;
}

/** Global payments collection record (for Payment Details page) */
export interface PaymentRecord {
  id: string;
  enquiryId: string;
  enquiryName: string;
  date: string;
  amount: number;
  mode: "Online" | "Offline";
  offlineType?: "Cash" | "Cheque";
  note?: string;
  createdAt: string;
  createdBy?: string;
}

/* ─────────────────────────────────────────────
   Auth / permission helpers
─────────────────────────────────────────────── */

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

// Helper to sum payment history
const sumHistory = (hist: PaymentHistoryItem[] = []) =>
  hist.reduce((acc, p) => acc + Number(p.amount || "0"), 0);

/* ─────────────────────────────────────────────
   Payment functions (Firestore based)
─────────────────────────────────────────────── */

async function getPayments(): Promise<PaymentRecord[]> {
  try {
    const payments = await firestoreDB.payments.getAll();
    return (payments as PaymentRecord[]) || [];
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}

async function savePayment(
  payment: Omit<PaymentRecord, "id" | "createdAt">
): Promise<PaymentRecord | null> {
  try {
    // Build base object with createdAt
    const base: Omit<PaymentRecord, "id"> = {
      ...payment,
      createdAt: new Date().toISOString(),
    };

    // Remove all undefined fields (Firestore doesn't allow them)
    const newPayment: any = {};
    for (const [key, value] of Object.entries(base)) {
      if (value !== undefined) {
        newPayment[key] = value;
      }
    }

    const result = await firestoreDB.payments.add(newPayment);

    // Case 1: wrapper returns { success, id }
    if (result && "success" in result && result.success && result.id) {
      console.log("Payment saved successfully:", result.id);
      return { ...(newPayment as any), id: result.id } as PaymentRecord;
    }

    // Case 2: wrapper returns Firestore docRef directly
    if (result && (result as any).id) {
      console.log("Payment saved successfully (docRef):", (result as any).id);
      return {
        ...(newPayment as any),
        id: (result as any).id,
      } as PaymentRecord;
    }

    throw new Error("Failed to save payment");
  } catch (error) {
    console.error("Error saving payment:", error);
    return null;
  }
}

async function deletePayment(id: string): Promise<boolean> {
  try {
    if (!checkDeletePermission()) {
      alert("Only administrators can delete payments.");
      return false;
    }
    const confirmDel = window.confirm("Are you sure you want to delete?");
    if (!confirmDel) return false;

    const result = await firestoreDB.payments.delete(id);
    return !!result.success;
  } catch (error) {
    console.error("Error deleting payment:", error);
    return false;
  }
}

/* ─────────────────────────────────────────────
   Enquiry helpers – core CRUD
─────────────────────────────────────────────── */

async function getAllEnquiries(): Promise<EnquiryData[]> {
  try {
    const enquiries = await firestoreDB.enquiries.getAll();
    return enquiries as EnquiryData[];
  } catch (error) {
    console.error("Error reading enquiries:", error);
    return [];
  }
}

/**
 * Save a new enquiry.
 * Caller passes all fields except id.
 */
async function saveEnquiry(
  enquiry: Omit<EnquiryData, "id">
): Promise<EnquiryData> {
  try {
    const now = new Date().toISOString();

    const newEnquiry: Omit<EnquiryData, "id"> = {
      ...enquiry,
      createdAt: enquiry.createdAt || now,
      updatedAt: enquiry.updatedAt || now,
    };

    const result = await firestoreDB.enquiries.add(newEnquiry as any);
    if (result.success && result.id) {
      console.log("Enquiry saved successfully with ID:", result.id);
      const saved: EnquiryData = { ...(newEnquiry as EnquiryData), id: result.id };

      // If an initial payment history exists, mirror it into global payments
      if (saved.paymentHistory && saved.paymentHistory.length > 0) {
        const firstPayment = saved.paymentHistory[0];
        if (
          firstPayment &&
          firstPayment.amount &&
          Number(firstPayment.amount) > 0
        ) {
          await savePayment({
            enquiryId: saved.id,
            enquiryName: saved.fullName,
            date: firstPayment.date,
            amount: Number(firstPayment.amount),
            mode: firstPayment.mode,
            offlineType: firstPayment.method,
            note:
              firstPayment.note || "Initial payment recorded at registration",
            createdBy: firstPayment.createdBy || getCurrentUser()?.email,
          });
        }
      }

      return saved;
    } else {
      throw new Error("Failed to save enquiry");
    }
  } catch (error) {
    console.error("Error saving enquiry:", error);
    throw error;
  }
}

async function updateEnquiry(
  id: string,
  updatedData: Partial<EnquiryData>
): Promise<EnquiryData | null> {
  try {
    const dataToUpdate = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    const result = await firestoreDB.enquiries.update(id, dataToUpdate);
    if (result.success) {
      const enquiries = await firestoreDB.enquiries.getAll();
      const updated = (enquiries as EnquiryData[]).find((enq) => enq.id === id);
      console.log("Enquiry updated successfully:", updated);
      return updated || null;
    }
    return null;
  } catch (error) {
    console.error("Error updating enquiry:", error);
    throw error;
  }
}

async function deleteEnquiry(id: string): Promise<boolean> {
  try {
    if (!checkDeletePermission()) {
      alert(
        "You don't have permission to delete enquiries. Only administrators can delete records."
      );
      return false;
    }
    const confirmDel = window.confirm("Are you sure you want to delete?");
    if (!confirmDel) return false;

    const result = await firestoreDB.enquiries.delete(id);
    return !!result.success;
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    return false;
  }
}

async function getEnquiryById(id: string): Promise<EnquiryData | null> {
  const all = await getAllEnquiries();
  return all.find((e) => e.id === id) || null;
}

/* ─────────────────────────────────────────────
   Add payment to enquiry + recalc totals
─────────────────────────────────────────────── */

async function addPaymentToEnquiry(
  enquiryId: string,
  entry: {
    date: string;
    amount: string;                    // string as entered in form
    mode: "Online" | "Offline";
    method?: "Cash" | "Cheque";
    note?: string;
    createdBy?: string;
  }
): Promise<PaymentRecord | null> {
  try {
    const all = await getAllEnquiries();
    const prev = all.find((e) => e.id === enquiryId);
    if (!prev) throw new Error("Enquiry not found");

    // Build PaymentHistoryItem without undefined fields
    const newEntry: PaymentHistoryItem = {
      id:
        "PMT-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36).slice(2, 8).toUpperCase(),
      date: entry.date,
      amount: entry.amount,
      mode: entry.mode,
    };
    if (entry.method) newEntry.method = entry.method;
    if (entry.note) newEntry.note = entry.note;
    if (entry.createdBy) newEntry.createdBy = entry.createdBy;

    const history = [...(prev.paymentHistory || []), newEntry];

    const totalFeesNum = Number(prev.totalFees || "0");
    const totalPaidNum = sumHistory(history);
    const remainingNum =
      totalFeesNum > 0 ? Math.max(totalFeesNum - totalPaidNum, 0) : 0;

    const update: Partial<EnquiryData> = {
      paymentHistory: history,
      paidFees: String(totalPaidNum),
      remainingFees: String(remainingNum),
      updatedAt: new Date().toISOString(),
    };

    const result = await firestoreDB.enquiries.update(enquiryId, update);
    if (!result.success) {
      throw new Error("Failed to update enquiry for payment");
    }

    // Mirror payment to global payments collection
    const paymentRecord = await savePayment({
      enquiryId,
      enquiryName: prev.fullName,
      date: newEntry.date,
      amount: Number(newEntry.amount),
      mode: newEntry.mode,
      offlineType: newEntry.method,
      note: newEntry.note,
      createdBy: newEntry.createdBy || getCurrentUser()?.email,
    });

    return paymentRecord;
  } catch (error) {
    console.error("Error adding payment to enquiry:", error);
    return null;
  }
}

/* ─────────────────────────────────────────────
   Enquiry helpers – search & stats
─────────────────────────────────────────────── */

async function searchEnquiries(term: string): Promise<EnquiryData[]> {
  const all = await getAllEnquiries();
  const q = term.toLowerCase();

  return all.filter(
    (e) =>
      e.fullName.toLowerCase().includes(q) ||
      e.mobile.includes(term) ||
      e.email.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
  );
}

async function getStatistics() {
  const all = await getAllEnquiries();
  return {
    total: all.length,
    confirmed: all.filter((e) => e.status === "Confirmed").length,
    pending: all.filter((e) => e.status === "Pending").length,
    inProcess: all.filter((e) => e.status === "In Process").length,
  };
}

/* ─────────────────────────────────────────────
   Enquiry helpers – duplicate checks
─────────────────────────────────────────────── */

const normalizeAadhar = (val: string) => val.replace(/\s/g, "");

async function isMobileExists(mobile: string): Promise<boolean> {
  if (!mobile.trim()) return false;
  const all = await getAllEnquiries();
  return all.some((e) => e.mobile === mobile);
}

async function isEmailExists(email: string): Promise<boolean> {
  if (!email.trim()) return false;
  const emailLower = email.toLowerCase();
  const all = await getAllEnquiries();
  return all.some((e) => e.email.toLowerCase() === emailLower);
}

async function isAadharExists(aadhar: string): Promise<boolean> {
  if (!aadhar.trim()) return false;
  const clean = normalizeAadhar(aadhar);
  const all = await getAllEnquiries();
  return all.some(
    (e) => normalizeAadhar(e.aadharNumber || "") === clean
  );
}

/**
 * Get existing enquiry by aadhar/mobile/email (used for duplicate warning)
 */
async function getExistingEnquiry(value: string): Promise<EnquiryData | null> {
  if (!value.trim()) return null;
  const all = await getAllEnquiries();
  const cleanAadhar = normalizeAadhar(value);
  const lower = value.toLowerCase();

  return (
    all.find(
      (e) =>
        e.mobile === value ||
        e.email.toLowerCase() === lower ||
        normalizeAadhar(e.aadharNumber || "") === cleanAadhar
    ) || null
  );
}

/**
 * Check for any duplicate fields before submit.
 * Returns { field, message }[] used by AddEnquiry handleSubmit.
 */
async function checkDuplicates(
  data: Partial<EnquiryData> & { id?: string }
): Promise<{ field: string; message: string }[]> {
  const all = await getAllEnquiries();
  const duplicates: { field: string; message: string }[] = [];
  const currentId = data.id;

  const cleanAadharNew = data.aadharNumber
    ? normalizeAadhar(data.aadharNumber)
    : "";

  for (const enq of all) {
    if (currentId && enq.id === currentId) continue;

    if (data.mobile && enq.mobile === data.mobile) {
      duplicates.push({
        field: "mobile",
        message: "This mobile number is already registered",
      });
    }

    if (data.email && data.email.trim()) {
      if (enq.email.toLowerCase() === data.email.toLowerCase()) {
        duplicates.push({
          field: "email",
          message: "This email is already registered",
        });
      }
    }

    if (data.aadharNumber && data.aadharNumber.trim()) {
      const cleanExisting = normalizeAadhar(enq.aadharNumber || "");
      if (cleanExisting === cleanAadharNew) {
        duplicates.push({
          field: "aadharNumber",
          message: "This Aadhar number is already registered",
        });
      }
    }
  }

  // Remove duplicate entries for same field
  const seen = new Set<string>();
  return duplicates.filter((d) => {
    if (seen.has(d.field)) return false;
    seen.add(d.field);
    return true;
  });
}

/* ─────────────────────────────────────────────
   Main export object
─────────────────────────────────────────────── */

export const storageUtils = {
  // 💳 Payment helpers
  getPayments,
  savePayment,
  deletePayment,
  addPaymentToEnquiry,  // <-- new helper

  // 📋 Enquiry helpers (CRUD)
  getAllEnquiries,
  saveEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryById,

  // 🔍 Search & stats
  searchEnquiries,
  getStatistics,

  // ⚠️ Duplicate checks (used in AddEnquiry)
  isMobileExists,
  isEmailExists,
  isAadharExists,
  getExistingEnquiry,
  checkDuplicates,
};

/* ─────────────────────────────────────────────
   Small helper exports
─────────────────────────────────────────────── */

export const generateUniqueId = (): string =>
  `ENQ-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;

export const canDeleteEnquiry = (): boolean => checkDeletePermission();

export const getCurrentUserInfo = () => getCurrentUser();