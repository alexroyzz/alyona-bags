import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const emptyForm = { name: "", description: "", isActive: true, image: null };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, isActive: cat.isActive, image: null });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description || "");
      fd.append("isActive", form.isActive);
      if (form.image) fd.append("image", form.image);

      if (editing) {
        await api.put(`/categories/${editing._id}`, fd);
        toast.success("Category updated");
      } else {
        await api.post("/categories", fd);
        toast.success("Category created");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ink-900">Categories</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5 !px-5 text-sm">
          <HiOutlinePlus /> Add Category
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div key={cat._id} className="card-surface overflow-hidden">
              <div className="aspect-video bg-stone-100">
                {cat.image?.url && <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-ink-900">{cat.name}</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${cat.isActive ? "bg-forest-600/10 text-forest-700" : "bg-stone-200 text-ink-900/40"}`}>
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-ink-900/50 line-clamp-2">{cat.description}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(cat)} className="flex-1 text-xs flex items-center justify-center gap-1.5 py-2 rounded-lg border border-stone-200 hover:border-forest-700 transition-colors">
                    <HiOutlinePencil /> Edit
                  </button>
                  <button onClick={() => handleDelete(cat)} className="flex-1 text-xs flex items-center justify-center gap-1.5 py-2 rounded-lg border border-stone-200 text-red-500 hover:border-red-400 transition-colors">
                    <HiOutlineTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-ink-900/40 col-span-full">No categories yet.</p>}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl2 w-full max-w-md p-7 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-ink-900/40 hover:text-ink-900">
              <HiOutlineX />
            </button>
            <h2 className="font-display text-xl text-ink-900 mb-5">{editing ? "Edit Category" : "New Category"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Category name"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                className="w-full text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-ink-900/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active (visible to customers)
              </label>
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
                {saving ? "Saving..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategories;
