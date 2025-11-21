import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Briefcase,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  Pencil,
  AlertTriangle,
  Info,
  BookOpen,
  Trash2,
  Save,
} from "lucide-react";
import { storageUtils, type EnquiryData } from "../utils/storageUtils";
import { useAuth } from "../contexts/AuthContext";

/* ─────────────── Component ─────────────── */
const TodaysFollowUps: React.FC = () => {
  const { canDelete } = useAuth(); // kept as-is; use if you want to hide delete for non-admin
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [followUps, setFollowUps] = useState<EnquiryData[]>([]);
  const [filtered, setFiltered] = useState<EnquiryData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<EnquiryData | null>(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* clock */
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setCurrentDate(
        d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
      setCurrentTime(
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadFollowUps();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      followUps.filter(
        (f) =>
          f.fullName.toLowerCase().includes(term) ||
          f.mobile.includes(term) ||
          f.email.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, followUps]);

  const loadFollowUps = async () => {
    setLoading(true);
    const data = await storageUtils.getAllEnquiries();
    const todayStr = new Date().toDateString();

    const todayItems = data.filter((e) => {
      if (!e.callBackDate) return false;
      const cb = new Date(e.callBackDate);
      return cb.toDateString() === todayStr;
    });

    setFollowUps(todayItems);
    setFiltered(todayItems);
    setLoading(false);
  };

  const showToast = (msg: string, ok: boolean = true) =>
    setToast({ msg, ok });

  const save = async () => {
    if (!selected) return;
    await storageUtils.updateEnquiry(selected.id, {
      ...selected,
      updatedAt: new Date().toISOString(),
    });
    await loadFollowUps();
    showToast("Saved successfully");
    setEditing(false);
  };

  const del = async () => {
    if (!deleting) return;
    await storageUtils.deleteEnquiry(deleting);
    await loadFollowUps();
    setDeleting(null);
    showToast("Deleted");
  };

  const pending = followUps.filter((f) => f.status === "Pending").length;
  const confirmed = followUps.filter((f) => f.status === "Confirmed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Today's Follow-Ups</h1>
            <div className="mt-1 flex gap-2 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-lg">
                <Calendar size={14} className="text-green-600" />
                {currentDate}
              </span>
              <span className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-lg">
                <Clock size={14} className="text-blue-600" />
                {currentTime}
              </span>
            </div>
          </div>
          <button
            onClick={loadFollowUps}
            className="bg-white border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat title="Total" value={followUps.length} color="blue" icon={<Calendar size={18} />} />
          <Stat title="Pending" value={pending} color="yellow" icon={<AlertCircle size={18} />} />
          <Stat title="Confirmed" value={confirmed} color="green" icon={<CheckCircle size={18} />} />
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, mobile, or email"
            className="w-full pl-9 pr-8 h-10 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="h-12 w-12 border-2 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-10">
              No follow-ups for today
            </p>
          ) : (
            <>
              <table className="hidden md:table w-full">
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
                  {filtered.map((f, i) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelected(f)}
                      className={`cursor-pointer hover:bg-green-50 ${
                        i % 2 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <Td>{f.fullName}</Td>
                      <Td>{f.mobile}</Td>
                      <Td>{f.email}</Td>
                      <Td>{f.status}</Td>
                      <Td>{f.interestedStatus}</Td>
                      <Td>{f.education || f.customEducation || "-"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-200">
                {filtered.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className="p-4 hover:bg-green-50 cursor-pointer"
                  >
                    <p className="font-semibold text-gray-800">{f.fullName}</p>
                    <p className="text-sm text-gray-500">{f.mobile}</p>
                    <p className="text-xs text-gray-400">{f.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {f.status} • {f.interestedStatus}
                    </p>
                  </div>
                ))}
              </div>
            </>
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

/* Stat Card */
const Stat = ({ title, value, color, icon }: any) => {
  const colorClasses: Record<
    string,
    { border: string; bg: string; text: string }
  > = {
    blue: {
      border: "border-blue-500",
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    yellow: {
      border: "border-yellow-500",
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    green: {
      border: "border-green-500",
      bg: "bg-green-100",
      text: "text-green-600",
    },
  };

  const cls = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`flex items-center justify-between bg-white p-4 border-l-4 ${cls.border} rounded-lg`}
    >
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-2 ${cls.bg} rounded-full ${cls.text}`}>{icon}</div>
    </div>
  );
};

/* Modal */
const DetailModal = ({ enquiry, editing, setEditing, onClose, onSave, onDelete }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      <div className="bg-green-600 text-white flex justify-between items-center px-6 py-4 sticky top-0">
        <h2 className="text-lg font-semibold">
          {editing ? "Edit Follow-Up" : "Follow-Up Details"}
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
          <Field label="Address" value={enquiry.address} editing={editing} textarea />
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

        <Section title="Follow-Up Status" icon={<Info size={16} />}>
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

const Th = ({ text }: any) => (
  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
    {text}
  </th>
);
const Td = ({ children }: any) => (
  <td className="px-6 py-4 text-sm text-gray-700">{children}</td>
);

export default TodaysFollowUps;