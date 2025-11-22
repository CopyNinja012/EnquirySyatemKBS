import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Calendar,
  Clock,
  User,
  BookOpen,
  Info,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { storageUtils, type EnquiryData } from "../utils/storageUtils";
import { useAuth } from "../contexts/AuthContext";

const ViewEnquiry: React.FC = () => {
  useAuth(); // currently unused, but kept if you want to hide Delete for non-admin
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [filtered, setFiltered] = useState<EnquiryData[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [interestedFilter, setInterestedFilter] = useState("All");
  const [educationFilter, setEducationFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<EnquiryData | null>(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await storageUtils.getAllEnquiries();
    setEnquiries(data);
    setFiltered(data);
  };

  // Filters
  useEffect(() => {
    let f = enquiries.filter((e) => {
      const t = search.toLowerCase();
      return (
        !t ||
        e.fullName.toLowerCase().includes(t) ||
        e.mobile.includes(t) ||
        e.email.toLowerCase().includes(t)
      );
    });

    if (statusFilter !== "All") f = f.filter((e) => e.status === statusFilter);

    if (interestedFilter !== "All")
      f = f.filter((e) => e.interestedStatus === interestedFilter);

    if (educationFilter !== "All")
      f = f.filter(
        (e) =>
          e.education === educationFilter ||
          e.customEducation === educationFilter
      );

    if (fromDate)
      f = f.filter((e) => new Date(e.createdAt) >= new Date(fromDate));

    if (toDate)
      f = f.filter((e) => new Date(e.createdAt) <= new Date(toDate));

    setFiltered(f);
  }, [
    search,
    statusFilter,
    interestedFilter,
    educationFilter,
    fromDate,
    toDate,
    enquiries,
  ]);

  const showToastMsg = (msg: string, ok = true) => setToast({ msg, ok });

  const save = async () => {
    if (!selected) return;
    await storageUtils.updateEnquiry(selected.id, {
      ...selected,
      updatedAt: new Date().toISOString(),
    });
    await loadData();
    setEditing(false);
    showToastMsg("Saved successfully");
  };

  const del = async () => {
    if (!deleting) return;
    await storageUtils.deleteEnquiry(deleting);
    await loadData();
    showToastMsg("Deleted");
    setDeleting(null);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setInterestedFilter("All");
    setEducationFilter("All");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-5 sm:mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              View Enquiries
            </h1>
            <div className="flex flex-wrap gap-2 mt-2 text-xs sm:text-sm text-gray-600">
              <span className="bg-green-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Calendar size={14} className="text-green-600" />
                {currentDate}
              </span>
              <span className="bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Clock size={14} className="text-sky-600" />
                {currentTime}
              </span>
            </div>
          </div>
          <button
            onClick={loadData}
            className="w-full sm:w-auto bg-white border px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 text-sm"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-5 sm:mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Mobile or Email"
              className="w-full border pl-9 pr-8 h-10 text-sm rounded-lg focus:ring-2 focus:ring-sky-200 focus:border-sky-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-5 sm:mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Filter
              label="Status"
              value={statusFilter}
              setValue={setStatusFilter}
              options={["All", "Pending", "In Process", "Confirmed"]}
            />
            <Filter
              label="Interest"
              value={interestedFilter}
              setValue={setInterestedFilter}
              options={[
                "All",
                "100% Interested",
                "75% Interested",
                "50% Interested",
                "25% Interested",
                "0% Interested",
              ]}
            />
            <Filter
              label="Education"
              value={educationFilter}
              setValue={setEducationFilter}
              options={[
                "All",
                "BCA-I",
                "BCA-II",
                "MCA-I",
                "MCA-II",
                "Diploma-I",
                "Other",
              ]}
            />
            <Filter
              label="From"
              type="date"
              value={fromDate}
              setValue={setFromDate}
            />
            <Filter
              label="To"
              type="date"
              value={toDate}
              setValue={setToDate}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filtered.length} of {enquiries.length} records
            </p>
            <button
              onClick={resetFilters}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table / Mobile list */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center text-sm sm:text-base text-gray-500 py-10">
              No enquiries found.
            </p>
          ) : (
            <>
              {/* Desktop / Tablet table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th text="Name" />
                      <Th text="Mobile" />
                      <Th text="Email" />
                      <Th text="Status" />
                      <Th text="Interest" />
                      <Th text="Education" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr
                        key={e.id}
                        onClick={() => {
                          setSelected(e);
                          setEditing(false);
                        }}
                        className={`cursor-pointer hover:bg-sky-50 ${
                          i % 2 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <Td>{e.fullName}</Td>
                        <Td>{e.mobile}</Td>
                        <Td>{e.email}</Td>
                        <Td>{e.status}</Td>
                        <Td>{e.interestedStatus}</Td>
                        <Td>{e.education || e.customEducation || "-"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filtered.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setSelected(e);
                      setEditing(false);
                    }}
                    className="w-full text-left p-4 hover:bg-sky-50 active:bg-sky-100 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-800">
                      {e.fullName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {e.mobile}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {e.email}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {e.status} • {e.interestedStatus}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {e.education || e.customEducation || "-"}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selected && (
        <DetailModal
          enquiry={selected}
          setEnquiry={setSelected}
          editing={editing}
          setEditing={setEditing}
          onClose={() => setSelected(null)}
          onSave={save}
          onDelete={() => setDeleting(selected.id)}
        />
      )}
      {deleting && (
        <ConfirmDelete onCancel={() => setDeleting(null)} onConfirm={del} />
      )}
      {toast && (
        <Toast
          message={toast.msg}
          ok={toast.ok}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

const Filter = ({ label, value, setValue, options, type }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] sm:text-xs font-medium text-gray-500">
      {label}
    </label>
    {type === "date" ? (
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 border rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 focus:outline-none"
      />
    ) : (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 border rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 focus:outline-none"
      >
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )}
  </div>
);

const Th = ({ text }: any) => (
  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
    {text}
  </th>
);
const Td = ({ children }: any) => (
  <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
    {children}
  </td>
);

/* ─────────────── Modal ─────────────── */
const DetailModal = ({
  enquiry,
  setEnquiry,
  editing,
  setEditing,
  onClose,
  onSave,
  onDelete,
}: any) => {
  // helper to update a single field on the selected enquiry
  const updateField = (field: keyof EnquiryData, value: any) => {
    setEnquiry((prev: EnquiryData | null) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-sky-600 text-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0">
          <h2 className="text-base sm:text-lg font-semibold">
            {editing ? "Edit Enquiry" : "Enquiry Details"}
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <Section title="Personal Info" icon={<User size={16} />}>
            <Field
              label="Full Name"
              value={enquiry.fullName}
              editing={editing}
              onChange={(val: string) => updateField("fullName", val)}
            />
            <Field
              label="Mobile"
              value={enquiry.mobile}
              editing={editing}
              onChange={(val: string) => updateField("mobile", val)}
            />
            <Field
              label="Email"
              value={enquiry.email}
              editing={editing}
              onChange={(val: string) => updateField("email", val)}
            />
            <Field
              label="Address"
              value={enquiry.address}
              editing={editing}
              textarea
              onChange={(val: string) => updateField("address", val)}
            />
          </Section>

          <Section title="Education Info" icon={<BookOpen size={16} />}>
            <Dropdown
              label="Education"
              value={enquiry.education}
              editing={editing}
              options={[
                "BCA-I",
                "BCA-II",
                "BCA-III",
                "MCA-I",
                "MCA-II",
                "Diploma-I",
                "Diploma-II",
                "Other",
              ]}
              onChange={(val: string) => updateField("education", val)}
            />
            <Dropdown
              label="Knowledge Level"
              value={enquiry.knowledgeOfAndroid}
              editing={editing}
              options={["Fresher", "Intermediate", "Advanced", "Professional"]}
              onChange={(val: string) =>
                updateField("knowledgeOfAndroid", val)
              }
            />
          </Section>

          <Section title="Status Info" icon={<Info size={16} />}>
            <Dropdown
              label="Status"
              value={enquiry.status}
              editing={editing}
              options={["Pending", "In Process", "Confirmed"]}
              onChange={(val: string) => updateField("status", val)}
            />
            <Dropdown
              label="Interest"
              value={enquiry.interestedStatus}
              editing={editing}
              options={[
                "100% Interested",
                "75% Interested",
                "50% Interested",
                "25% Interested",
                "0% Interested",
              ]}
              onChange={(val: string) =>
                updateField("interestedStatus", val)
              }
            />
            <Dropdown
              label="Source of Enquiry"
              value={enquiry.sourceOfEnquiry}
              editing={editing}
              options={[
                "Phone Call",
                "Walk-in",
                "Referral",
                "Social Media",
                "Email",
                "Advertisement",
              ]}
              onChange={(val: string) =>
                updateField("sourceOfEnquiry", val)
              }
            />
          </Section>

          <Section title="Additional" icon={<Calendar size={16} />}>
            <p className="text-xs sm:text-sm text-gray-600">
              Created: {new Date(enquiry.createdAt).toLocaleDateString()}
            </p>
            {enquiry.updatedAt && enquiry.updatedAt !== enquiry.createdAt && (
              <p className="text-xs sm:text-sm text-gray-600">
                Updated: {new Date(enquiry.updatedAt).toLocaleDateString()}
              </p>
            )}
          </Section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 bg-gray-50 p-3 sm:p-4 sticky bottom-0">
          {editing ? (
            <button
              onClick={onSave}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-sky-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 text-sm sm:text-base"
            >
              <Save size={16} /> Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-sky-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 text-sm sm:text-base"
            >
              <Pencil size={16} /> Edit
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 text-sm sm:text-base"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }: any) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
    <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
      <span className="text-sky-600">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const Field = ({
  label,
  value,
  editing,
  textarea,
  onChange,
}: {
  label: string;
  value: any;
  editing: boolean;
  textarea?: boolean;
  onChange?: (val: string) => void;
}) => (
  <div>
    <label className="text-[11px] sm:text-xs text-gray-500 font-medium">
      {label}
    </label>
    {editing ? (
      textarea ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 focus:outline-none"
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 focus:outline-none"
        />
      )
    ) : (
      <p className="text-sm text-gray-700">
        {value || <span className="italic text-gray-400">Not set</span>}
      </p>
    )}
  </div>
);

const Dropdown = ({
  label,
  value,
  editing,
  options,
  onChange,
}: {
  label: string;
  value: any;
  editing: boolean;
  options: string[];
  onChange?: (val: string) => void;
}) => (
  <div>
    <label className="text-[11px] sm:text-xs text-gray-500 font-medium">
      {label}
    </label>
    {editing ? (
      <select
        value={value ?? ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 focus:outline-none"
      >
        <option value="">Select {label}</option>
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    ) : (
      <p className="text-sm text-gray-700">
        {value || <span className="italic text-gray-400">Not selected</span>}
      </p>
    )}
  </div>
);

const ConfirmDelete = ({ onCancel, onConfirm }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
    <div className="bg-white rounded-xl shadow-2xl p-5 sm:p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete this enquiry?
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 py-2 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium text-sm sm:text-base hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Toast = ({ message, ok, onClose }: any) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-3 sm:top-4 right-2 left-2 sm:left-auto sm:right-4 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-white flex items-center gap-2 shadow-lg text-xs sm:text-sm justify-between max-w-xs sm:max-w-sm mx-auto sm:mx-0 ${
        ok ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <span className="truncate">{message}</span>
      <button onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

export default ViewEnquiry;