import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const AdminSettings = () => {
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [heroBanner, setHeroBanner] = useState(null);
  const [aboutSectionImage, setAboutSectionImage] = useState(null);
  const [removeAboutSectionImage, setRemoveAboutSectionImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setForm(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSocialChange = (platform, value) =>
    setForm({
      ...form,
      socialLinks: { ...form.socialLinks, [platform]: value },
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      ["companyName", "phone", "whatsapp", "email", "address", "aboutContent", "mission", "vision", "mapEmbedUrl", "gstNumber"].forEach(
        (field) => fd.append(field, form[field] || "")
      );
      fd.append(
        "socialLinks",
        JSON.stringify({
          instagram: form.socialLinks?.instagram || "",
          x: form.socialLinks?.x || "",
          linkedin: form.socialLinks?.linkedin || "",
          facebook: form.socialLinks?.facebook || "",
        })
      );
      if (logo) fd.append("logo", logo);
      if (heroBanner) fd.append("heroBanner", heroBanner);
      if (aboutSectionImage) fd.append("aboutSectionImage", aboutSectionImage);
      if (removeAboutSectionImage) fd.append("removeAboutSectionImage", "true");

      const res = await api.put("/settings", fd);
      setForm(res.data.data);
      setAboutSectionImage(null);
      setRemoveAboutSectionImage(false);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl text-ink-900 mb-8">Website Settings</h1>

      <form onSubmit={handleSubmit} className="card-surface p-8 space-y-6 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Company Name</label>
            <input value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Phone Number</label>
            <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">WhatsApp Number</label>
            <input value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Email</label>
            <input value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-900/40">Address</label>
          <textarea value={form.address} onChange={(e) => handleChange("address", e.target.value)} rows={2} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-900/40">Google Map Embed URL</label>
          <input value={form.mapEmbedUrl} onChange={(e) => handleChange("mapEmbedUrl", e.target.value)} placeholder="https://www.google.com/maps?...&output=embed" className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-900/40">GST Number</label>
          <input value={form.gstNumber || ""} onChange={(e) => handleChange("gstNumber", e.target.value)} placeholder="24AAAGM0289C1ZP" className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-900/40 block mb-3">Social Media Links</label>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-ink-900/40">Instagram</label>
              <input type="url" value={form.socialLinks?.instagram || ""} onChange={(e) => handleSocialChange("instagram", e.target.value)} placeholder="https://instagram.com/alyonabags" className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-900/40">X (Twitter)</label>
              <input type="url" value={form.socialLinks?.x || ""} onChange={(e) => handleSocialChange("x", e.target.value)} placeholder="https://x.com/alyonabags" className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-900/40">LinkedIn</label>
              <input type="url" value={form.socialLinks?.linkedin || ""} onChange={(e) => handleSocialChange("linkedin", e.target.value)} placeholder="https://linkedin.com/company/alyonabags" className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-900/40">Facebook</label>
              <input type="url" value={form.socialLinks?.facebook || ""} onChange={(e) => handleSocialChange("facebook", e.target.value)} placeholder="https://facebook.com/alyonabags" className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-900/40">About Us Content</label>
          <textarea value={form.aboutContent} onChange={(e) => handleChange("aboutContent", e.target.value)} rows={4} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Mission</label>
            <textarea value={form.mission} onChange={(e) => handleChange("mission", e.target.value)} rows={3} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Vision</label>
            <textarea value={form.vision} onChange={(e) => handleChange("vision", e.target.value)} rows={3} className="mt-1.5 w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Company Logo</label>
            {form.logo?.url && <img src={form.logo.url} alt="Logo" className="mt-2 h-10" />}
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="mt-2 w-full text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-900/40">Hero Banner</label>
            {form.heroBanner?.url && <img src={form.heroBanner.url} alt="Hero" className="mt-2 h-16 rounded-lg object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => setHeroBanner(e.target.files[0])} className="mt-2 w-full text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-900/40 block mb-2">
            Home Page — About Alyona Bags Section Image
          </label>
          {form.aboutSectionImage?.url && !removeAboutSectionImage ? (
            <img
              src={form.aboutSectionImage.url}
              alt="About Alyona Bags section"
              className="h-32 rounded-lg object-cover border border-stone-200"
            />
          ) : (
            <div className="h-32 w-32 rounded-lg border border-dashed border-stone-300 flex items-center justify-center text-xs text-ink-900/40">
              No image set
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setAboutSectionImage(e.target.files[0]);
              if (e.target.files[0]) setRemoveAboutSectionImage(false);
            }}
            className="mt-2 w-full text-sm"
          />
          {form.aboutSectionImage?.url && (
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-900/60">
              <input
                type="checkbox"
                checked={removeAboutSectionImage}
                onChange={(e) => {
                  setRemoveAboutSectionImage(e.target.checked);
                  if (e.target.checked) setAboutSectionImage(null);
                }}
              />
              Remove current image
            </label>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </AdminLayout>
  );
};

export default AdminSettings;
