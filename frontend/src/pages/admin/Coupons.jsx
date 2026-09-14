import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX } from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const emptyForm = { code: "", discountType: "percentage", discountValue: "", minOrderValue: "", maxDiscountAmount: "", expiresAt: "", usageLimit: "", isActive: true };

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get("/coupons");
      setCoupons(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/coupons", form);
      toast.success("Coupon created");
      setModalOpen(false);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await api.delete(`/coupons/${c._id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ink-900">Coupons</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary !py-2.5 !px-5 text-sm">
          <HiOutlinePlus /> Add Coupon
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left text-xs uppercase tracking-wider text-ink-900/50">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Min. Order</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td className="px-5 py-3 font-medium text-ink-900">{c.code}</td>
                  <td className="px-5 py-3 text-ink-900/60">{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td className="px-5 py-3 text-ink-900/60">₹{c.minOrderValue}</td>
                  <td className="px-5 py-3 text-ink-900/60">{c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ""}</td>
                  <td className="px-5 py-3 text-ink-900/60">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.isActive ? "bg-forest-600/10 text-forest-700" : "bg-stone-200 text-ink-900/40"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(c)} className="p-2 rounded-lg border border-stone-200 text-red-500 hover:border-red-400">
                      <HiOutlineTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-ink-900/40">No coupons yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl2 w-full max-w-md p-7 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-ink-900/40 hover:text-ink-900">
              <HiOutlineX />
            </button>
            <h2 className="font-display text-xl text-ink-900 mb-5">New Coupon</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Coupon code e.g. WELCOME10" className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="px-4 py-3 rounded-lg border border-stone-200 text-sm">
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
                <input required type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="Value" className="px-4 py-3 rounded-lg border border-stone-200 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="Min order value" className="px-4 py-3 rounded-lg border border-stone-200 text-sm" />
                <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="Max discount (%)" className="px-4 py-3 rounded-lg border border-stone-200 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="px-4 py-3 rounded-lg border border-stone-200 text-sm" />
                <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Usage limit" className="px-4 py-3 rounded-lg border border-stone-200 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-900/70">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
              </label>
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
                {saving ? "Saving..." : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCoupons;
