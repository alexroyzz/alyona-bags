import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineX } from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const statusColor = {
  placed: "bg-brass-500/10 text-brass-500",
  confirmed: "bg-forest-600/10 text-forest-700",
  processing: "bg-forest-600/10 text-forest-700",
  shipped: "bg-forest-600/10 text-forest-700",
  delivered: "bg-forest-700/10 text-forest-700",
  cancelled: "bg-red-500/10 text-red-600",
};

const statusOptions = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusForm, setStatusForm] = useState({
    orderStatus: "",
    trackingNumber: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders", {
        params: filter ? { status: filter } : {},
      });
      setOrders(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const openOrder = (order) => {
    setSelected(order);
    setStatusForm({
      orderStatus: order.orderStatus,
      trackingNumber: order.trackingNumber || "",
      note: "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/orders/${selected._id}`, statusForm);
      toast.success("Order updated");
      setSelected(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/orders/${deleteTarget._id}`);
      toast.success("Order permanently deleted");
      setDeleteTarget(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ink-900">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-stone-200 text-sm"
        >
          <option value="">All Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left text-xs uppercase tracking-wider text-ink-900/50">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="px-5 py-3 font-medium text-ink-900">
                    {o.orderNumber}
                  </td>
                  <td className="px-5 py-3 text-ink-900/60">{o.user?.name}</td>
                  <td className="px-5 py-3 text-ink-900/60">
                    ₹{o.total.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${o.paymentStatus === "paid" ? "bg-forest-600/10 text-forest-700" : "bg-stone-200 text-ink-900/50"}`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusColor[o.orderStatus]}`}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-900/50">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openOrder(o)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700"
                      >
                        Manage
                      </button>
                      {o.orderStatus === "cancelled" && (
                        <button
                          onClick={() => setDeleteTarget(o)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:border-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-ink-900/40"
                  >
                    No orders found.
                  </td>
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
            <h2 className="font-display text-xl text-ink-900 mb-1">
              {selected.orderNumber}
            </h2>
            <p className="text-sm text-ink-900/50 mb-5">
              {selected.user?.name} · {selected.user?.email}
            </p>

            <div className="mb-5 space-y-4">
              {selected.items.map((it, i) => (
                <div
                  key={i}
                  className="border border-stone-200 rounded-xl p-4 bg-stone-50"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-24 h-24 rounded-lg border object-cover bg-white"
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-ink-900">
                        {it.name}
                      </h4>

                      <div className="mt-2 space-y-1 text-sm text-ink-900/70">
                        <p>
                          <strong>Quantity:</strong> {it.quantity}
                        </p>

                        <p>
                          <strong>Unit Price:</strong> ₹
                          {it.price.toLocaleString("en-IN")}
                        </p>

                        <p>
                          <strong>Total:</strong> ₹
                          {(it.price * it.quantity).toLocaleString("en-IN")}
                        </p>

                        {it.color && (
                          <p>
                            <strong>Color:</strong> {it.color}
                          </p>
                        )}

                        <p>
                          <strong>Printing:</strong>{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              it.printingType === "custom"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {it.printingType === "custom"
                              ? "Custom Logo Print"
                              : "Plain Product"}
                          </span>
                        </p>
                      </div>

                      {/* Uploaded Logo */}
                      {it.logo?.url ? (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">
                            Customer Uploaded Logo
                          </p>

                          <a
                            href={it.logo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={it.logo.url}
                              alt="Customer Logo"
                              className="w-28 h-28 border rounded-lg object-contain bg-white hover:scale-105 transition"
                            />
                          </a>

                          <p className="text-xs text-gray-500 mt-1">
                            Click to view full size
                          </p>
                        </div>
                      ) : (
                        it.printingType === "custom" && (
                          <div className="mt-4">
                            <p className="text-sm text-red-600">
                              ⚠ Customer selected Custom Logo Print but no logo
                              was uploaded.
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <select
                value={statusForm.orderStatus}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, orderStatus: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
              <input
                value={statusForm.trackingNumber}
                onChange={(e) =>
                  setStatusForm({
                    ...statusForm,
                    trackingNumber: e.target.value,
                  })
                }
                placeholder="Tracking number (optional)"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm"
              />
              <input
                value={statusForm.note}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, note: e.target.value })
                }
                placeholder="Internal note (optional)"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm"
              />
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update Order"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl2 w-full max-w-md p-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !deleting && setDeleteTarget(null)}
              className="absolute top-5 right-5 text-ink-900/40 hover:text-ink-900"
            >
              <HiOutlineX />
            </button>
            <h2 className="font-display text-xl text-ink-900 mb-3">
              Permanently Delete Order
            </h2>
            <p className="text-sm text-ink-900/70 mb-1">
              Are you sure you want to permanently delete this cancelled
              order? This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-ink-900 mt-3 mb-6">
              Order ID: {deleteTarget.orderNumber}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-stone-200 hover:border-ink-900/30 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
