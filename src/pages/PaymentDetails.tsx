import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { useAuth } from "../contexts/AuthContext";
import {
  storageUtils,
  type EnquiryData,
  type PaymentHistoryItem,
} from "../utils/storageUtils";
import "./animation.css";

interface FilterState {
  search: string;
}

interface ManualPaymentForm {
  date: string;
  amount: string;
  mode: "" | "Online" | "Offline";
  offlineType: "" | "Cash" | "Cheque";
  note: string;
}

const PaymentDetails: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManagePayments = hasPermission("Manage Payment Details");

  const [allEnquiries, setAllEnquiries] = useState<EnquiryData[]>([]);
  const [feeEnquiries, setFeeEnquiries] = useState<EnquiryData[]>([]);
  const [filtered, setFiltered] = useState<EnquiryData[]>([]);
  const [filter, setFilter] = useState<FilterState>({ search: "" });

  const [selected, setSelected] = useState<EnquiryData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const today = new Date().toISOString().split("T")[0];

  if (!canManagePayments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm">
          You do not have permission to view payment details.
        </p>
      </div>
    );
  }

  // Initial load – all enquiries + subset with fees
  useEffect(() => {
    (async () => {
      const all = await storageUtils.getAllEnquiries();
      setAllEnquiries(all);
      const withFees = all.filter(
        (e) =>
          (e.totalFees && Number(e.totalFees) > 0) ||
          (e.paymentHistory && e.paymentHistory.length > 0)
      );
      setFeeEnquiries(withFees);
      setFiltered(withFees);
    })();
  }, []);

  // Apply search on feeEnquiries for main table
  useEffect(() => {
    const q = filter.search.toLowerCase();
    let list = [...feeEnquiries];

    if (q) {
      list = list.filter((e) => {
        const edu =
          e.education === "Other" && e.customEducation
            ? e.customEducation
            : e.education;
        const combined = [
          e.fullName,
          e.mobile,
          e.email,
          edu || "",
        ]
          .join(" ")
          .toLowerCase();
        return combined.includes(q);
      });
    }

    setFiltered(list);
  }, [filter, feeEnquiries]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const openReceipt = (enquiry: EnquiryData) => {
    setSelected(enquiry);
    setShowReceipt(true);
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setSelected(null);
  };

  // Refresh enquiries after adding payment
  const refreshEnquiries = async () => {
    const all = await storageUtils.getAllEnquiries();
    setAllEnquiries(all);
    const withFees = all.filter(
      (e) =>
        (e.totalFees && Number(e.totalFees) > 0) ||
        (e.paymentHistory && e.paymentHistory.length > 0)
    );
    setFeeEnquiries(withFees);
    setFiltered(withFees);
    return all;
  };

  // Add payment to a given enquiry
  const addPaymentToEnquiry = async (
    enquiry: EnquiryData,
    form: ManualPaymentForm
  ) => {
    if (!form.amount || !form.mode) {
      showToast("Please enter amount and mode", "error");
      return;
    }

    try {
      const paymentRecord = await storageUtils.addPaymentToEnquiry(
        enquiry.id,
        {
          date: form.date,
          amount: form.amount,
          mode: form.mode as "Online" | "Offline",
          method:
            form.mode === "Offline"
              ? (form.offlineType || undefined)
              : undefined,
          note: form.note || "",
          createdBy: undefined,
        }
      );

      if (!paymentRecord) {
        showToast("Failed to add payment", "error");
        return;
      }

      const allUpdated = await refreshEnquiries();
      const newSelected =
        allUpdated.find((e) => e.id === enquiry.id) || null;
      setSelected(newSelected);

      showToast("Payment added successfully", "success");
    } catch {
      showToast("Error adding payment", "error");
    }
  };

  // Export single receipt as CSV
  const exportReceiptCSV = (enquiry: EnquiryData) => {
    const edu =
      enquiry.education === "Other" && enquiry.customEducation
        ? enquiry.customEducation
        : enquiry.education;

    const headers = [
      "Name",
      "Education",
      "TotalFees",
      "PaidFees",
      "RemainingFees",
      "PaymentDate",
      "PaymentAmount",
      "Mode",
      "OfflineType",
      "Note",
    ];

    const rows: string[][] = [];

    if (enquiry.paymentHistory && enquiry.paymentHistory.length > 0) {
      enquiry.paymentHistory.forEach((p) => {
        rows.push([
          enquiry.fullName,
          edu || "",
          enquiry.totalFees || "0",
          enquiry.paidFees || "0",
          enquiry.remainingFees || "0",
          p.date,
          p.amount,
          p.mode,
          p.method || "",
          p.note || "",
        ]);
      });
    } else {
      rows.push([
        enquiry.fullName,
        edu || "",
        enquiry.totalFees || "0",
        enquiry.paidFees || "0",
        enquiry.remainingFees || "0",
        "",
        "",
        "",
        "",
        "",
      ]);
    }

    const csv =
      headers.join(",") +
      "\n" +
      rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `receipt_${enquiry.id}.csv`
    );
  };

  // Export single receipt as PDF
  const exportReceiptPDF = (enquiry: EnquiryData) => {
    const doc = new jsPDF();
    let y = 15;

    const edu =
      enquiry.education === "Other" && enquiry.customEducation
        ? enquiry.customEducation
        : enquiry.education;

    doc.setFontSize(16);
    doc.text("Fee Receipt", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.text("Student / Enquiry Details:", 14, y);
    y += 6;

    doc.text(`Name: ${enquiry.fullName}`, 14, y);
    y += 5;
    doc.text(`Contact: ${enquiry.mobile} • ${enquiry.email}`, 14, y);
    y += 5;
    doc.text(`Education: ${edu || "-"}`, 14, y);
    y += 5;
    doc.text(`Status: ${enquiry.status}`, 14, y);
    y += 5;
    doc.text(`Next Follow-Up: ${enquiry.callBackDate || "-"}`, 14, y);
    y += 8;

    doc.text("Fee Summary:", 14, y);
    y += 6;
    doc.text(`Total Fees: ₹${enquiry.totalFees || "0"}`, 14, y);
    y += 5;
    doc.text(`Total Paid: ₹${enquiry.paidFees || "0"}`, 14, y);
    y += 5;
    doc.text(`Remaining: ₹${enquiry.remainingFees || "0"}`, 14, y);
    y += 8;

    doc.text("Payment Entries:", 14, y);
    y += 6;

    if (enquiry.paymentHistory && enquiry.paymentHistory.length > 0) {
      enquiry.paymentHistory.forEach((p) => {
        doc.text(
          `${p.date} | ₹${p.amount} | ${p.mode}${
            p.method ? " (" + p.method + ")" : ""
          } | ${p.note || "-"}`,
          14,
          y
        );
        y += 5;
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
      });
    } else {
      doc.text("No payment history available.", 14, y);
    }

    doc.save(`receipt_${enquiry.id}.pdf`);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-sm text-gray-500">
              One row per enquiry. Click a row to see all payment entries and
              full fee receipt.
            </p>
          </div>
          <button
            onClick={() => setShowManualAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add Payment
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-3 px-6 py-4 border-b bg-gray-50">
          <input
            type="search"
            placeholder="Search by name, mobile, email, education..."
            value={filter.search}
            onChange={(e) =>
              setFilter({ ...filter, search: e.target.value })
            }
            className="flex-1 min-w-[220px] h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-500"
          />
        </div>

        {/* Table */}
        <div className="p-6">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No enquiries with payment details found.
            </p>
          ) : (
            <>
              <table className="hidden md:table min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="py-2 px-3 text-left">Name</th>
                    <th className="py-2 px-3 text-left">Education</th>
                    <th className="py-2 px-3 text-left">Total Fees (₹)</th>
                    <th className="py-2 px-3 text-left">Paid (₹)</th>
                    <th className="py-2 px-3 text-left">Remaining (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const edu =
                      e.education === "Other" && e.customEducation
                        ? e.customEducation
                        : e.education;
                    return (
                      <tr
                        key={e.id}
                        className="border-b hover:bg-green-50 cursor-pointer"
                        onClick={() => openReceipt(e)}
                      >
                        <td className="py-2 px-3">{e.fullName}</td>
                        <td className="py-2 px-3">{edu || "—"}</td>
                        <td className="py-2 px-3">{e.totalFees || "0"}</td>
                        <td className="py-2 px-3">{e.paidFees || "0"}</td>
                        <td className="py-2 px-3">
                          {e.remainingFees || "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {filtered.map((e) => {
                  const edu =
                    e.education === "Other" && e.customEducation
                      ? e.customEducation
                      : e.education;
                  return (
                    <div
                      key={e.id}
                      onClick={() => openReceipt(e)}
                      className="border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer"
                    >
                      <p className="font-semibold text-gray-900">
                        {e.fullName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {edu || "—"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Total: ₹{e.totalFees || "0"} • Paid: ₹
                        {e.paidFees || "0"} • Remaining: ₹
                        {e.remainingFees || "0"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && selected && (
        <ReceiptModal
          enquiry={selected}
          today={todayStr}
          onClose={closeReceipt}
          onExportCSV={() => exportReceiptCSV(selected)}
          onExportPDF={() => exportReceiptPDF(selected)}
          onAddPayment={addPaymentToEnquiry}
        />
      )}

      {/* Manual Add Payment Modal – uses ALL enquiries, with status + education filter */}
      {showManualAdd && (
        <ManualPaymentModal
          enquiries={allEnquiries}
          today={todayStr}
          onClose={() => setShowManualAdd(false)}
          onAddPayment={addPaymentToEnquiry}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-white shadow-lg animate-slide-in-right ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Receipt Modal – all payments for one enquiry
─────────────────────────────────────────────── */
const ReceiptModal: React.FC<{
  enquiry: EnquiryData;
  today: string;
  onClose: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onAddPayment: (enquiry: EnquiryData, form: ManualPaymentForm) => void;
}> = ({ enquiry, today, onClose, onExportCSV, onExportPDF, onAddPayment }) => {
  const [form, setForm] = useState<ManualPaymentForm>({
    date: today,
    amount: "",
    mode: "",
    offlineType: "",
    note: "",
  });

  const edu =
    enquiry.education === "Other" && enquiry.customEducation
      ? enquiry.customEducation
      : enquiry.education;

  const history: PaymentHistoryItem[] = enquiry.paymentHistory || [];

  const handleChange = (field: keyof ManualPaymentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPayment(enquiry, form);
    setForm((prev) => ({
      ...prev,
      amount: "",
      mode: "",
      offlineType: "",
      note: "",
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b bg-green-600 text-white">
          <div>
            <h3 className="text-lg font-semibold">Fee Receipt</h3>
            <p className="text-xs text-green-100">
              {enquiry.fullName}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExportCSV}
              className="px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
            >
              Export CSV
            </button>
            <button
              onClick={onExportPDF}
              className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
            >
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="ml-2 px-2 py-1 rounded hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Enquiry Info */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm space-y-1">
            <p>
              <span className="font-semibold text-gray-700">Name:</span>{" "}
              {enquiry.fullName}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Contact:</span>{" "}
              {enquiry.mobile} • {enquiry.email}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Education:</span>{" "}
              {edu || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Status:</span>{" "}
              {enquiry.status}
            </p>
            <p>
              <span className="font-semibold text-gray-700">
                Next Follow-Up:
              </span>{" "}
              {enquiry.callBackDate || "—"}
            </p>
          </div>

          {/* Fee Summary */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm space-y-1">
            <p>
              <span className="font-semibold text-gray-700">Total Fees:</span>{" "}
              ₹{enquiry.totalFees || "0"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Total Paid:</span>{" "}
              ₹{enquiry.paidFees || "0"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">
                Remaining Fees:
              </span>{" "}
              ₹{enquiry.remainingFees || "0"}
            </p>
          </div>

          {/* Payment History */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Payment Entries
            </h4>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">
                No payment history available.
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Amount (₹)</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-1.5">{p.date}</td>
                        <td className="px-3 py-1.5">₹{p.amount}</td>
                        <td className="px-3 py-1.5">{p.mode}</td>
                        <td className="px-3 py-1.5">{p.method || "—"}</td>
                        <td className="px-3 py-1.5">{p.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Payment Form (inside receipt) */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Add New Payment for this Enquiry
            </h4>
            <form
              onSubmit={submit}
              className="grid sm:grid-cols-2 gap-3 text-sm"
            >
              <input
                type="date"
                value={form.date}
                max={today}
                onChange={(e) => handleChange("date", e.target.value)}
                className="border border-gray-300 rounded-lg h-9 px-2"
              />
              <input
                type="number"
                placeholder="Amount ₹"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="border border-gray-300 rounded-lg h-9 px-2"
              />
              <select
                value={form.mode}
                onChange={(e) =>
                  handleChange(
                    "mode",
                    e.target.value as ManualPaymentForm["mode"]
                  )
                }
                className="border border-gray-300 rounded-lg h-9 px-2"
              >
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
              {form.mode === "Offline" && (
                <select
                  value={form.offlineType}
                  onChange={(e) =>
                    handleChange(
                      "offlineType",
                      e.target.value as ManualPaymentForm["offlineType"]
                    )
                  }
                  className="border border-gray-300 rounded-lg h-9 px-2"
                >
                  <option value="">Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              )}
              <textarea
                placeholder="Note"
                rows={2}
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 sm:col-span-2 resize-none"
              />
              <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Manual Add Payment Modal – search ALL enquiries
   by name/mobile + filter by education + status
─────────────────────────────────────────────── */
const ManualPaymentModal: React.FC<{
  enquiries: EnquiryData[];
  today: string;
  onClose: () => void;
  onAddPayment: (enquiry: EnquiryData, form: ManualPaymentForm) => void;
}> = ({ enquiries, today, onClose, onAddPayment }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [educationFilter, setEducationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<EnquiryData | null>(null);

  const [form, setForm] = useState<ManualPaymentForm>({
    date: today,
    amount: "",
    mode: "",
    offlineType: "",
    note: "",
  });

  const [filteredEnquiries, setFilteredEnquiries] = useState<EnquiryData[]>([]);

  const educationOptions = [
    "All",
    "BCA-I",
    "BCA-II",
    "BCA-III",
    "MCA-I",
    "MCA-II",
    "B.Tech-I",
    "B.Tech-II",
    "B.Tech-III",
    "B.Tech-IV",
    "Diploma-I",
    "Diploma-II",
    "Diploma-III",
    "Other",
  ];

  const statusOptions = ["All", "Pending", "In Process", "Confirmed"];

  useEffect(() => {
    setFilteredEnquiries(enquiries);
  }, [enquiries]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let list = [...enquiries];

    if (term) {
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(term) ||
          e.mobile.includes(searchTerm)
      );
    }

    if (educationFilter !== "All") {
      list = list.filter((e) => {
        const edu =
          e.education === "Other" && e.customEducation
            ? e.customEducation
            : e.education;
        return edu === educationFilter;
      });
    }

    if (statusFilter !== "All") {
      list = list.filter((e) => e.status === statusFilter);
    }

    setFilteredEnquiries(list);
  }, [searchTerm, educationFilter, statusFilter, enquiries]);

  const handleChange = (field: keyof ManualPaymentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    onAddPayment(selected, form);
    setForm((prev) => ({
      ...prev,
      amount: "",
      mode: "",
      offlineType: "",
      note: "",
    }));
  };

  const eduSelected =
    selected &&
    (selected.education === "Other" && selected.customEducation
      ? selected.customEducation
      : selected.education);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b bg-sky-600 text-white">
          <h3 className="text-lg font-semibold">Add Payment (Manual)</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-6">
          {/* Left: enquiry selector */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">
              Select Enquiry
            </h4>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-green-200"
              />
              <div className="flex gap-2">
                <select
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg h-10 px-3 text-sm"
                >
                  {educationOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "All" ? "All Educations" : opt}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg h-10 px-3 text-sm"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
              {filteredEnquiries.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No enquiries match the search/filter.
                </div>
              ) : (
                filteredEnquiries.map((e) => {
                  const edu =
                    e.education === "Other" && e.customEducation
                      ? e.customEducation
                      : e.education;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelected(e)}
                      className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 hover:bg-sky-50 ${
                        selected?.id === e.id ? "bg-sky-100" : "bg-white"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {e.fullName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {e.mobile} • {e.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {edu || "Education not set"} • {e.status}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: selected enquiry info + payment form */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">
              Payment Details
            </h4>

            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
              {selected ? (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {selected.fullName}
                  </p>
                  <p className="text-gray-700">
                    {selected.mobile} • {selected.email}
                  </p>
                  <p className="text-gray-600">
                    Education: {eduSelected || "Not set"}
                  </p>
                  <p className="text-gray-600">
                    Status: {selected.status} • Next Call:{" "}
                    {selected.callBackDate || "Not set"}
                  </p>
                  <p className="text-gray-600">
                    Total Fees: ₹{selected.totalFees || "0"} • Paid: ₹
                    {selected.paidFees || "0"} • Remaining: ₹
                    {selected.remainingFees || "0"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">
                  Select an enquiry from the left to link this payment.
                </p>
              )}
            </div>

            <form onSubmit={submit} className="space-y-3 text-sm">
              <input
                type="date"
                value={form.date}
                max={today}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg h-9 px-2"
              />
              <input
                type="number"
                placeholder="Amount ₹"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="w-full border border-gray-300 rounded-lg h-9 px-2"
              />
              <select
                value={form.mode}
                onChange={(e) =>
                  handleChange(
                    "mode",
                    e.target.value as ManualPaymentForm["mode"]
                  )
                }
                className="w-full border border-gray-300 rounded-lg h-9 px-2"
              >
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
              {form.mode === "Offline" && (
                <select
                  value={form.offlineType}
                  onChange={(e) =>
                    handleChange(
                      "offlineType",
                      e.target.value as ManualPaymentForm["offlineType"]
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg h-9 px-2"
                >
                  <option value="">Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              )}
              <textarea
                placeholder="Note"
                rows={3}
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1 resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!selected}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;