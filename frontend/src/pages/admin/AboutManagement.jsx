import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
} from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const emptyStat = () => ({ label: "", value: "" });
const emptyChecklistItem = () => "";

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs uppercase tracking-widest text-ink-900/40">{label}</label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const inputCls =
  "w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm";

const AdminAboutManagement = () => {
  const [form, setForm] = useState(null);
  const [stats, setStats] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [manufacturingImage, setManufacturingImage] = useState(null);
  const [qualityVideo, setQualityVideo] = useState(null);
  const [qualityPoster, setQualityPoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAbout = async () => {
    setLoading(true);
    try {
      const res = await api.get("/about");
      setForm(res.data.data);
      setStats(
        [...(res.data.data.impactStats || [])].sort((a, b) => a.order - b.order)
      );
      setChecklist([...(res.data.data.qualityControl?.checklist || [])]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbout();
  }, []);

  const set = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateStat = (index, field, value) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addStat = () => setStats((prev) => [...prev, emptyStat()]);

  const removeStat = (index) => setStats((prev) => prev.filter((_, i) => i !== index));

  const moveStat = (index, direction) => {
    setStats((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateChecklistItem = (index, value) =>
    setChecklist((prev) => prev.map((c, i) => (i === index ? value : c)));

  const addChecklistItem = () => setChecklist((prev) => [...prev, emptyChecklistItem()]);

  const removeChecklistItem = (index) =>
    setChecklist((prev) => prev.filter((_, i) => i !== index));

  const moveChecklistItem = (index, direction) => {
    setChecklist((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      const textFields = [
        "story.heading",
        "story.text",
        "manufacturing.eyebrow",
        "manufacturing.heading",
        "manufacturing.text",
        "qualityControl.eyebrow",
        "qualityControl.heading",
        "qualityControl.text",
        "impact.eyebrow",
        "impact.heading",
        "cta.eyebrow",
        "cta.heading",
        "cta.description",
        "cta.buttonText",
      ];
      textFields.forEach((path) => {
        const keys = path.split(".");
        let value = form;
        keys.forEach((k) => (value = value?.[k]));
        fd.append(path, value || "");
      });

      const cleanStats = stats.filter((s) => s.label.trim() && s.value.trim());
      fd.append("impactStats", JSON.stringify(cleanStats));

      const cleanChecklist = checklist.map((c) => c.trim()).filter(Boolean);
      fd.append("qualityChecklist", JSON.stringify(cleanChecklist));

      if (manufacturingImage) fd.append("manufacturingImage", manufacturingImage);
      if (qualityVideo) fd.append("qualityVideo", qualityVideo);
      if (qualityPoster) fd.append("qualityPoster", qualityPoster);

      const res = await api.put("/about", fd);
      setForm(res.data.data);
      setStats([...(res.data.data.impactStats || [])].sort((a, b) => a.order - b.order));
      setChecklist([...(res.data.data.qualityControl?.checklist || [])]);
      setManufacturingImage(null);
      setQualityVideo(null);
      setQualityPoster(null);
      toast.success("About Us page updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save changes");
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
      <h1 className="font-display text-2xl text-ink-900 mb-8">About Us Page</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Our Story */}
        <div className="card-surface p-8 space-y-5">
          <h2 className="font-display text-lg text-ink-900">Our Story</h2>
          <Field label="Heading">
            <textarea
              rows={2}
              value={form.story.heading}
              onChange={(e) => set("story.heading", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={4}
              value={form.story.text}
              onChange={(e) => set("story.text", e.target.value)}
              className={`${inputCls} resize-none`}
            />
            <p className="mt-1.5 text-xs text-ink-900/35">
              Leave a blank line between paragraphs.
            </p>
          </Field>
        </div>

        {/* Manufacturing */}
        <div className="card-surface p-8 space-y-5">
          <h2 className="font-display text-lg text-ink-900">Manufacturing</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Eyebrow">
              <input
                value={form.manufacturing.eyebrow}
                onChange={(e) => set("manufacturing.eyebrow", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Heading">
              <input
                value={form.manufacturing.heading}
                onChange={(e) => set("manufacturing.heading", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={5}
              value={form.manufacturing.text}
              onChange={(e) => set("manufacturing.text", e.target.value)}
              className={`${inputCls} resize-none`}
            />
            <p className="mt-1.5 text-xs text-ink-900/35">
              Leave a blank line between paragraphs.
            </p>
          </Field>
          <Field label="Manufacturing Image">
            {form.manufacturing.image?.url && (
              <img
                src={form.manufacturing.image.url}
                alt="Manufacturing"
                className="mb-2 h-28 rounded-lg object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setManufacturingImage(e.target.files[0])}
              className="w-full text-sm"
            />
          </Field>
        </div>

        {/* Quality Control */}
        <div className="card-surface p-8 space-y-5">
          <h2 className="font-display text-lg text-ink-900">Quality Control</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Eyebrow">
              <input
                value={form.qualityControl.eyebrow}
                onChange={(e) => set("qualityControl.eyebrow", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Heading">
              <input
                value={form.qualityControl.heading}
                onChange={(e) => set("qualityControl.heading", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={3}
              value={form.qualityControl.text}
              onChange={(e) => set("qualityControl.text", e.target.value)}
              className={`${inputCls} resize-none`}
            />
            <p className="mt-1.5 text-xs text-ink-900/35">
              Leave a blank line between paragraphs.
            </p>
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Quality Control Video">
              {form.qualityControl.video?.url && (
                <video
                  src={form.qualityControl.video.url}
                  className="mb-2 h-28 rounded-lg object-cover w-full bg-ink-900"
                  muted
                />
              )}
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setQualityVideo(e.target.files[0])}
                className="w-full text-sm"
              />
            </Field>
            <Field label="Video Poster / Thumbnail">
              {form.qualityControl.poster?.url && (
                <img
                  src={form.qualityControl.poster.url}
                  alt="Poster"
                  className="mb-2 h-28 rounded-lg object-cover w-full"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setQualityPoster(e.target.files[0])}
                className="w-full text-sm"
              />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-ink-900/40">
                Checklist
              </label>
              <button
                type="button"
                onClick={addChecklistItem}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-forest-700 transition-colors"
              >
                <HiOutlinePlus /> Add Item
              </button>
            </div>
            <div className="mt-2 space-y-2.5">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveChecklistItem(i, -1)}
                      disabled={i === 0}
                      className="text-ink-900/40 hover:text-ink-900 disabled:opacity-20"
                      aria-label="Move up"
                    >
                      <HiOutlineChevronUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveChecklistItem(i, 1)}
                      disabled={i === checklist.length - 1}
                      className="text-ink-900/40 hover:text-ink-900 disabled:opacity-20"
                      aria-label="Move down"
                    >
                      <HiOutlineChevronDown />
                    </button>
                  </div>
                  <input
                    value={item}
                    onChange={(e) => updateChecklistItem(i, e.target.value)}
                    placeholder="e.g. Every batch checked against the original spec sheet"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(i)}
                    className="text-red-400 hover:text-red-500 shrink-0"
                    aria-label="Delete item"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
              {checklist.length === 0 && (
                <p className="text-sm text-ink-900/40">No checklist items yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Our Impact */}
        <div className="card-surface p-8 space-y-5">
          <h2 className="font-display text-lg text-ink-900">Our Impact — Heading</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Eyebrow">
              <input
                value={form.impact.eyebrow}
                onChange={(e) => set("impact.eyebrow", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Heading">
              <input
                value={form.impact.heading}
                onChange={(e) => set("impact.heading", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="card-surface p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Our Impact — Statistics</h2>
            <button
              type="button"
              onClick={addStat}
              className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 hover:border-forest-700 transition-colors"
            >
              <HiOutlinePlus /> Add Stat
            </button>
          </div>

          <div className="space-y-3">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveStat(i, -1)}
                    disabled={i === 0}
                    className="text-ink-900/40 hover:text-ink-900 disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <HiOutlineChevronUp />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStat(i, 1)}
                    disabled={i === stats.length - 1}
                    className="text-ink-900/40 hover:text-ink-900 disabled:opacity-20"
                    aria-label="Move down"
                  >
                    <HiOutlineChevronDown />
                  </button>
                </div>
                <input
                  placeholder="Value (e.g. 12+)"
                  value={stat.value}
                  onChange={(e) => updateStat(i, "value", e.target.value)}
                  className={`${inputCls} w-32`}
                />
                <input
                  placeholder="Label (e.g. Years)"
                  value={stat.label}
                  onChange={(e) => updateStat(i, "label", e.target.value)}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeStat(i)}
                  className="text-red-400 hover:text-red-500 shrink-0"
                  aria-label="Delete stat"
                >
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
            {stats.length === 0 && (
              <p className="text-sm text-ink-900/40">No statistics yet. Add one above.</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="card-surface p-8 space-y-5">
          <h2 className="font-display text-lg text-ink-900">Built For Your Brand — CTA</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Eyebrow">
              <input
                value={form.cta.eyebrow}
                onChange={(e) => set("cta.eyebrow", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Heading">
              <input
                value={form.cta.heading}
                onChange={(e) => set("cta.heading", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={2}
              value={form.cta.description}
              onChange={(e) => set("cta.description", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Primary Button Text">
            <input
              value={form.cta.buttonText}
              onChange={(e) => set("cta.buttonText", e.target.value)}
              className={inputCls}
            />
          </Field>
          <p className="text-xs text-ink-900/35">
            The WhatsApp Inquiry and Call Now buttons use the phone / WhatsApp numbers set in
            Website Settings.
          </p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving..." : "Save About Us Page"}
        </button>
      </form>
    </AdminLayout>
  );
};

export default AdminAboutManagement;
