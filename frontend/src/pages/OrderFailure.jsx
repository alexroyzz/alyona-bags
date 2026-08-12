import { Link } from "react-router-dom";
import { HiOutlineXCircle } from "react-icons/hi";

const OrderFailure = () => (
  <div className="pt-32 pb-24 container-px min-h-[60vh] flex items-center justify-center">
    <div className="text-center max-w-md">
      <HiOutlineXCircle className="text-6xl text-red-500 mx-auto" />
      <h1 className="mt-6 font-display text-3xl text-ink-900">Payment Failed</h1>
      <p className="mt-3 text-ink-900/60">
        Something went wrong while processing your payment. No amount has been charged, or it will be
        automatically refunded within a few business days.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link to="/cart" className="btn-primary">Try Again</Link>
        <Link to="/contact" className="btn-secondary">Contact Support</Link>
      </div>
    </div>
  </div>
);

export default OrderFailure;
