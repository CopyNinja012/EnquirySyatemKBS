import React, { useState, useEffect } from "react";
import { storageUtils, type EnquiryData } from "../utils/storageUtils";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  X,
  User,
  Pencil,
  Save,
  Trash2,
  Info,
  BookOpen,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

/* ─────────────── Main Component ─────────────── */
const SearchEnquiry: React.FC = () => {
  useAuth(); // currently unused, but fine
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [filtered, setFiltered] = useState<EnquiryData[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [interested, setInterested] = useState("All");
  const [education, setEducation] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<EnquiryData | null>(null);
  const [editing, setEditing] = useState(false);
  const [, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  /* Clock */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
      setTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  /* Load Enquiries */
  useEffect(() => {
    (async () => {
      const data = await storageUtils.getAllEnquiries();
      setEnquiries(data);
      setFiltered(data);
    })();
  }, []);

  /* Filters */
  useEffect(() => {
    let f = [...enquiries];
    const term = query.toLowerCase();

    if (term)
      f = f.filter(
        (e) =>
          e.fullName.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.mobile.includes(term)
      );
    if (status !== "All") f = f.filter((e) => e.status === status);
    if (interested !== "All")
      f = f.filter((e) => e.interestedStatus === interested);
    if (education !== "All")
      f = f.filter(
        (e) =>
          e.education === education ||
          (e.education === "Other" && e.customEducation === education)
      );
    if (from) f = f.filter((e) => new Date(e.createdAt) >= new Date(from));
    if (to)
      f = f.filter(
        (e) =>
          new Date(e.createdAt) <= new Date(new Date(to).setHours(23, 59, 59))
      );
    setFiltered(f);
    setPage(1);
  }, [query, status, interested, education, from, to, enquiries]);

  const showToast = (msg: string, ok = true) => setToast({ msg, ok });
  const resetFilters = () => {
    setQuery("");
    setStatus("All");
    setInterested("All");
    setEducation("All");
    setFrom("");
    setTo("");
  };

  const openModal = (row: EnquiryData) => {
    setSelected(row);
    setEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    if (!selected) return;
    await storageUtils.updateEnquiry(selected.id, {
      ...selected,
      updatedAt: new Date().toISOString(),
    });
    const data = await storageUtils.getAllEnquiries();
    setEnquiries(data);
    setFiltered(data);
    setEditing(false);
    showToast("Saved successfully");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await storageUtils.deleteEnquiry(deleting);
    const data = await storageUtils.getAllEnquiries();
    setEnquiries(data);
    setFiltered(data);
    showToast("Deleted");
    setDeleting(null);
  };

  /* Pagination */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const current = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Search Enquiry</h1>
            <div className="flex gap-2 mt-1 text-sm text-gray-600 flex-wrap">
              <span className="bg-green-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Calendar size={14} className="text-green-600" /> {date}
              </span>
              <span className="bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Clock size={14} className="text-blue-600" /> {time}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Search Input */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or mobile"
              className="w-full border rounded-lg pl-9 pr-8 h-10 text-sm focus:ring-2 focus:ring-green-200"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Filter
              label="Status"
              value={status}
              setValue={setStatus}
              options={["All", "Pending", "In Process", "Confirmed"]}
            />
            <Filter
              label="Interested"
              value={interested}
              setValue={setInterested}
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
              value={education}
              setValue={setEducation}
              options={[
                "All",
                "BCA-I",
                "BCA-II",
                "BCA-III",
                "MCA-I",
                "MCA-II",
                "Diploma-I",
                "Diploma-II",
                "Diploma-III",
                "Other",
              ]}
            />
            <Filter
              label="From Date"
              value={from}
              setValue={setFrom}
              type="date"
            />
            <Filter label="To Date" value={to} setValue={setTo} type="date" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filtered.length} records
            </p>
            <button
              onClick={resetFilters}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white border rounded-lg shadow-sm">
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
              {current.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No enquiries found.
                  </td>
                </tr>
              )}
              {current.map((e, i) => (
                <tr
                  key={e.id}
                  onClick={() => openModal(e)}
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

          {/* Mobile Cards */}
          <div className="md:hidden divide-y">
            {current.map((e) => (
              <div
                key={e.id}
                onClick={() => openModal(e)}
                className="p-4 hover:bg-green-50 cursor-pointer"
              >
                <p className="font-semibold text-gray-800">{e.fullName}</p>
                <p className="text-sm text-gray-500">{e.mobile}</p>
                <p className="text-sm text-gray-500">{e.email}</p>
                <p className="text-sm text-gray-500">
                  {e.status} • {e.interestedStatus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1.5 rounded-lg border ${
                  page === i + 1
                    ? "bg-green-600 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <EnquiryModal
          enquiry={selected}
          editing={editing}
          setEditing={setEditing}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={() => setDeleting(selected.id)}
        />
      )}

      {deleting && (
        <ConfirmDelete
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
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

/* ─────────────── Reusable Subcomponents ─────────────── */

const Filter = ({ label, value, setValue, options, type }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {type === "date" ? (
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-200"
      />
    ) : (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-200"
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
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

/* ─────────────── Enquiry Modal ─────────────── */
const EnquiryModal = ({
  enquiry,
  editing,
  setEditing,
  onClose,
  onSave,
  onDelete,
}: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center sticky top-0">
        <h2 className="text-lg font-semibold">
          {editing ? "Edit Enquiry" : "Enquiry Details"}
        </h2>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg">
          <X />
        </button>
      </div>

      {/* Scrollable Section */}
      <div className="overflow-y-auto flex-1 p-6 space-y-6">
        <Section title="Personal Info" icon={<User size={16} />}>
          <Field label="Full Name" value={enquiry.fullName} editable={editing} />
          <Field label="Mobile" value={enquiry.mobile} editable={editing} />
          <Field label="Email" value={enquiry.email} editable={editing} />
          <Field
            label="Address"
            value={enquiry.address}
            editable={editing}
            textarea
          />
        </Section>

        <Section title="Education Info" icon={<BookOpen size={16} />}>
          <Dropdown
            label="Education"
            value={enquiry.education}
            editable={editing}
            options={[
              "BCA-I",
              "BCA-II",
              "BCA-III",
              "MCA-I",
              "MCA-II",
              "Diploma-I",
              "Diploma-II",
              "Diploma-III",
              "Other",
            ]}
          />
          <Dropdown
            label="Knowledge Level"
            value={enquiry.knowledgeOfAndroid || ""}
            editable={editing}
            options={["Fresher", "Intermediate", "Advanced", "Professional"]}
          />
        </Section>

        <Section title="Status Info" icon={<Info size={16} />}>
          <Dropdown
            label="Status"
            value={enquiry.status}
            editable={editing}
            options={["Pending", "In Process", "Confirmed"]}
          />
          <Dropdown
            label="Interest Level"
            value={enquiry.interestedStatus}
            editable={editing}
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
            value={enquiry.sourceOfEnquiry || ""}
            editable={editing}
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

        <Section title="Additional Info" icon={<Calendar size={16} />}>
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

      {/* Footer */}
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

/* Subcomponents used inside modal */
const Section = ({ title, icon, children }: any) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
    <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
      <span className="text-green-600">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const Field = ({ label, value, editable, textarea }: any) => (
  <div>
    <label className="text-xs text-gray-500 font-medium">{label}</label>
    {editable ? (
      textarea ? (
        <textarea
          defaultValue={value}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200"
        />
      ) : (
        <input
          defaultValue={value}
          type="text"
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

const Dropdown = ({ label, value, editable, options }: any) => (
  <div>
    <label className="text-xs text-gray-500 font-medium">{label}</label>
    {editable ? (
      <select
        defaultValue={value}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200"
      >
        <option value="">Select {label}</option>
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    ) : (
      <p className="text-sm text-gray-700">
        {value || <span className="italic text-gray-400">Not selected</span>}
      </p>
    )}
  </div>
);

/* Confirm Delete & Toast */
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

export default SearchEnquiry;