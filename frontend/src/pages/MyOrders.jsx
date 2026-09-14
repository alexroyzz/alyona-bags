import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineShoppingBag, HiOutlineChevronRight } from "react-icons/hi";
import userApi from "../api/userAxios.js";
import Loader from "../components/Loader.jsx";
import { OrderCardSkeleton } from "../components/Skeletons.jsx";

const statusLabel = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColor = {
  placed: "bg-stone-200 text-ink-900/70",
  confirmed: "bg-forest-700/10 text-forest-700",
  processing: "bg-forest-700/10 text-forest-700",
  shipped: "bg-brass-400/20 text-brass-500",
  delivered: "bg-forest-700/15 text-forest-700",
  cancelled: "bg-red-500/10 text-red-600",
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .get("/orders/mine")
      .then((res) => setOrders(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-32 pb-24 container-px">
      <span className="eyebrow">Order History</span>
      <h1 className="mt-3 font-display text-4xl text-ink-900">My Orders</h1>

      {loading ? (
        <div className="mt-12 space-y-5">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-16 text-center py-20 card-surface">
          <HiOutlineShoppingBag className="text-5xl text-ink-900/20 mx-auto" />
          <p className="mt-4 text-ink-900/50">You haven't placed any orders yet.</p>
          <Link to="/categories" className="btn-primary mt-6 inline-flex">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-5">
          {orders.map((o) => {
            const totalQty = o.items.reduce((sum, it) => sum + it.quantity, 0);
            const visibleImages = o.items.slice(0, 2);
            const extraCount = o.items.length - visibleImages.length;

            return (
              <Link
                key={o._id}
                to={`/my-orders/${o._id}`}
                className="card-surface p-6 flex flex-wrap items-center gap-6 hover:shadow-soft transition-shadow group"
              >
                {/* Images */}
                <div className="flex items-center -space-x-3 shrink-0">
                  {visibleImages.map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover bg-stone-100 border-2 border-white shadow-sm"
                    />
                  ))}
                  {extraCount > 0 && (
                    <div className="w-16 h-16 rounded-xl bg-ink-900/80 border-2 border-white flex items-center justify-center text-white text-xs font-medium shrink-0">
                      +{extraCount} More
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-[180px]">
                  <p className="font-display text-base text-ink-900 truncate">
                    {o.items[0].name}
                    {o.items.length > 1 ? ` and ${o.items.length - 1} more item${o.items.length > 2 ? "s" : ""}` : ""}
                  </p>
                  <p className="text-xs text-ink-900/40 mt-1.5">
                    Order #{o.orderNumber} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {totalQty} item{totalQty > 1 ? "s" : ""}
                  </p>
                </div>

                {/* Status + total */}
                <div className="flex items-center gap-5 ml-auto">
                  <span
                    className={`text-[11px] px-3 py-1.5 rounded-full font-medium ${statusColor[o.orderStatus] || "bg-stone-200 text-ink-900/60"}`}
                  >
                    {statusLabel[o.orderStatus] || o.orderStatus}
                  </span>
                  <span className="font-display text-lg text-ink-900 whitespace-nowrap">
                    ₹{o.total.toLocaleString("en-IN")}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-forest-700 group-hover:gap-1.5 transition-all">
                    View Details <HiOutlineChevronRight />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
