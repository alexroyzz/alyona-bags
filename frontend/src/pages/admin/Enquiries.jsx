import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineX, HiOutlineEye } from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const statusColor = {
  new: "bg-brass-500/10 text-brass-500",
  contacted: "bg-forest-600/10 text-forest-700",
  closed: "bg-stone-200 text-ink-900/50",
};

// Truncate long messages for the table view; full text is shown in the modal.
const MESSAGE_PREVIEW_LENGTH = 45;
const truncateMessage = (message) => {
  if (!message) return "—";
  if (message.length <= MESSAGE_PREVIEW_LENGTH) return message;
  return `${message.slice(0, MESSAGE_PREVIEW_LENGTH)}...`;
};

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get("/enquiries", { params: filter ? { status: filter } : {} });
      setEnquiries(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filter]);

  const markStatus = async (id, status) => {
    try {
      await api.patch(`/enquiries/${id}`, { status });
      toast.success("Status updated");
      fetchEnquiries();
      // Keep the modal (if open) in sync with the latest status.
      setSelected((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this enquiry?")) return;
    try {
      await api.delete(`/enquiries/${id}`);
      toast.success("Enquiry deleted");
      fetchEnquiries();
      setSelected((prev) => (prev && prev._id === id ? null : prev));
    } catch {
      toast.error("Failed to delete enquiry");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ink-900">Enquiries</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-stone-200 text-sm">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left text-xs uppercase tracking-wider text-ink-900/50">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {enquiries.map((e) => (
                <tr key={e._id}>
                  <td className="px-5 py-3 text-ink-900 font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-ink-900/60">{e.phone}</td>
                  <td className="px-5 py-3 text-ink-900/60">{e.email || "Not Provided"}</td>
                  <td className="px-5 py-3 text-ink-900/60">{truncateMessage(e.message)}</td>
                  <td className="px-5 py-3 text-ink-900/60">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusColor[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelected(e)} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700 inline-flex items-center gap-1">
                        <HiOutlineEye className="text-sm" />
                        View
                      </button>
                      {e.status !== "contacted" && (
                        <button onClick={() => markStatus(e._id, "contacted")} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700">
                          Mark Contacted
                        </button>
                      )}
                      {e.status !== "closed" && (
                        <button onClick={() => markStatus(e._id, "closed")} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700">
                          Close
                        </button>
                      )}
                      <button onClick={() => remove(e._id)} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-red-500 hover:border-red-400">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-900/40">No enquiries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl2 w-full max-w-lg p-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 text-ink-900/40 hover:text-ink-900"
            >
              <HiOutlineX />
            </button>

            <h2 className="font-display text-xl text-ink-900 mb-1">Enquiry Details</h2>
            <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full capitalize mb-5 ${statusColor[selected.status]}`}>
              {selected.status}
            </span>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-900/40">Customer Name</p>
                <p className="mt-1 text-ink-900 font-medium">{selected.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-900/40">Phone Number</p>
                <p className="mt-1 text-ink-900">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-900/40">Email</p>
                <p className="mt-1 text-ink-900">{selected.email || "Not Provided"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-900/40">Message</p>
                <p className="mt-1 text-ink-900 whitespace-pre-wrap leading-relaxed">
                  {selected.message || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-900/40">Date</p>
                <p className="mt-1 text-ink-900">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-7">
              {selected.status !== "contacted" && (
                <button onClick={() => markStatus(selected._id, "contacted")} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700">
                  Mark Contacted
                </button>
              )}
              {selected.status !== "closed" && (
                <button onClick={() => markStatus(selected._id, "closed")} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700">
                  Close
                </button>
              )}
              <button onClick={() => remove(selected._id)} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-red-500 hover:border-red-400">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEnquiries;
