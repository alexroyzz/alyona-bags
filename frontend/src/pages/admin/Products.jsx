import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const emptyForm = {
  name: "",
  category: "",
  moq: "",
  material: "",
  colors: "",
  description: "",
  features: "",
  stockStatus: "in_stock",
  isFeatured: false,
  isActive: true,
  price: "",
  discountPrice: "",
  sku: "",
  stockQuantity: "",
  allowCustomPrint: false,


  newImages: [],
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products", { params: { limit: 100 } }),
        api.get("/categories"),
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setRemoveImageIds([]);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category?._id || "",
      moq: p.moq,
      material: p.material,
      colors: (p.colors || []).join(", "),
      description: p.description,
      features: (p.features || []).join(", "),
      stockStatus: p.stockStatus,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      price: p.price ?? "",
      discountPrice: p.discountPrice ?? "",
      sku: p.sku || "",
      stockQuantity: p.stockQuantity ?? "",
      allowCustomPrint: p.allowCustomPrint || false,

      newImages: [],
    });
    setRemoveImageIds([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("moq", form.moq);
      fd.append("material", form.material);
      fd.append(
        "colors",
        JSON.stringify(
          form.colors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        ),
      );
      fd.append("description", form.description);
      fd.append(
        "features",
        JSON.stringify(
          form.features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean),
        ),
      );
      fd.append("stockStatus", form.stockStatus);
      fd.append("isFeatured", form.isFeatured);
      fd.append("isActive", form.isActive);
      fd.append("price", form.price);
      fd.append("discountPrice", form.discountPrice || 0);
      fd.append("sku", form.sku || "");
      fd.append("stockQuantity", form.stockQuantity || 0);
      fd.append("allowCustomPrint", form.allowCustomPrint);

      form.newImages.forEach((file) => fd.append("images", file));
      if (editing && removeImageIds.length)
        fd.append("removeImageIds", JSON.stringify(removeImageIds));

      if (editing) {
        await api.put(`/products/${editing._id}`, fd);
        toast.success("Product updated");
      } else {
        await api.post("/products", fd);
        toast.success("Product created");
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success("Product deleted");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ink-900">Products</h1>
        <button
          onClick={openCreate}
          className="btn-primary !py-2.5 !px-5 text-sm"
        >
          <HiOutlinePlus /> Add Product
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left text-xs uppercase tracking-wider text-ink-900/50">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">MOQ</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Featured</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="px-5 py-3 flex items-center gap-3">
                    <img
                      src={p.images?.[0]?.url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-stone-100"
                    />
                    <span className="text-ink-900 font-medium">{p.name}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-900/60">
                    {p.category?.name}
                  </td>
                  <td className="px-5 py-3 text-ink-900/60">{p.moq}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${p.isActive ? "bg-forest-600/10 text-forest-700" : "bg-stone-200 text-ink-900/40"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">{p.isFeatured ? "★" : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg border border-stone-200 hover:border-forest-700"
                      >
                        <HiOutlinePencil />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-2 rounded-lg border border-stone-200 text-red-500 hover:border-red-400"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-ink-900/40"
                  >
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl2 w-full max-w-2xl p-7 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-ink-900/40 hover:text-ink-900"
            >
              <HiOutlineX />
            </button>
            <h2 className="font-display text-xl text-ink-900 mb-5">
              {editing ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Product name"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={form.moq}
                  onChange={(e) => setForm({ ...form, moq: e.target.value })}
                  placeholder="MOQ e.g. 50 pcs"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  required
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                  placeholder="Material"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Price (₹)"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  type="number"
                  min="0"
                  value={form.discountPrice}
                  onChange={(e) =>
                    setForm({ ...form, discountPrice: e.target.value })
                  }
                  placeholder="Sale price (₹, optional)"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU (optional)"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: e.target.value })
                  }
                  placeholder="Stock quantity"
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
              </div>
              <input
                value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })}
                placeholder="Colors, comma separated (e.g. Black, Tan, Olive)"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
              />
              <textarea
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none"
              />
              <input
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder="Features, comma separated"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
              />

              <div className="grid sm:grid-cols-3 gap-4 items-center">
                <select
                  value={form.stockStatus}
                  onChange={(e) =>
                    setForm({ ...form, stockStatus: e.target.value })
                  }
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="limited">Limited Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-ink-900/70">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                  />{" "}
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-900/70">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />{" "}
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-900/70">
                  <input
                    type="checkbox"
                    checked={form.allowCustomPrint}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        allowCustomPrint: e.target.checked,
                      })
                    }
                  />
                  Custom Logo Printing
                </label>
              </div>
              {editing && editing.images?.length > 0 && (
                <div>
                  <p className="text-xs text-ink-900/50 mb-2">
                    Existing images (check to remove)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {editing.images.map((img) => (
                      <label key={img.publicId} className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className={`w-16 h-16 rounded-lg object-cover ${removeImageIds.includes(img.publicId) ? "opacity-30" : ""}`}
                        />
                        <input
                          type="checkbox"
                          className="absolute top-1 right-1"
                          checked={removeImageIds.includes(img.publicId)}
                          onChange={(e) => {
                            setRemoveImageIds((prev) =>
                              e.target.checked
                                ? [...prev, img.publicId]
                                : prev.filter((id) => id !== img.publicId),
                            );
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-ink-900/50 mb-2">
                  {editing ? "Add more images" : "Product images (up to 8)"}
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, newImages: Array.from(e.target.files) })
                  }
                  className="w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
