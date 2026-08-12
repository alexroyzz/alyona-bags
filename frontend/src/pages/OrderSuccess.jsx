import { Link, useLocation } from "react-router-dom";
import { HiOutlineCheckCircle } from "react-icons/hi";

const OrderSuccess = () => {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div className="pt-32 pb-24 container-px min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <HiOutlineCheckCircle className="text-6xl text-forest-700 mx-auto" />
        <h1 className="mt-6 font-display text-3xl text-ink-900">Order Placed!</h1>
        <p className="mt-3 text-ink-900/60">
          {order ? (
            <>Your order <strong>{order.orderNumber}</strong> has been confirmed. A confirmation email is on its way.</>
          ) : (
            "Your order has been confirmed."
          )}
        </p>
        {order && (
          <p className="mt-2 text-2xl font-display text-ink-900">₹{order.total?.toLocaleString("en-IN")}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/my-orders" className="btn-primary">View My Orders</Link>
          <Link to="/categories" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
