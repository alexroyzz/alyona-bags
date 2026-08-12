import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineLocationMarker,
  HiOutlineCreditCard,
} from "react-icons/hi";
import userApi from "../api/userAxios.js";
import Loader from "../components/Loader.jsx";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext.jsx";

const trackSteps = ["placed", "confirmed", "processing", "shipped", "delivered"];

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reordering, setReordering] = useState(false);

  const handleCancelOrder = async () => {
    setCancelLoading(true);
    try {
      await userApi.patch(`/orders/mine/${order._id}/cancel`);
      const res = await userApi.get(`/orders/mine/${order._id}`);
      setOrder(res.data.data);
      toast.success("Order cancelled successfully.");
      setShowCancelModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to cancel order.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      for (const item of order.items) {
        // eslint-disable-next-line no-await-in-loop
        await addToCart({
          productId: item.product,
          quantity: item.quantity,
          color: item.color,
          printingType: item.printingType,
          instructions: item.instructions,
          logo: item.logo?.url ? item.logo : null,
        });
      }
      toast.success("Items added to your cart");
      navigate("/cart");
    } catch {
      toast.error("Some items could not be re-added — they may be unavailable now.");
    } finally {
      setReordering(false);
    }
  };

  useEffect(() => {
    userApi
      .get(`/orders/mine/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader full />;

  if (!order) {
    return (
      <div className="pt-40 pb-24 text-center container-px">
        <h2 className="font-display text-2xl text-ink-900">Order not found</h2>
        <Link to="/my-orders" className="mt-4 inline-block text-forest-700 underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = order.orderStatus === "cancelled" ? -1 : trackSteps.indexOf(order.orderStatus);

  return (
    <div className="pt-32 pb-24 container-px">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Order Details</span>
          <h1 className="mt-3 font-display text-3xl text-ink-900">{order.orderNumber}</h1>
          <p className="text-xs text-ink-900/40 mt-1.5">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {order.invoiceUrl && (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !py-3 !px-5 text-sm inline-flex items-center gap-2"
            >
              <HiOutlineDownload /> Invoice
            </a>
          )}
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="btn-secondary !py-3 !px-5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            <HiOutlineRefresh /> {reordering ? "Adding..." : "Reorder"}
          </button>
          {["placed", "confirmed"].includes(order.orderStatus) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-sm"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Tracking */}
      {order.orderStatus !== "cancelled" ? (
        <div className="mt-12 card-surface p-8">
          <h3 className="font-display text-lg text-ink-900 mb-8">Order Timeline</h3>
          <div className="flex items-center">
            {trackSteps.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i <= currentStepIndex ? "bg-forest-700 text-stone-50" : "bg-stone-200 text-ink-900/30"}`}
                  >
                    <HiOutlineCheckCircle className="text-lg" />
                  </div>
                  <span className={`mt-2 text-xs capitalize ${i <= currentStepIndex ? "text-ink-900" : "text-ink-900/30"}`}>
                    {step}
                  </span>
                </div>
                {i < trackSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? "bg-forest-700" : "bg-stone-200"}`} />
                )}
              </div>
            ))}
          </div>

          {order.trackingHistory?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-stone-200 space-y-3">
              {order.trackingHistory.map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-700 mt-2 shrink-0" />
                  <div>
                    <p className="text-ink-900 capitalize">{t.note || t.status}</p>
                    {t.at && (
                      <p className="text-xs text-ink-900/40 mt-0.5">
                        {new Date(t.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {order.trackingNumber && (
            <p className="mt-6 text-sm text-ink-900/60">
              Tracking number: <strong className="text-ink-900">{order.trackingNumber}</strong>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-12 card-surface p-6 bg-red-50 border-red-100">
          <p className="text-sm text-red-600 font-medium">This order was cancelled.</p>
        </div>
      )}

      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div>
          <h3 className="font-display text-lg text-ink-900 mb-5">Items</h3>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="card-surface p-5 flex gap-4">
                <img src={item.image} alt="" className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900">{item.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-ink-900/50">
                    {item.color && <span>Color: {item.color}</span>}
                    <span className="capitalize">
                      {item.printingType === "custom" ? "Custom Printing" : "Plain"}
                    </span>
                    <span>
                      Qty {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {(item.logo?.url || item.instructions) && (
                    <div className="mt-3 flex items-start gap-3">
                      {item.logo?.url && (
                        <img
                          src={item.logo.url}
                          alt="Uploaded logo"
                          className="w-12 h-12 rounded-md object-contain bg-stone-100 border border-stone-200 p-1 shrink-0"
                        />
                      )}
                      {item.instructions && (
                        <p className="text-xs text-ink-900/40 italic">"{item.instructions}"</p>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-sm text-ink-900 shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-6 card-surface p-5">
              <h4 className="text-xs font-medium text-ink-900/50 uppercase tracking-wide mb-2">
                Instructions for seller
              </h4>
              <p className="text-sm text-ink-900/70 italic">"{order.notes}"</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <h3 className="font-display text-base text-ink-900 mb-3 flex items-center gap-2">
              <HiOutlineLocationMarker className="text-forest-700" /> Shipping Address
            </h3>
            <p className="text-sm text-ink-900/70 leading-relaxed">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-display text-base text-ink-900 mb-3 flex items-center gap-2">
              <HiOutlineCreditCard className="text-forest-700" /> Price Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-900/60">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-forest-700">
                  <span>Discount</span>
                  <span>- ₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-900/60">Shipping</span>
                <span>{order.shippingFee > 0 ? `₹${order.shippingFee}` : "Free"}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-stone-200">
                <span>Total</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-900/40 capitalize">
              Payment: {order.paymentMethod} · {order.paymentStatus}
            </p>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-semibold text-ink-900">Cancel Order</h2>
            <p className="mt-3 text-sm text-gray-600 leading-6">
              Are you sure you want to cancel this order?
              <br />
              This action cannot be undone.
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2 rounded-xl border border-stone-300 hover:bg-stone-100"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
