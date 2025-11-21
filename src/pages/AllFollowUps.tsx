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
  Save,
  AlertCircle,
  Pencil,
  CheckCircle,
  Info,
  BookOpen,
  CreditCard,
  Trash2,
} from "lucide-react";
import { storageUtils, type EnquiryData } from "../utils/storageUtils";
import { useAuth } from "../contexts/AuthContext";

/* ─────────────── Helpers ─────────────── */
const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

const Validation = {
  fullName: (v: string) =>
    !v.trim()
      ? "Full name is required"
      : v.length < 3
      ? "Name must be at least 3 characters"
      : "",
  mobile: (v: string) =>
    !/^[6-9]\d{9}$/.test(v) ? "Enter valid 10‑digit mobile" : "",
  email: (v: string) =>
    !/^[\w._-]+@[\w.-]+\.[a-z]{2,}$/i.test(v) ? "Invalid email" : "",
  address: (v: string) =>
    v.trim().length < 10 ? "Address must be at least 10 characters" : "",
};

/* ─────────────── Component ─────────────── */
const FollowUps: React.FC = () => {
  const { canDelete } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [list, setList] = useState<EnquiryData[]>([]);
  const [filtered, setFiltered] = useState<EnquiryData[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<EnquiryData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState(false);
  const [showModal, setModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  /* clock */
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

  /* data load */
  useEffect(() => {
    (async () => {
      const all = await storageUtils.getAllEnquiries();
      setList(all);
      setFiltered(all);
    })();
  }, []);

  useEffect(() => {
    const t = search.toLowerCase();
    setFiltered(
      list.filter(
        (f) =>
          f.fullName.toLowerCase().includes(t) ||
          f.mobile.includes(t) ||
          f.email.toLowerCase().includes(t) ||
          f.id.toLowerCase().includes(t)
      )
    );
  }, [search, list]);

  const showToastMsg = (msg: string, ok = true) => setToast({ msg, ok });

  const openRow = (row: EnquiryData) => {
    setForm({ ...row });
    setErrors({});
    setEdit(false);
    setModal(true);
  };

  const change = (field: keyof EnquiryData, value: string) =>
    form && setForm({ ...form, [field]: value });

  const validate = () => {
    if (!form) return false;
    const e: Record<string, string> = {};
    if (Validation.fullName(form.fullName))
      e.fullName = Validation.fullName(form.fullName);
    if (Validation.mobile(form.mobile)) e.mobile = Validation.mobile(form.mobile);
    if (Validation.email(form.email)) e.email = Validation.email(form.email);
    if (Validation.address(form.address))
      e.address = Validation.address(form.address);
    if (!form.status) e.status = "Status required";
    if (!form.callBackDate) e.callBackDate = "Callback date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!form) return;
    if (!validate()) return showToastMsg("Fix the highlighted errors", false);
    await storageUtils.updateEnquiry(form.id, {
      ...form,
      updatedAt: new Date().toISOString(),
    });
    const all = await storageUtils.getAllEnquiries();
    setList(all);
    setFiltered(all);
    setModal(false);
    showToastMsg("Saved successfully");
  };

  const del = async () => {
    if (!deleting) return;
    await storageUtils.deleteEnquiry(deleting);
    const all = await storageUtils.getAllEnquiries();
    setList(all);
    setFiltered(all);
    showToastMsg("Deleted");
    setDeleting(null);
  };

  const today = new Date().toDateString();
  const todayCount = list.filter(
    (f) => new Date(f.callBackDate).toDateString() === today
  ).length;

  /* ─────────────── UI ─────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Follow-Ups</h1>
            <div className="flex gap-2 mt-1 text-sm text-gray-600 flex-wrap">
              <span className="bg-green-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Calendar size={14} className="text-green-600" />
                {date}
              </span>
              <span className="bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1">
                <Clock size={14} className="text-blue-600" />
                {time}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-100"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat title="Total" value={list.length} color="blue" />
          <Stat title="Today" value={todayCount} color="orange" />
          <Stat
            title="Pending"
            value={list.filter((f) => f.status === "Pending").length}
            color="yellow"
          />
          <Stat
            title="Confirmed"
            value={list.filter((f) => f.status === "Confirmed").length}
            color="green"
          />
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-lg shadow-sm mb-6 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Mobile, Email or ID..."
            className="w-full border rounded-lg pl-9 pr-8 h-10 text-sm focus:ring-2 focus:ring-green-500 outline-none"
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

        {/* Table list */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-10">
              No follow-ups found
            </p>
          ) : (
            filtered.map((f) => (
              <div
                key={f.id}
                onClick={() => openRow(f)}
                className="flex justify-between items-center px-4 py-3 hover:bg-green-50 cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-gray-800">{f.fullName}</p>
                  <p className="text-sm text-gray-500">{f.mobile}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      f.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : f.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {f.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(f.callBackDate)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && form && (
        <DetailModal
          form={form}
          errors={errors}
          editing={edit}
          setEditing={setEdit}
          onChange={change}
          onSave={save}
          onClose={() => setModal(false)}
          onDelete={() => setDeleting(form.id)}
          canDelete={canDelete()}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDelete onCancel={() => setDeleting(null)} onConfirm={del} />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

/* Stat card */
const Stat = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: "blue" | "orange" | "yellow" | "green";
}) => {
  const colorClasses: Record<
    "blue" | "orange" | "yellow" | "green",
    { border: string }
  > = {
    blue: { border: "border-blue-500" },
    orange: { border: "border-orange-500" },
    yellow: { border: "border-yellow-500" },
    green: { border: "border-green-500" },
  };

  const cls = colorClasses[color];

  return (
    <div className={`bg-white p-4 border-l-4 ${cls.border} rounded-lg`}>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

/* ─────────────── MODAL ─────────────── */
const DetailModal: React.FC<any> = ({
  form,
  errors,
  editing,
  setEditing,
  onChange,
  onSave,
  onClose,
  onDelete,
  canDelete,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-lg font-semibold">
          {editing ? "Edit Enquiry" : "Enquiry Details"}
        </h2>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg">
          <X />
        </button>
      </div>

      {/* Scrollable main content */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Information Sections */}
        <Section title="Personal Information" icon={<User size={18} />}>
          <Editable
            label="Full Name"
            value={form.fullName}
            icon={<User size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("fullName", v)}
            error={errors.fullName}
          />
          <Editable
            label="Mobile Number"
            value={form.mobile}
            icon={<Phone size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("mobile", v)}
            error={errors.mobile}
          />
          <Editable
            label="Alternate Mobile"
            value={form.alternateMobile || ""}
            icon={<Phone size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("alternateMobile", v)}
          />
          <Editable
            label="Email"
            value={form.email}
            icon={<Mail size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("email", v)}
            error={errors.email}
          />
          <Editable
            label="Address"
            textarea
            value={form.address}
            icon={<MapPin size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("address", v)}
            error={errors.address}
          />
        </Section>

        <Section title="Document Information" icon={<CreditCard size={18} />}>
          <Editable
            label="Aadhar Number"
            value={form.aadharNumber || ""}
            icon={<CreditCard size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("aadharNumber", v)}
          />
        </Section>

        <Section title="Educational Information" icon={<BookOpen size={18} />}>
          <EditableSelect
            label="Education"
            value={form.education || ""}
            options={[
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
            ]}
            editing={editing}
            onChange={(v: any) => onChange("education", v)}
          />
          {form.education === "Other" && (
            <Editable
              label="Custom Education"
              value={form.customEducation || ""}
              editing={editing}
              onChange={(v: any) => onChange("customEducation", v)}
            />
          )}
          <EditableSelect
            label="Knowledge of Domain"
            value={form.knowledgeOfAndroid || ""}
            options={["Fresher", "Intermediate", "Advanced", "Professional"]}
            editing={editing}
            onChange={(v: any) => onChange("knowledgeOfAndroid", v)}
          />
        </Section>

        <Section title="Follow-Up Details" icon={<Calendar size={18} />}>
          <EditableSelect
            label="Interested Status"
            value={form.interestedStatus || ""}
            options={[
              "100% Interested",
              "75% Interested",
              "50% Interested",
              "25% Interested",
              "0% Interested",
            ]}
            editing={editing}
            onChange={(v: any) => onChange("interestedStatus", v)}
          />
          <EditableSelect
            label="Status"
            value={form.status}
            options={["Pending", "In Process", "Confirmed"]}
            editing={editing}
            onChange={(v: any) => onChange("status", v)}
            error={errors.status}
          />
          <Editable
            label="Callback Date"
            value={form.callBackDate}
            type="date"
            icon={<Clock size={14} />}
            editing={editing}
            onChange={(v: any) => onChange("callBackDate", v)}
            error={errors.callBackDate}
          />
          <EditableSelect
            label="Source of Enquiry"
            value={form.sourceOfEnquiry || ""}
            options={[
              "Phone Call",
              "Walk-in",
              "Referral",
              "Social Media",
              "Email",
              "Advertisement",
            ]}
            editing={editing}
            onChange={(v: any) => onChange("sourceOfEnquiry", v)}
          />
          <EditableSelect
            label="How did you know about us?"
            value={form.howDidYouKnow || ""}
            options={[
              "Google Search",
              "Facebook",
              "Instagram",
              "LinkedIn",
              "Friend/Family",
              "Advertisement",
              "Other",
            ]}
            editing={editing}
            onChange={(v: any) => onChange("howDidYouKnow", v)}
          />
          {form.howDidYouKnow === "Other" && (
            <Editable
              label="Custom Source"
              value={form.customHowDidYouKnow || ""}
              editing={editing}
              onChange={(v: any) => onChange("customHowDidYouKnow", v)}
            />
          )}
        </Section>

        <Section title="Additional Information" icon={<Info size={18} />}>
          <p className="text-sm text-gray-700">
            <strong>Created:</strong> {formatDate(form.createdAt)}
          </p>
          {form.updatedAt && form.updatedAt !== form.createdAt && (
            <p className="text-sm text-gray-700">
              <strong>Updated:</strong> {formatDate(form.updatedAt)}
            </p>
          )}
        </Section>
      </div>

      {/* Sticky footer */}
      <div className="flex justify-end gap-3 bg-gray-50 border-t px-6 py-4 sticky bottom-0">
        {canDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Save size={16} /> Save
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Pencil size={16} /> Edit
          </button>
        )}
      </div>
    </div>
  </div>
);

/* Simple helpers */
const Section: React.FC<any> = ({ title, icon, children }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
      <span className="text-green-600">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const Editable = ({
  label,
  value,
  editing,
  onChange,
  error,
  textarea,
  type = "text",
  icon,
}: any) => (
  <div>
    <label className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
      {icon}
      {label}
    </label>
    {editing ? (
      textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200 ${
            error ? "border-red-400" : "border-gray-300"
          }`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200 ${
            error ? "border-red-400" : "border-gray-300"
          }`}
        />
      )
    ) : (
      <p className="text-sm text-gray-800">
        {value || <span className="italic text-gray-400">Not set</span>}
      </p>
    )}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const EditableSelect = ({
  label,
  value,
  options,
  editing,
  onChange,
  error,
}: any) => (
  <div>
    <label className="text-xs text-gray-500 mb-1 font-medium block">
      {label}
    </label>
    {editing ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    ) : (
      <p className="text-sm text-gray-800">
        {value || <span className="italic text-gray-400">Not selected</span>}
      </p>
    )}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const ConfirmDelete = ({ onConfirm, onCancel }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
      <AlertCircle className="text-red-600 mb-3" />
      <h3 className="text-lg font-semibold mb-1">Confirm Deletion</h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete this enquiry? This action cannot be
        undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-gray-100 py-2 rounded-lg">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Toast = ({ message, ok, onClose }: any) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg ${
        ok ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {ok ? <CheckCircle /> : <AlertCircle />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={16} />
      </button>
    </div>
  );
};

export default FollowUps;