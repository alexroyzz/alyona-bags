import { Link } from "react-router-dom";
import { HiOutlineHeart } from "react-icons/hi";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import Loader from "../components/Loader.jsx";
import WishlistButton from "../components/WishlistButton.jsx";

const WishlistPage = () => {
  const { wishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const products = wishlist.products || [];

  if (loading) return <Loader full />;

  return (
    <div className="pt-32 pb-24 container-px">
      <span className="eyebrow">Saved Items</span>
      <h1 className="mt-3 font-display text-4xl text-ink-900">Your Wishlist</h1>

      {products.length === 0 ? (
        <div className="mt-16 text-center py-16">
          <HiOutlineHeart className="text-5xl text-ink-900/20 mx-auto" />
          <p className="mt-4 text-ink-900/50">Nothing saved yet.</p>
          <Link to="/categories" className="btn-primary mt-6 inline-flex">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const price = p.discountPrice > 0 ? p.discountPrice : p.price;
            return (
              <div key={p._id} className="card-surface overflow-hidden group">
                <div className="relative aspect-[4/5] bg-stone-100">
                  <Link to={`/products/${p.slug}`}>
                    <img src={p.images?.[0]?.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <WishlistButton productId={p._id} className="absolute top-3 right-3" />
                </div>
                <div className="p-5">
                  <Link to={`/products/${p.slug}`}>
                    <h3 className="font-display text-base text-ink-900 leading-snug">{p.name}</h3>
                  </Link>
                  <p className="mt-1.5 text-sm text-ink-900">₹{price?.toLocaleString("en-IN")}</p>
                  <button onClick={() => addToCart(p._id, 1)} className="btn-secondary w-full mt-3 !py-2 text-xs">
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
