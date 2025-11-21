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
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">View Enquiries</h1>
            <div className="flex gap-2 mt-1 text-sm text-gray-600 flex-wrap">
              <span className="bg-green-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Calendar size={14} className="text-green-600" />
                {currentDate}
              </span>
              <span className="bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Clock size={14} className="text-blue-600" />
                {currentTime}
              </span>
            </div>
          </div>
          <button
            onClick={loadData}
            className="bg-white border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Mobile or Email"
              className="w-full border pl-9 pr-8 h-10 text-sm rounded-lg focus:ring-2 focus:ring-green-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filtered.length} of {enquiries.length} records
            </p>
            <button
              onClick={resetFilters}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No enquiries found.</p>
          ) : (
            <table className="w-full hidden md:table">
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
                    onClick={() => setSelected(e)}
                    className={`cursor-pointer hover:bg-green-50 ${
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
          )}
        </div>
      </div>

      {selected && (
        <DetailModal
          enquiry={selected}
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
        <Toast message={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

const Filter = ({ label, value, setValue, options, type }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {type === "date" ? (
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-200"
      />
    ) : (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-200"
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
  <td className="px-6 py-4 text-sm text-gray-700">{children}</td>
);

/* ─────────────── Modal ─────────────── */
const DetailModal = ({
  enquiry,
  editing,
  setEditing,
  onClose,
  onSave,
  onDelete,
}: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center sticky top-0">
        <h2 className="text-lg font-semibold">
          {editing ? "Edit Enquiry" : "Enquiry Details"}
        </h2>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg">
          <X />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-6 space-y-6">
        <Section title="Personal Info" icon={<User size={16} />}>
          <Field label="Full Name" value={enquiry.fullName} editing={editing} />
          <Field label="Mobile" value={enquiry.mobile} editing={editing} />
          <Field label="Email" value={enquiry.email} editing={editing} />
          <Field
            label="Address"
            value={enquiry.address}
            editing={editing}
            textarea
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
          />
          <Dropdown
            label="Knowledge Level"
            value={enquiry.knowledgeOfAndroid}
            editing={editing}
            options={["Fresher", "Intermediate", "Advanced", "Professional"]}
          />
        </Section>

        <Section title="Status Info" icon={<Info size={16} />}>
          <Dropdown
            label="Status"
            value={enquiry.status}
            editing={editing}
            options={["Pending", "In Process", "Confirmed"]}
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
          />
        </Section>

        <Section title="Additional" icon={<Calendar size={16} />}>
          <p className="text-sm text-gray-600">
            Created: {new Date(enquiry.createdAt).toLocaleDateString()}
          </p>
          {enquiry.updatedAt && enquiry.updatedAt !== enquiry.createdAt && (
            <p className="text-sm text-gray-600">
              Updated: {new Date(enquiry.updatedAt).toLocaleDateString()}
            </p>
          )}
        </Section>
      </div>

      <div className="flex justify-end gap-3 bg-gray-50 p-4 sticky bottom-0">
        {editing ? (
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Save size={16} /> Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Pencil size={16} /> Edit
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  </div>
);

const Section = ({ title, icon, children }: any) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
    <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
      <span className="text-green-600">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const Field = ({ label, value, editing, textarea }: any) => (
  <div>
    <label className="text-xs text-gray-500 font-medium">{label}</label>
    {editing ? (
      textarea ? (
        <textarea
          defaultValue={value}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200"
        />
      ) : (
        <input
          defaultValue={value}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200"
        />
      )
    ) : (
      <p className="text-sm text-gray-700">
        {value || <span className="italic text-gray-400">Not set</span>}
      </p>
    )}
  </div>
);

const Dropdown = ({ label, value, editing, options }: any) => (
  <div>
    <label className="text-xs text-gray-500 font-medium">{label}</label>
    {editing ? (
      <select
        defaultValue={value}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200"
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
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete this enquiry?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 py-2 rounded-lg font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
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
      className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg ${
        ok ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

export default ViewEnquiry;